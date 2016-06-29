'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')

let ExecutionContextBase = require('../execution-context/ExecutionContextBase.js')


class TaskRunner {

    constructor({ persistenceLayer }) {

        this._persistenceLayer = persistenceLayer
        this._executionContexts = new Map()

    }

    registerExecutionContext(name, executionContext) {

        if (!_.isString(name) || name.length === 0) {
            throw new TypeError('name must be a non-empty string')
        }

        if (executionContext instanceof ExecutionContextBase === false || executionContext.constructor === ExecutionContextBase) {
            throw new TypeError('executionContext must extend PencilPusher.ExecutionContextBase')
        }

        if (this._executionContexts.has(name)) {
            throw new Error(`An execution context named "${ name }" is already defined`)
        }

        this._executionContexts.set(name, executionContext)

    }

    validateTaskDefinition(taskDefinition) {

        let contextName = taskDefinition.getExecutionContext()

        let executionContext = this._executionContexts.get(contextName)
        if (_.isUndefined(executionContext)) {
            throw new Error(`The execution context "${ contextName }" does not exist`)
        }

        // TODO: The child process execution contexts will require the implementation to be a path

    }

    run({ task, taskDefinition }) {

        return BPromise.try(() => {

            let until = taskDefinition.getProcessingUntil()

            return this._persistenceLayer.setTaskProcessingTime({ task, until })

        })
            .then(() => {

                let executionContext = this._executionContexts.get(taskDefinition.getExecutionContext())

                return executionContext.run(task, taskDefinition)

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

    }

}

module.exports = TaskRunner
