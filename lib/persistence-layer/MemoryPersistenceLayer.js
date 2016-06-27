'use strict'

let _ = require('lodash')
let moment = require('moment')
let PersistenceLayerBase = require('./PersistenceLayerBase.js')

class MemoryPersistenceLayer extends PersistenceLayerBase {

    constructor() {

        super()

        this.tasks = []
        this.nextId = 0

        if (process.env.NODE_ENV === 'production') { // eslint-disable-line no-process-env
            console.error('The MemoryPersistenceLayer serves testing purposes only. Please use a database backed persistence layer.')
        }

    }

    _generateId() {
        let id = this.nextId
        this.nextId += 1
        return id
    }

    getNextPendingTask() {

        let earliestDue = null

        for ( let i = 0; i < this.tasks.length; i+=1 ) {

            if (this.tasks[i].processing && this.tasks[i].processingUntil > moment().unix()) {
                continue
            }

            if (earliestDue === null || this.tasks[i].due < earliestDue.due) {
                earliestDue = this.tasks[i]
            }

        }

        if (earliestDue === null) {
            return null
        }

        earliestDue.processing = true
        earliestDue.processingUntil = moment().add(24, 'hours').unix()

        return earliestDue

    }

    setTaskProcessingTime({ task, until } = {}) {

        for ( let i = 0; i < this.tasks.length; i+=1 ) {

            if (this.tasks[i]._id === task._id) {
                this.tasks[i].processingUntil = until
                break
            }

        }

    }

    finishTask({ task, retain, retainUntil, storeOutput, output } = {}) {

        for ( let i = 0; i < this.tasks.length; i+=1 ) {
            if (this.tasks[i]._id === task._id) {
                this.tasks.slice(i, 1)
                break
            }
        }

    }

    getNextPollingTime() {

        let earliestTime = null

        for ( let i = 0; i < this.tasks.length; i+=1 ) {

            if (this.tasks[i].processing) {

                if (earliestTime === null || this.tasks[i].processingUntil+1 < earliestTime) {
                    earliestTime = this.tasks[i].processingUntil+1
                }

            } else {

                if (earliestTime === null || this.tasks[i].due < earliestTime) {
                    earliestTime = this.tasks[i].due
                }

            }

        }

        return earliestTime

    }

    storeNewTask(task) {

        if (!_.isPlainObject(task)) {
            throw new TypeError('task must be an object.')
        }

        if (!_.isString(task.name)) {
            throw new TypeError('task.name must be a string.')
        }

        if (_.isUndefined(task.input)) {
            throw new Error('task.input is required.')
        }

        if (!_.isFinite(task.due)) {
            throw new TypeError('task.due must be a finited number.')
        }

        task._id = this._generateId()
        task.processing = false
        task.processingUntil = 0

        this.tasks.push(task)

    }

}

module.exports = MemoryPersistenceLayer
