'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')
let moment = require('moment')

let PersistenceLayerBase = require('../persistence-layer/PersistenceLayerBase.js')
let TaskDefinition = require('./TaskDefinition.js')
let TaskRunner = require('./TaskRunner.js')


class TaskDispatcher {

    constructor({
        persistenceLayer,
        pollAtLeastEverySeconds,
        maxConcurrentTasks
    }) {

        // Persistence Layer

        if (persistenceLayer instanceof PersistenceLayerBase === false || persistenceLayer.constructor === PersistenceLayerBase) {
            throw new TypeError('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')
        }

        this._persistenceLayer = persistenceLayer
        this._pollAtLeastEverySeconds = _.isFinite(pollAtLeastEverySeconds) && pollAtLeastEverySeconds > 0 ? pollAtLeastEverySeconds : 60

        // Execution

        this._taskDefinitions = new Map()

        this.running = false
        this.nextPolling = null

        this.concurrentTasks = 0
        this.maxConcurrentTasks = _.isFinite(maxConcurrentTasks) && maxConcurrentTasks > 0 ? maxConcurrentTasks : 1

        this._taskRunner = new TaskRunner({ persistenceLayer })

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

        // TODO: Return promise

        this.running = true
        this._pollForTask()

    }

    stop() {

        // TODO: Return promise

        this.running = false
        this._cancelNextPolling()

    }

    _reachedMaxCapacity() {
        return this.concurrentTasks >= this.maxConcurrentTasks
    }

    _pollForTask() {

        this._cancelNextPolling()
        if (!this.running) {
            return
        }

        return BPromise.try(() => {
            return this._persistenceLayer.getNextPendingTask()
        })
            .catch((err) => {

                // FIXME: Handle error better
                console.error(err)

                return null

            })
            .then((task) => {

                if (task !== null) {

                    this._dispatchTask(task)

                    if (!this._reachedMaxCapacity()) {
                        return this._pollForTask()
                    }

                } else {

                    return BPromise.try(this._persistenceLayer.getNextPollingTime)
                        .catch((/*err*/) => {

                            // FIXME: Handle error better

                            return moment().unix() + this._pollAtLeastEverySeconds

                        })
                        .then((nextPollingTime) => {

                            let nextPollingInSeconds = nextPollingTime - moment().unix()
                            nextPollingInSeconds = nextPollingInSeconds < 0 ? 0 : nextPollingInSeconds
                            nextPollingInSeconds = nextPollingInSeconds > this._pollAtLeastEverySeconds ? this._pollAtLeastEverySeconds : nextPollingInSeconds

                            this.nextPolling = setTimeout(() => {

                                this._pollForTask()

                            }, nextPollingInSeconds*1000).unref()

                        })

                }

            })

    }

    _dispatchTask(task) {

        let taskDefinition = this._taskDefinitions.get(task.name)
        if (!taskDefinition) {

            this._persistenceLayer.cancelTaskProcessing({
                task,
                executionFailed: true,
                error: new Error(`Missing task definition for tasks named "${ task.name }"`)
            })
            return

        }

        this.concurrentTasks += 1

        this._taskRunner.run({ task, taskDefinition })
            .finally(() => {

                this.concurrentTasks -= 1

                // FIXME: Next polling is not invoked

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
