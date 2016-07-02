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

module.exports = {
    MissingTaskDefinitionError,
    TaskExecutionFailedError
}
