'use strict'

let _ = require('lodash')

let ExecutionContextBase = require('./execution-context/ExecutionContextBase.js')
let MemoryPersistenceLayer = require('./persistence-layer/MemoryPersistenceLayer.js')
let PersistenceLayerBase = require('./persistence-layer/PersistenceLayerBase.js')
let Task = require('./task/Task.js')
let TaskDispatcher = require('./task/TaskDispatcher.js')


class PencilPusher {

    constructor({ persistenceLayer } = {}) {

        if (persistenceLayer instanceof PersistenceLayerBase === false) {
            throw new TypeError('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')
        }

        this.persistenceLayer = persistenceLayer

        this.taskDefinitions = {}
        this.taskDispatcher = new TaskDispatcher({ persistenceLayer })

    }

    /**
     * Register an execution context for executing tasks.
     *
     * The following execution context implementations are registered by default:
     * - 'main' - Directly executed in the main node instance in which PencilPusher runs as well
     * - 'child one-off' - A child process that is started to run a single task only
     * - 'child reused' - One of multiple child processes that are kept alive to run tasks
     *
     * 'main' brings the least overhead but is not good for cpu intensive tasks.
     * Those should be executed in 'child reused' or for a guaranteed clean
     * environment but more overhead in 'child one-off'.
     *
     * Custom execution context implementations must extend PencilPusher.ExecutionContextBase
     * (E.g. one based on https://github.com/asvd/jailed would be interesting.)
     *
     * @param name
     * @param executionContext
     */
    registerExecutionContext(name, executionContext) {

    }

    defineTask(name, options) {

        if (!_.isString(name) || name.length === 0) {
            throw new Error('A name (string) is required.')
        }

        if (this.taskDefinitions[name]) {
            throw new Error(`A task named "${ name }" is already defined.`)
        }

        this.taskDefinitions[name] = new Task(name, options)

    }

    scheduleTask({ name, input, due } = {}) {

        if (!_.isString(name)) {
            throw new TypeError('options.name must be a string.')
        }

        if (name in this.taskDefinitions === false) {
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

        this.persistenceLayer.storeNewTask({ task })

    }

    start() {

        this.taskDispatcher.start()

    }

    stop() {

        this.taskDispatcher.stop()

    }

}

PencilPusher.ExecutionContextBase = ExecutionContextBase
PencilPusher.PersistenceLayerBase = PersistenceLayerBase
PencilPusher.MemoryPersistenceLayer = MemoryPersistenceLayer

module.exports = PencilPusher
