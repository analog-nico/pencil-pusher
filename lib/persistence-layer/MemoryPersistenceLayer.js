'use strict'

let moment = require('moment')
let PersistenceLayerBase = require('./PersistenceLayerBase.js')

/**
 * Reference implementation of a persistence layer mostly used for testing purposes.
 *
 * May be used with PencilPusher for a volatile runtime if you are ok with loosing all scheduled tasks on a server crash/restart.
 */
class MemoryPersistenceLayer extends PersistenceLayerBase {

    constructor() {

        super()

        this._tasks = new Set()
        this._nextId = 0

    }

    _generateId() {
        let id = this._nextId
        this._nextId += 1
        return id
    }

    getNextPendingTask() {

        let earliestDue = null
        let now = moment().unix()

        for ( let task of this._tasks ) {

            if (task.status !== this.STATUS.SCHEDULED && task.status !== this.STATUS.PROCESSING) {
                continue
            }

            if (task.status === this.STATUS.SCHEDULED && task.due > now) {
                continue
            }

            if (task.status === this.STATUS.PROCESSING && task.processingUntil > now) {
                continue
            }

            if (earliestDue === null || task.due < earliestDue.due) {
                earliestDue = task
            }

        }

        if (earliestDue === null) {
            return null
        }

        earliestDue.status = this.STATUS.PROCESSING
        earliestDue.processingUntil = moment().add(24, 'hours').unix()

        return earliestDue

    }

    setTaskProcessingTime({ task, until }) {

        task.processingUntil = until

    }

    cancelTaskProcessing({ task, executionFailed, err }) {

        task.status = this.STATUS.SCHEDULED
        delete task.processingUntil

        if (executionFailed) {
            task.status = this.STATUS.FAILED
            task.error = err
        }

    }

    finishTaskProcessing({ task, retain, retainUntil, storeOutput, output }) {

        task.status = this.STATUS.DONE
        delete task.processingUntil

        if (storeOutput) {
            task.output = output
        }

        if (retain) {
            if (retainUntil !== Infinity) {

                task.retainUntil = retainUntil

                let retainTimeout = (retainUntil - moment().unix()) * 1000
                if (retainTimeout < 0) {
                    retainTimeout = 0
                }

                setTimeout(() => {
                    this._deleteTask(task)
                }, retainTimeout).unref()

            }
        } else {
            this._deleteTask(task)
        }

    }

    _deleteTask(task) {
        this._tasks.delete(task)
    }

    getNextPollingTime() {

        let earliestTime = null

        for ( let task of this._tasks ) {

            if (task.status === this.STATUS.SCHEDULED) {

                if (earliestTime === null || task.due < earliestTime) {
                    earliestTime = task.due
                }

            } else if (task.status === this.STATUS.PROCESSING) {

                if (earliestTime === null || task.processingUntil+1 < earliestTime) {
                    earliestTime = task.processingUntil+1
                }

            }

        }

        return earliestTime

    }

    storeNewTask({ task }) {

        task.id = this._generateId() // The id is not needed by the implementation but helps with testing
        task.status = this.STATUS.SCHEDULED

        this._tasks.add(task)

    }

}

MemoryPersistenceLayer.prototype.STATUS = {
    SCHEDULED: 'scheduled',
    PROCESSING: 'processing',
    FAILED: 'failed',
    DONE: 'done'
}

module.exports = MemoryPersistenceLayer
