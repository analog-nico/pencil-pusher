'use strict'

let ExecutionContextBase = require('./execution-context/ExecutionContextBase.js')
let MainExecutionContext = require('./execution-context/MainExecutionContext.js')
let MemoryPersistenceLayer = require('./persistence-layer/MemoryPersistenceLayer.js')
let PersistenceLayerBase = require('./persistence-layer/PersistenceLayerBase.js')
let TaskDispatcher = require('./task/TaskDispatcher.js')


class PencilPusher {

    constructor({ persistenceLayer } = {}) {

        this._taskDispatcher = new TaskDispatcher({ persistenceLayer })

        this.registerExecutionContext('main', new MainExecutionContext())

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

        return this._taskDispatcher.registerExecutionContext(name, executionContext)

    }

    defineTask(name, options) {

        return this._taskDispatcher.defineTask(name, options)

    }

    /**
     * Schedules a new task for execution.
     *
     * @param options
     * @returns Promise - Resolved if task was successfully scheduled
     */
    scheduleTask(options) {

        return this._taskDispatcher.scheduleTask(options)

    }

    /**
     * Starts the runtime
     *
     * @returns Promise
     */
    start() {

        return this._taskDispatcher.start()

    }

    /**
     * Stops the runtime
     *
     * @returns Promise
     */
    stop() {

        return this._taskDispatcher.stop()

    }

}

PencilPusher.ExecutionContextBase = ExecutionContextBase
PencilPusher.PersistenceLayerBase = PersistenceLayerBase
PencilPusher.MemoryPersistenceLayer = MemoryPersistenceLayer

module.exports = PencilPusher
