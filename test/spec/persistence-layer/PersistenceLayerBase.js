'use strict'

let PersistenceLayerBase = require('../../../lib/persistence-layer/PersistenceLayerBase.js')

describe('PersistenceLayerBase', () => {

    it('should throw errors for every function', () => {

        let persistenceLayer = new PersistenceLayerBase()

        expect(() => {
            persistenceLayer.getNextPendingTask()
        }).to.throw()

        expect(() => {
            persistenceLayer.setTaskProcessingTime({})
        }).to.throw()

        expect(() => {
            persistenceLayer.cancelTaskProcessing({})
        }).to.throw()

        expect(() => {
            persistenceLayer.finishTaskProcessing({})
        }).to.throw()

        expect(() => {
            persistenceLayer.getNextPollingTime()
        }).to.throw()

        expect(() => {
            persistenceLayer.storeNewTask({})
        }).to.throw()

    })

})
