'use strict'

class MissingTaskDefinitionError extends Error {

    constructor(taskName) {

        super()

        this.name = 'MissingTaskDefinitionError'
        this.message = `Missing task definition for tasks named "${ taskName }"`
        this.taskName = taskName

    }

}

class TaskExecutionFailedError extends Error {

    constructor(cause, task) {

        super()

        this.name = 'TaskExecutionFailedError'
        this.message = `Failed to execute a "${ task.name }" task caused by: ${ cause.message }`
        this.cause = cause
        this.task = task

        this.stack = cause.stack

    }

}

class SchemaValidationError extends Error {

    constructor(type, validationErrors, data, schema, task) {

        super()

        this.name = `${ type.substr(0,1).toUpperCase() }${ type.substr(1) }ValidationError`
        this.message = `The ${ type } of a "${ task.name }" task failed to validate: ${ JSON.stringify(validationErrors) }`
        this.validationErrors = validationErrors
        this.data = data
        this.schema = schema
        this.task = task

    }

}

class InputValidationError extends SchemaValidationError {

    constructor(validationErrors, input, schema, task) {

        super('input', validationErrors, input, schema, task)

    }

}

class OutputValidationError extends SchemaValidationError {

    constructor(validationErrors, output, schema, task) {

        super('output', validationErrors, output, schema, task)

    }

}

module.exports = {
    MissingTaskDefinitionError,
    TaskExecutionFailedError,
    InputValidationError,
    OutputValidationError
}
