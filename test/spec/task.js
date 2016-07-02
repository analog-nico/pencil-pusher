'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')
let moment = require('moment')
let sinon = require('sinon')

let MemoryPersistenceLayerAsync = require('../fixtures/persistence-layer/MemoryPersistenceLayerAsync.js')
let PencilPusher = require('../../')


describe('PencilPusher\'s task management', () => {

    const DEFAULT_RUNNING_TIME = 20

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

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(2)
                expect(spySetTaskProcessingTime.callCount).to.eql(1)
                expect(spyCancelTaskProcessing.callCount).to.eql(0)
                expect(spyFinishTaskProcessing.callCount).to.eql(1)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(1)

                expect(taskWasExecuted).to.eql(true)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should schedule and process an async task', (done) => {

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

        let spyAsyncTask = sinon.spy(() => {
            taskWasExecuted = true
        })

        pencilPusher.defineTask('simple', {
            implementation: () => {

                return BPromise.delay(10)
                    .then(spyAsyncTask)

            }
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(2)
                expect(spySetTaskProcessingTime.callCount).to.eql(1)
                expect(spyCancelTaskProcessing.callCount).to.eql(0)
                expect(spyFinishTaskProcessing.callCount).to.eql(1)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(1)

                expect(taskWasExecuted).to.eql(true)
                expect(spyAsyncTask.firstCall.calledBefore(spyFinishTaskProcessing.firstCall)).to.eql(true)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME+10)

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

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(3)
                expect(spySetTaskProcessingTime.callCount).to.eql(2)
                expect(spyCancelTaskProcessing.callCount).to.eql(0)
                expect(spyFinishTaskProcessing.callCount).to.eql(2)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(2)

                expect(taskWasExecuted[0]).to.eql(true)
                expect(taskWasExecuted[1]).to.eql(true)

                expect(spyGetNextPendingTask.secondCall.calledAfter(spyFinishTaskProcessing.firstCall)).to.eql(true)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

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

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(3)
                expect(spySetTaskProcessingTime.callCount).to.eql(2)
                expect(spyCancelTaskProcessing.callCount).to.eql(0)
                expect(spyFinishTaskProcessing.callCount).to.eql(2)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(2)

                expect(taskWasExecuted[0]).to.eql(true)
                expect(taskWasExecuted[1]).to.eql(true)

                expect(spyGetNextPendingTask.secondCall.calledBefore(spyFinishTaskProcessing.firstCall)).to.eql(true)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should process and retain a task', (done) => {

        let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

        let origFn = persistenceLayer.finishTaskProcessing
        let calledWithArgs = null
        persistenceLayer.finishTaskProcessing = (...args) => {
            calledWithArgs = _.cloneDeep(args) // ...because the spy doesn't clone the args
            return Reflect.apply(origFn, persistenceLayer, args)
        }

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

                return 'test output'

            },
            retention: {
                period: moment.duration(5, 'years'),
                storeOutput: true
            }
        })

        let now = moment()

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: now.unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(2)
                expect(spySetTaskProcessingTime.callCount).to.eql(1)
                expect(spyCancelTaskProcessing.callCount).to.eql(0)
                expect(spyFinishTaskProcessing.callCount).to.eql(1)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(1)

                expect(calledWithArgs).to.eql([{
                    task: {
                        id: 0,
                        name: 'simple',
                        input: null,
                        due: now.unix(),
                        status: 'processing',
                        processingUntil: now.clone().add(24, 'hours').unix()
                    },
                    retain: true,
                    retainUntil: now.clone().add(5, 'years').unix(),
                    storeOutput: true,
                    output: 'test output'
                }])

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME+10)

    })

    it('should process and retain a task (default for retention = true)', (done) => {

        let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

        let origFn = persistenceLayer.finishTaskProcessing
        let calledWithArgs = null
        persistenceLayer.finishTaskProcessing = (...args) => {
            calledWithArgs = _.cloneDeep(args) // ...because the spy doesn't clone the args
            return Reflect.apply(origFn, persistenceLayer, args)
        }

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

                return 'test output'

            },
            retention: true
        })

        let now = moment()

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: now.unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(2)
                expect(spySetTaskProcessingTime.callCount).to.eql(1)
                expect(spyCancelTaskProcessing.callCount).to.eql(0)
                expect(spyFinishTaskProcessing.callCount).to.eql(1)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(1)

                expect(calledWithArgs).to.eql([{
                    task: {
                        id: 0,
                        name: 'simple',
                        input: null,
                        due: now.unix(),
                        status: 'processing',
                        processingUntil: now.clone().add(24, 'hours').unix()
                    },
                    retain: true,
                    retainUntil: Infinity,
                    storeOutput: false,
                    output: 'test output'
                }])

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME+10)

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
            persistenceLayer,
            errorMonitoring: (xyz) => { /* Ignore */ }
        })

        persistenceLayer.storeNewTask({ task: {
            name: 'undefined',
            input: null,
            due: moment().unix()
        }})

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(2)
                expect(spySetTaskProcessingTime.callCount).to.eql(0)
                expect(spyCancelTaskProcessing.callCount).to.eql(1)
                expect(spyFinishTaskProcessing.callCount).to.eql(0)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(1)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

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
            persistenceLayer,
            errorMonitoring: (xyz) => { /* Ignore */ }
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

            try {

                expect(spyGetNextPendingTask.callCount).to.eql(2)
                expect(spySetTaskProcessingTime.callCount).to.eql(1)
                expect(spyCancelTaskProcessing.callCount).to.eql(1)
                expect(spyFinishTaskProcessing.callCount).to.eql(0)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(1)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should work with async implementation of the persistence layer', () => {

        let persistenceLayer = new MemoryPersistenceLayerAsync()
        let spyGetNextPendingTask = sinon.spy(persistenceLayer, 'getNextPendingTask')
        let spySetTaskProcessingTime = sinon.spy(persistenceLayer, 'setTaskProcessingTime')
        let spyCancelTaskProcessing = sinon.spy(persistenceLayer, 'cancelTaskProcessing')
        let spyFinishTaskProcessing = sinon.spy(persistenceLayer, 'finishTaskProcessing')
        let spyGetNextPollingTime = sinon.spy(persistenceLayer, 'getNextPollingTime')
        let spyStoreNewTask = sinon.spy(persistenceLayer, 'storeNewTask')

        let pencilPusher = new PencilPusher({
            persistenceLayer,
            errorMonitoring: (xyz) => { /* Ignore */ }
        })

        let taskWasExecuted = 0

        pencilPusher.defineTask('simple', {
            implementation: (throwError) => {
                taskWasExecuted += 1
                if (throwError) {
                    throw new Error('Thrown by task')
                }
            }
        })

        return BPromise.all([
            pencilPusher.scheduleTask({ name: 'simple', input: false, due: moment().unix() }),
            pencilPusher.scheduleTask({ name: 'simple', input: true, due: moment().unix() })
        ])
            .delay(10)
            .then(() => {

                pencilPusher.start()

            })
            .delay(100)
            .then(() => {

                expect(spyGetNextPendingTask.callCount).to.eql(3)
                expect(spySetTaskProcessingTime.callCount).to.eql(2)
                expect(spyCancelTaskProcessing.callCount).to.eql(1)
                expect(spyFinishTaskProcessing.callCount).to.eql(1)
                expect(spyGetNextPollingTime.callCount).to.eql(1)
                expect(spyStoreNewTask.callCount).to.eql(2)

            })
            .finally(() => {

                pencilPusher.stop()

            })

    })

})
