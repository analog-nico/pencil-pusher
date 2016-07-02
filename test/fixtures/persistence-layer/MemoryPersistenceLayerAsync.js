'use strict'

let BPromise = require('bluebird')

let MemoryPersistenceLayer = require('../../../lib/persistence-layer/MemoryPersistenceLayer.js')


class MemoryPersistenceLayerAsyc extends MemoryPersistenceLayer {

    constructor() {
        super()
    }

    getNextPendingTask() {

        return BPromise.delay(5).then(() => {
            return super.getNextPendingTask()
        })

    }

    setTaskProcessingTime({ task, until }) {

        return BPromise.delay(5).then(() => {
            return super.setTaskProcessingTime({ task, until })
        })

    }

    cancelTaskProcessing({ task, executionFailed, err }) {

        return BPromise.delay(5).then(() => {
            return super.cancelTaskProcessing({ task, executionFailed, err })
        })

    }

    finishTaskProcessing({ task, retain, retainUntil, storeOutput, output }) {

        return BPromise.delay(5).then(() => {
            return super.finishTaskProcessing({ task, retain, retainUntil, storeOutput, output })
        })

    }

    getNextPollingTime() {

        return BPromise.delay(5).then(() => {
            return super.getNextPollingTime()
        })

    }

    storeNewTask({ task }) {

        return BPromise.delay(5).then(() => {
            return super.storeNewTask({ task })
        })

    }

}

module.exports = MemoryPersistenceLayerAsyc
