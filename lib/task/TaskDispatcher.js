'use strict'

let BPromise = require('bluebird')
let moment = require('moment')
let TaskRunner = require('./TaskRunner.js')


class TaskDispatcher {

    constructor({
        persistenceLayer,
        pollAtLeastEverySeconds = 60,
        maxConcurrentTasks = 1
    }) {

        this.persistenceLayer = persistenceLayer
        this.pollAtLeastEverySeconds = pollAtLeastEverySeconds

        this.running = false
        this.nextPolling = null

        this.concurrentTasks = 0
        this.maxConcurrentTasks = maxConcurrentTasks

        this.runner = new TaskRunner()

    }

    start() {

        this.running = true
        this._pollForTask()

    }

    stop() {

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
            return this.persistenceLayer.getNextPendingTask()
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

                    return BPromise.try(this.persistenceLayer.getNextPollingTime)
                        .catch((/*err*/) => {

                            // FIXME: Handle error better

                            return moment().unix() + this.pollAtLeastEverySeconds

                        })
                        .then((nextPollingTime) => {

                            let nextPollingInSeconds = nextPollingTime - moment().unix()
                            nextPollingInSeconds = nextPollingInSeconds < 0 ? 0 : nextPollingInSeconds
                            nextPollingInSeconds = nextPollingInSeconds > this.pollAtLeastEverySeconds ? this.pollAtLeastEverySeconds : nextPollingInSeconds

                            this.nextPolling = setTimeout(() => {

                                this._pollForTask()

                            }, nextPollingInSeconds*1000)

                        })

                }

            })

    }

    _dispatchTask(task) {

        this.concurrentTasks += 1

        // Do stuff

        this.concurrentTasks -= 1

    }

    _cancelNextPolling() {

        if (this.nextPolling) {
            clearTimeout(this.nextPolling)
            this.nextPolling = null
        }

    }

}

module.exports = TaskDispatcher
