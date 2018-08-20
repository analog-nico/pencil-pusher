'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')
let moment = require('moment')

let ExecutionContextBase = require('../execution-context/ExecutionContextBase.js')
let taskErrors = require('./errors.js')


class TaskRunner {

    constructor({ persistenceLayer, errorMonitoring }) {

        this._persistenceLayer = persistenceLayer
        this._executionContexts = new Map()

        this._errorMonitoring = errorMonitoring

    }

    registerExecutionContext(name, executionContext) {

        if (!_.isString(name) || name.length === 0) {
            throw new TypeError('name must be a non-empty string')
        }

        if (this._executionContexts.has(name)) {
            throw new Error(`An execution context named "${ name }" is already defined`)
        }

        if (executionContext instanceof ExecutionContextBase === false || executionContext.constructor === ExecutionContextBase) {
            throw new TypeError('executionContext must extend PencilPusher.ExecutionContextBase')
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

        let [ started, until ] = taskDefinition.getProcessingUntil()

        let takingTooLongTimer = setTimeout(() => {
            takingTooLongTimer = null
            this._errorMonitoring(new taskErrors.TaskExecutionTakingTooLongError(started, until, task))
        }, (until - started) * 1000).unref()

        return this._persistenceLayer.setTaskProcessingTime({ task, until })
            .then(() => {

                // Validate input

                let validationResult = taskDefinition.validateInput(task.input)
                if (validationResult.valid === false) {

                    let validationErr = new taskErrors.InputValidationError(validationResult.errors, task.input, taskDefinition.getInputSchema(), task)

                    this._errorMonitoring(validationErr)

                    throw validationErr

                }

                // Execute task

                let executionContext = this._executionContexts.get(taskDefinition.getExecutionContext())

                return BPromise.try(() => {

                    return executionContext.run(task, taskDefinition)

                })
                    .catch((err) => {

                        let wrappedErr = new taskErrors.TaskExecutionFailedError(err, task)

                        this._errorMonitoring(wrappedErr)

                        throw wrappedErr

                    })

            })
            .then((output) => {

                // Validate output

                let validationResult = taskDefinition.validateOutput(output)
                if (validationResult.valid === false) {

                    let validationErr = new taskErrors.OutputValidationError(validationResult.errors, output, taskDefinition.getOutputSchema(), task)

                    this._errorMonitoring(validationErr)

                    throw validationErr

                }

                // Finish Task

                return this._persistenceLayer.finishTaskProcessing({
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
                    .catch((/*err*/) => {
                        // Error was sent to the error monitoring already -> Can be ignored here
                    })

            })
            .finally(() => {

                if (takingTooLongTimer) {
                    clearTimeout(takingTooLongTimer)
                } else {
                    this._errorMonitoring(new taskErrors.TaskExecutionTakingTooLongFinishedError(started, until, moment.utc().unix(), task))
                }

            })

    }

}

module.exports = TaskRunner
