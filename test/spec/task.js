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

        }, DEFAULT_RUNNING_TIME + 10)

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
            due: moment().unix() - 1
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
            due: moment().unix() - 1
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

        }, DEFAULT_RUNNING_TIME + 10)

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

        }, DEFAULT_RUNNING_TIME + 10)

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

    describe('with a maxConcurrentTasks limit', () => {

        describe('on PencilPusher', () => {

            it('should execute max tasks in parallel', (done) => {

                let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

                let pencilPusher = new PencilPusher({
                    persistenceLayer,
                    maxConcurrentTasks: 2
                })

                let runningTasks = 0
                let maxRunningTasks = 0

                pencilPusher.defineTask('simple', {
                    implementation: (id) => {

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    }
                })

                let task = {
                    name: 'simple',
                    input: null,
                    due: moment().unix()
                }

                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)

                pencilPusher.start()

                setTimeout(() => {

                    try {

                        expect(maxRunningTasks).to.be.below(3)

                    } finally {
                        pencilPusher.stop()
                    }

                    done()

                }, DEFAULT_RUNNING_TIME)

            })

        })

        describe('on a task', () => {

            it('should execute max tasks according to lower task definition', (done) => {

                let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

                let pencilPusher = new PencilPusher({
                    persistenceLayer,
                    maxConcurrentTasks: 3 // <-----------
                })

                let runningTasks = 0
                let maxRunningTasks = 0

                pencilPusher.defineTask('simple', {
                    implementation: (id) => {

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    },
                    execution: {
                        maxConcurrentTasks: 2 // <-----------
                    }
                })

                let task = {
                    name: 'simple',
                    input: null,
                    due: moment().unix()
                }

                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)

                pencilPusher.start()

                setTimeout(() => {

                    try {

                        expect(maxRunningTasks).to.be.below(3)

                    } finally {
                        pencilPusher.stop()
                    }

                    done()

                }, DEFAULT_RUNNING_TIME)

            })

            it('should execute max tasks according to lower PencilPusher definition', (done) => {

                let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

                let pencilPusher = new PencilPusher({
                    persistenceLayer,
                    maxConcurrentTasks: 2 // <-----------
                })

                let runningTasks = 0
                let maxRunningTasks = 0

                pencilPusher.defineTask('simple', {
                    implementation: (id) => {

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    },
                    execution: {
                        maxConcurrentTasks: 3 // <-----------
                    }
                })

                let task = {
                    name: 'simple',
                    input: null,
                    due: moment().unix()
                }

                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)
                pencilPusher.scheduleTask(task)

                pencilPusher.start()

                setTimeout(() => {

                    try {

                        expect(maxRunningTasks).to.be.below(3)

                    } finally {
                        pencilPusher.stop()
                    }

                    done()

                }, DEFAULT_RUNNING_TIME)

            })

            it('should execute other tasks first that did not reach max capacity', (done) => {

                let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

                let pencilPusher = new PencilPusher({
                    persistenceLayer,
                    maxConcurrentTasks: 2 // <-----------
                })

                let order = []
                let runningTasks = 0
                let maxRunningTasks = 0

                pencilPusher.defineTask('simple', {
                    implementation: (id) => {

                        order.push(id)

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    }
                })

                let runningTasksLimited = 0
                let maxRunningTasksLimited = 0

                pencilPusher.defineTask('limited', {
                    implementation: (id) => {

                        order.push(id)

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }
                        runningTasksLimited += 1
                        if (runningTasksLimited > maxRunningTasksLimited) {
                            maxRunningTasksLimited = runningTasksLimited
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasksLimited > maxRunningTasksLimited) {
                                    maxRunningTasksLimited = runningTasksLimited
                                }
                                runningTasksLimited -= 1
                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    },
                    execution: {
                        maxConcurrentTasks: 1 // <-----------
                    }
                })

                let now = moment().unix()

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 1,
                    due: now - 6
                })

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 2,
                    due: now - 5
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 3,
                    due: now - 4
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 4,
                    due: now - 3
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 5,
                    due: now - 2
                })

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 6,
                    due: now - 1
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 7,
                    due: now
                })

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 8,
                    due: now + 999999
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 9,
                    due: now + 999999
                })

                pencilPusher.start()

                setTimeout(() => {

                    try {

                        expect(maxRunningTasks).to.be.below(3)
                        expect(maxRunningTasksLimited).to.be.below(2)

                        expect(order).to.eql([1, 3, 2, 4, 5, 6, 7])

                    } finally {
                        pencilPusher.stop()
                    }

                    done()

                }, DEFAULT_RUNNING_TIME)

            })

            it('should NOT execute other tasks first if persistence layer doesn’t support excluding tasks', (done) => {

                let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()
                let getNextPendingTask = persistenceLayer.getNextPendingTask
                persistenceLayer.getNextPendingTask = function () {
                    return Reflect.apply(getNextPendingTask, this, [[]])
                }
                let getNextPollingTime = persistenceLayer.getNextPollingTime
                persistenceLayer.getNextPollingTime = function () {
                    return Reflect.apply(getNextPollingTime, this, [[]])
                }

                let pencilPusher = new PencilPusher({
                    persistenceLayer,
                    maxConcurrentTasks: 2 // <-----------
                })

                let order = []
                let runningTasks = 0
                let maxRunningTasks = 0

                pencilPusher.defineTask('simple', {
                    implementation: (id) => {

                        order.push(id)

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    }
                })

                let runningTasksLimited = 0
                let maxRunningTasksLimited = 0

                pencilPusher.defineTask('limited', {
                    implementation: (id) => {

                        order.push(id)

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }
                        runningTasksLimited += 1
                        if (runningTasksLimited > maxRunningTasksLimited) {
                            maxRunningTasksLimited = runningTasksLimited
                        }

                        return BPromise.delay()
                            .then(() => {

                                if (runningTasksLimited > maxRunningTasksLimited) {
                                    maxRunningTasksLimited = runningTasksLimited
                                }
                                runningTasksLimited -= 1
                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                            })

                    },
                    execution: {
                        maxConcurrentTasks: 1 // <-----------
                    }
                })

                let now = moment().unix()

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 1,
                    due: now - 6
                })

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 2,
                    due: now - 5
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 3,
                    due: now - 4
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 4,
                    due: now - 3
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 5,
                    due: now - 2
                })

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 6,
                    due: now - 1
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 7,
                    due: now
                })

                pencilPusher.scheduleTask({
                    name: 'limited',
                    input: 8,
                    due: now + 999999
                })

                pencilPusher.scheduleTask({
                    name: 'simple',
                    input: 9,
                    due: now + 999999
                })

                pencilPusher.start()

                setTimeout(() => {

                    try {

                        expect(maxRunningTasks).to.be.below(3)
                        expect(maxRunningTasksLimited).to.be.below(3)

                        expect(order).to.eql([1, 2, 3, 4, 5, 6, 7])

                    } finally {
                        pencilPusher.stop()
                    }

                    done()

                }, DEFAULT_RUNNING_TIME)

            })

            it('should fight the monkey', function (done) {

                this.timeout(10000)

                let persistenceLayer = new PencilPusher.MemoryPersistenceLayer()

                let pencilPusher = new PencilPusher({
                    persistenceLayer,
                    maxConcurrentTasks: 3 // <-----------
                })

                let totalTasks = 0
                let runningTasks = 0
                let maxRunningTasks = 0
                let runningTasksLimited1 = 0
                let maxRunningTasksLimited1 = 0
                let runningTasksLimited2 = 0
                let maxRunningTasksLimited2 = 0
                let MAX_WAIT = 15
                let NUM_TASKS = 400

                function end() {

                    totalTasks += 1
                    if (totalTasks < NUM_TASKS) {
                        return
                    }

                    try {

                        expect(maxRunningTasks).to.be.below(4)
                        expect(maxRunningTasksLimited1).to.be.below(2)
                        expect(maxRunningTasksLimited2).to.be.below(3)

                    } finally {
                        pencilPusher.stop()
                    }

                    done()

                }

                pencilPusher.defineTask('simple', {
                    implementation: () => {

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }

                        return BPromise.delay(_.random(0, MAX_WAIT))
                            .then(() => {

                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                                end()

                            })

                    }
                })

                pencilPusher.defineTask('limited1', {
                    implementation: () => {

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }
                        runningTasksLimited1 += 1
                        if (runningTasksLimited1 > maxRunningTasksLimited1) {
                            maxRunningTasksLimited1 = runningTasksLimited1
                        }

                        return BPromise.delay(_.random(0, MAX_WAIT))
                            .then(() => {

                                if (runningTasksLimited1 > maxRunningTasksLimited1) {
                                    maxRunningTasksLimited1 = runningTasksLimited1
                                }
                                runningTasksLimited1 -= 1
                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                                end()

                            })

                    },
                    execution: {
                        maxConcurrentTasks: 1 // <-----------
                    }
                })

                pencilPusher.defineTask('limited2', {
                    implementation: () => {

                        runningTasks += 1
                        if (runningTasks > maxRunningTasks) {
                            maxRunningTasks = runningTasks
                        }
                        runningTasksLimited2 += 1
                        if (runningTasksLimited2 > maxRunningTasksLimited2) {
                            maxRunningTasksLimited2 = runningTasksLimited2
                        }

                        return BPromise.delay(_.random(0, MAX_WAIT))
                            .then(() => {

                                if (runningTasksLimited2 > maxRunningTasksLimited2) {
                                    maxRunningTasksLimited2 = runningTasksLimited2
                                }
                                runningTasksLimited2 -= 1
                                if (runningTasks > maxRunningTasks) {
                                    maxRunningTasks = runningTasks
                                }
                                runningTasks -= 1

                                end()

                            })

                    },
                    execution: {
                        maxConcurrentTasks: 2 // <-----------
                    }
                })

                let now = moment().unix()

                for ( let i = NUM_TASKS; i > 0; i-=1 ) {
                    pencilPusher.scheduleTask({
                        name: ['simple', 'limited1', 'limited2'][_.random(0, 2)],
                        input: null,
                        due: now - i
                    })
                }

                pencilPusher.start()

            })

        })

    })

})
