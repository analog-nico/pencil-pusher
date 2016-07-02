'use strict'

let BPromise = require('bluebird')

let MemoryPersistenceLayer = require('../../../lib/persistence-layer/MemoryPersistenceLayer.js')


class MemoryPersistenceLayerAsyc extends MemoryPersistenceLayer {

    constructor() {
        super()
    }

    getNextPendingTask() {

        return BPromise.try(() => {
            return super.getNextPendingTask()
        })

    }

    setTaskProcessingTime({ task, until }) {

        return BPromise.try(() => {
            return super.setTaskProcessingTime({ task, until })
        })

    }

    cancelTaskProcessing({ task, executionFailed, err }) {

        return BPromise.try(() => {
            return super.cancelTaskProcessing({ task, executionFailed, err })
        })

    }

    finishTaskProcessing({ task, retain, retainUntil, storeOutput, output }) {

        return BPromise.try(() => {
            return super.finishTaskProcessing({ task, retain, retainUntil, storeOutput, output })
        })

    }

    getNextPollingTime() {

        return BPromise.try(() => {
            return super.getNextPollingTime()
        })

    }

    storeNewTask({ task }) {

        return BPromise.try(() => {
            return super.storeNewTask({ task })
        })

    }

}

module.exports = MemoryPersistenceLayerAsyc
