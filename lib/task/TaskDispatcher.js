'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')
let moment = require('moment')

let wrapPersistenceLayer = require('../persistence-layer/wrapper.js')
let PersistenceLayerBase = require('../persistence-layer/PersistenceLayerBase.js')
let TaskDefinition = require('./TaskDefinition.js')
let taskErrors = require('./errors.js')
let TaskRunner = require('./TaskRunner.js')


class TaskDispatcher {

    constructor({
        persistenceLayer,
        pollAtLeastEverySeconds,
        maxConcurrentTasks,
        errorMonitoring
    }) {

        // Persistence Layer

        if (persistenceLayer instanceof PersistenceLayerBase === false || persistenceLayer.constructor === PersistenceLayerBase) {
            throw new TypeError('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')
        }

        wrapPersistenceLayer(persistenceLayer, errorMonitoring)

        this._persistenceLayer = persistenceLayer
        this._pollAtLeastEverySeconds = _.isFinite(pollAtLeastEverySeconds) && pollAtLeastEverySeconds > 0 ? pollAtLeastEverySeconds : 60

        // Execution

        this._taskDefinitions = new Map()

        this.running = false
        this.nextPolling = null

        this.concurrentTasks = 0
        this.maxConcurrentTasks = _.isFinite(maxConcurrentTasks) && maxConcurrentTasks > 0 ? maxConcurrentTasks : 1

        this._taskRunner = new TaskRunner({ persistenceLayer, errorMonitoring })

        this._errorMonitoring = errorMonitoring

    }

    registerExecutionContext(name, executionContext) {

        return this._taskRunner.registerExecutionContext(name, executionContext)

    }

    defineTask(name, options) {

        if (!_.isString(name) || name.length === 0) {
            throw new TypeError('name must be a non-empty string')
        }

        if (this._taskDefinitions.has(name)) {
            throw new Error(`A task named "${ name }" is already defined`)
        }

        let taskDefinition = new TaskDefinition(name, options)

        this._taskRunner.validateTaskDefinition(taskDefinition)

        this._taskDefinitions.set(name, taskDefinition)

    }

    scheduleTask({ name, input, due } = {}) {

        let p = BPromise.try(() => {

            if (!_.isString(name) || name.length === 0) {
                throw new TypeError('options.name must be a non-empty string.')
            }

            if (!this._taskDefinitions.has(name)) {
                throw new Error(`No task definition for "${ name }" found.`)
            }

            if (_.isUndefined(input)) {
                throw new Error('options.input is required.')
            }

            if (!_.isFinite(due)) {
                throw new TypeError('options.due must be a finited number.')
            }

            let task = {
                name,
                input,
                due
            }

            return this._persistenceLayer.storeNewTask({ task })

        })

        p.then(() => {
            // TODO: Update next polling time according to `due` or even call getNextTask() directly
        })

        return p

    }

    start() {

        // Currently there is no reason to return a promise but eventually there will.
        // E.g. the execution context may take time to boot.

        return BPromise.try(() => {

            if (this.running) {
                return
            }

            this.running = true
            this._pollForTask()

        })

    }

    stop() {

        // Currently there is no reason to return a promise but eventually there will.
        // E.g. the execution context may take time to shut down.

        return BPromise.try(() => {

            if (!this.running) {
                return
            }

            this.running = false
            this._cancelNextPolling()

        })

    }

    _reachedMaxCapacity() {
        return this.concurrentTasks >= this.maxConcurrentTasks
    }

    _pollForTaskIn(seconds) {

        this.nextPolling = setTimeout(() => {

            this._pollForTask()

        }, seconds * 1000).unref()

    }

    _pollForTask() {

        this._cancelNextPolling()
        if (!this.running) {
            return
        }

        this._persistenceLayer.getNextPendingTask()
            .catch(() => {
                return null
            })
            .then((task) => {

                if (task !== null) {

                    this._dispatchTask(task)

                    if (!this._reachedMaxCapacity()) {
                        this._pollForTask()
                    }

                } else {

                    this._scheduleNextPolling()

                }

            })

    }

    _dispatchTask(task) {

        let taskDefinition = this._taskDefinitions.get(task.name)
        if (!taskDefinition) {

            let args = {
                task,
                executionFailed: true,
                error: new taskErrors.MissingTaskDefinitionError(task.name)
            }

            this._errorMonitoring(args.error)

            this._persistenceLayer.cancelTaskProcessing(args)
                .catch((/*err*/) => {
                    // Error was sent to the error monitoring already -> Can be ignored here
                })

            return

        }

        this.concurrentTasks += 1

        this._taskRunner.run({ task, taskDefinition })
            .finally(() => {

                this.concurrentTasks -= 1

                if (this.concurrentTasks === this.maxConcurrentTasks - 1) {
                    this._pollForTask()
                }

            })

    }

    _scheduleNextPolling() {

        return this._persistenceLayer.getNextPollingTime()
            .catch((/*err*/) => {
                return null
            })
            .then((nextPollingTime) => {

                let nextPollingInSeconds = nextPollingTime === null ? this._pollAtLeastEverySeconds : nextPollingTime - moment().unix()
                nextPollingInSeconds = nextPollingInSeconds < 0 ? 0 : nextPollingInSeconds
                nextPollingInSeconds = nextPollingInSeconds > this._pollAtLeastEverySeconds ? this._pollAtLeastEverySeconds : nextPollingInSeconds

                this._pollForTaskIn(nextPollingInSeconds)

            })

    }

    _cancelNextPolling() {

        if (this.nextPolling) {
            clearTimeout(this.nextPolling)
            this.nextPolling = null
        }

    }

}

module.exports = TaskDispatcher
