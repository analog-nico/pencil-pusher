'use strict'

let moment = require('moment')
let sinon = require('sinon')

let PencilPusher = require('../../')


describe('PencilPusher\'s task management', () => {

    it('should schedule and process a task', (done) => {

        let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()
        let spyGetNextPendingTask = sinon.spy(persistenceLayer, 'getNextPendingTask')
        let spySetTaskProcessingTime = sinon.spy(persistenceLayer, 'setTaskProcessingTime')
        let spyCancelTaskProcessing = sinon.spy(persistenceLayer, 'cancelTaskProcessing')
        let spyFinishTaskProcessing = sinon.spy(persistenceLayer, 'finishTaskProcessing')
        let spyGetNextPollingTime = sinon.spy(persistenceLayer, 'getNextPollingTime')
        let spyStoreNewTask = sinon.spy(persistenceLayer, 'storeNewTask')

        let pencilPusher = new PencilPusher({
            persistenceLayer
        })

        let taskWasExecuted = false

        pencilPusher.defineTask('simple', {
            implementation: () => {
                taskWasExecuted = true
            }
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            expect(spyGetNextPendingTask.callCount).to.eql(1)
            expect(spySetTaskProcessingTime.callCount).to.eql(1)
            expect(spyCancelTaskProcessing.callCount).to.eql(0)
            expect(spyFinishTaskProcessing.callCount).to.eql(1)
            expect(spyGetNextPollingTime.callCount).to.eql(0)
            expect(spyStoreNewTask.callCount).to.eql(1)

            expect(taskWasExecuted).to.eql(true)

            pencilPusher.stop()

            done()

        }, 10)

    })

    it('should cancel an undefined task')

})
