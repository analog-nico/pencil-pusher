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

            expect(spyGetNextPendingTask.callCount).to.eql(2)
            expect(spySetTaskProcessingTime.callCount).to.eql(1)
            expect(spyCancelTaskProcessing.callCount).to.eql(0)
            expect(spyFinishTaskProcessing.callCount).to.eql(1)
            expect(spyGetNextPollingTime.callCount).to.eql(1)
            expect(spyStoreNewTask.callCount).to.eql(1)

            expect(taskWasExecuted).to.eql(true)

            pencilPusher.stop()

            done()

        }, 10)

    })

    it('should process two tasks in a sequence', (done) => {

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

        let taskWasExecuted = [false, false]

        pencilPusher.defineTask('simple', {
            implementation: (id) => {
                taskWasExecuted[id] = true
            }
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: 0,
            due: moment().unix()-1
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: 1,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            expect(spyGetNextPendingTask.callCount).to.eql(3)
            expect(spySetTaskProcessingTime.callCount).to.eql(2)
            expect(spyCancelTaskProcessing.callCount).to.eql(0)
            expect(spyFinishTaskProcessing.callCount).to.eql(2)
            expect(spyGetNextPollingTime.callCount).to.eql(1)
            expect(spyStoreNewTask.callCount).to.eql(2)

            expect(taskWasExecuted[0]).to.eql(true)
            expect(taskWasExecuted[1]).to.eql(true)

            expect(spyGetNextPendingTask.secondCall.calledAfter(spyFinishTaskProcessing.firstCall)).to.eql(true)

            pencilPusher.stop()

            done()

        }, 10)

    })

    it('should process two tasks in parallel', (done) => {

        let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()
        let spyGetNextPendingTask = sinon.spy(persistenceLayer, 'getNextPendingTask')
        let spySetTaskProcessingTime = sinon.spy(persistenceLayer, 'setTaskProcessingTime')
        let spyCancelTaskProcessing = sinon.spy(persistenceLayer, 'cancelTaskProcessing')
        let spyFinishTaskProcessing = sinon.spy(persistenceLayer, 'finishTaskProcessing')
        let spyGetNextPollingTime = sinon.spy(persistenceLayer, 'getNextPollingTime')
        let spyStoreNewTask = sinon.spy(persistenceLayer, 'storeNewTask')

        let pencilPusher = new PencilPusher({
            persistenceLayer,
            maxConcurrentTasks: 2
        })

        let taskWasExecuted = [false, false]

        pencilPusher.defineTask('simple', {
            implementation: (id) => {
                taskWasExecuted[id] = true
            }
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: 0,
            due: moment().unix()-1
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: 1,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            expect(spyGetNextPendingTask.callCount).to.eql(3)
            expect(spySetTaskProcessingTime.callCount).to.eql(2)
            expect(spyCancelTaskProcessing.callCount).to.eql(0)
            expect(spyFinishTaskProcessing.callCount).to.eql(2)
            expect(spyGetNextPollingTime.callCount).to.eql(1)
            expect(spyStoreNewTask.callCount).to.eql(2)

            expect(taskWasExecuted[0]).to.eql(true)
            expect(taskWasExecuted[1]).to.eql(true)

            expect(spyGetNextPendingTask.secondCall.calledBefore(spyFinishTaskProcessing.firstCall)).to.eql(true)

            pencilPusher.stop()

            done()

        }, 10)

    })

    it('should cancel an undefined task retrieved from the persistence layer', (done) => {

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

        persistenceLayer.storeNewTask({ task: {
            name: 'undefined',
            input: null,
            due: moment().unix()
        }})

        pencilPusher.start()

        setTimeout(() => {

            expect(spyGetNextPendingTask.callCount).to.eql(2)
            expect(spySetTaskProcessingTime.callCount).to.eql(0)
            expect(spyCancelTaskProcessing.callCount).to.eql(1)
            expect(spyFinishTaskProcessing.callCount).to.eql(0)
            expect(spyGetNextPollingTime.callCount).to.eql(1)
            expect(spyStoreNewTask.callCount).to.eql(1)

            pencilPusher.stop()

            done()

        }, 10)

    })

    it('should cancel a task that throws an error', (done) => {

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

        pencilPusher.defineTask('simple', {
            implementation: () => {
                throw new Error('Thrown by task')
            }
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            expect(spyGetNextPendingTask.callCount).to.eql(2)
            expect(spySetTaskProcessingTime.callCount).to.eql(1)
            expect(spyCancelTaskProcessing.callCount).to.eql(1)
            expect(spyFinishTaskProcessing.callCount).to.eql(0)
            expect(spyGetNextPollingTime.callCount).to.eql(1)
            expect(spyStoreNewTask.callCount).to.eql(1)

            pencilPusher.stop()

            done()

        }, 10)

    })

})
