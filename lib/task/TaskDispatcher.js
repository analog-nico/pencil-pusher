'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')
let moment = require('moment')

let ExecutionContextBase = require('../execution-context/ExecutionContextBase.js')
let PersistenceLayerBase = require('../persistence-layer/PersistenceLayerBase.js')
let TaskDefinition = require('./TaskDefinition.js')
let TaskRunner = require('./TaskRunner.js')


class TaskDispatcher {

    constructor({
        persistenceLayer,
        pollAtLeastEverySeconds = 60,
        maxConcurrentTasks = 1
    }) {

        // Persistence Layer

        if (persistenceLayer instanceof PersistenceLayerBase === false || persistenceLayer.constructor === PersistenceLayerBase) {
            throw new TypeError('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')
        }

        this._persistenceLayer = persistenceLayer
        this._pollAtLeastEverySeconds = pollAtLeastEverySeconds

        // Execution Context

        this._executionContexts = {}

        // Execution

        this._taskDefinitions = {}

        this.running = false
        this.nextPolling = null

        this.concurrentTasks = 0
        this.maxConcurrentTasks = maxConcurrentTasks

        this.runner = new TaskRunner()

    }

    registerExecutionContext(name, executionContext) {

        if (!_.isString(name) || name.length === 0) {
            throw new TypeError('name must be a non-empty string')
        }

        if (executionContext instanceof ExecutionContextBase === false || executionContext.constructor === ExecutionContextBase) {
            throw new TypeError('executionContext must extend PencilPusher.ExecutionContextBase')
        }

        if (this._executionContexts[name]) {
            throw new Error(`An execution context named "${ name }" is already defined`)
        }

        this._executionContexts[name] = executionContext

    }

    defineTask(name, options) {

        if (!_.isString(name) || name.length === 0) {
            throw new TypeError('name must be a non-empty string')
        }

        if (this._taskDefinitions[name]) {
            throw new Error(`A task named "${ name }" is already defined`)
        }

        this._taskDefinitions[name] = new TaskDefinition(name, options)

    }

    scheduleTask({ name, input, due } = {}) {

        return BPromise.try(() => {

            if (!_.isString(name) || name.length === 0) {
                throw new TypeError('options.name must be a non-empty string.')
            }

            if (name in this._taskDefinitions === false) {
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

                    // TODO: Call setTaskProcessingTime

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

                            }, nextPollingInSeconds*1000)

                        })

                }

            })

    }

    _dispatchTask(task) {

        let taskDefinition = this._taskDefinitions[task.name]
        if (!taskDefinition) {

            this._persistenceLayer.cancelTaskProcessing({
                task,
                executionFailed: true,
                error: new Error(`No task definition for "${ task.name }" defined`)
            })
            return

        }

        this.concurrentTasks += 1

        BPromise.try(() => {
            return this._executionContexts[taskDefinition.getExecutionContext()].run(task, taskDefinition)
        })
            .then((output) => {

                this._persistenceLayer.finishTaskProcessing({
                    task,
                    retain: taskDefinition.shallRetain(),
                    retainUntil: taskDefinition.shallRetainUntil(),
                    storeOutput: taskDefinition.shallRetainOutput(),
                    output
                })

            })
            .catch((err) => {

                this._persistenceLayer.cancelTaskProcessing({
                    task,
                    executionFailed: true,
                    err
                })

            })
            .finally(() => {

                this.concurrentTasks -= 1

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
