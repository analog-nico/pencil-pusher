'use strict'

let moment = require('moment')

let MemoryPersistenceLayer = require('../../lib/persistence-layer/MemoryPersistenceLayer.js')
let PencilPusher = require('../../')


describe('The error monitoring for task processing', () => {

    const DEFAULT_RUNNING_TIME = 20

    it('should report getNextPendingTask()', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.getNextPendingTask
        pl.getNextPendingTask = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = 0
        let lastErrMonitored = null

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored += 1
                lastErrMonitored = err
            }
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored).to.eql(1)
                expect(lastErrMonitored.message).to.eql('Failed to access the persistence layer with .getNextPendingTask() caused by: Failed!')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should report setTaskProcessingTime()', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.setTaskProcessingTime
        pl.setTaskProcessingTime = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = 0
        let lastErrMonitored = null

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored += 1
                lastErrMonitored = err
            }
        })

        pencilPusher.defineTask('simple', {
            implementation: () => {}
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored).to.eql(1)
                expect(lastErrMonitored.message).to.eql('Failed to access the persistence layer with .setTaskProcessingTime() caused by: Failed!')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should report cancelTaskProcessing() - missing task definition', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.cancelTaskProcessing
        pl.cancelTaskProcessing = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = []

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored.push(err)
            }
        })

        pl.storeNewTask({ task: {
            name: 'simple',
            input: null,
            due: moment().unix()
        }})

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored.length).to.eql(2)
                expect(errorsMonitored[0].message).to.eql('Missing task definition for tasks named "simple"')
                expect(errorsMonitored[1].message).to.eql('Failed to access the persistence layer with .cancelTaskProcessing() caused by: Failed!')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should report cancelTaskProcessing() - task execution failed', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.cancelTaskProcessing
        pl.cancelTaskProcessing = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = []

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored.push(err)
            }
        })

        pencilPusher.defineTask('simple', {
            implementation: () => {
                throw new Error('Task failed!')
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

                expect(errorsMonitored.length).to.eql(2)
                expect(errorsMonitored[0].message).to.eql('Failed to execute a "simple" task caused by: Task failed!')
                expect(errorsMonitored[1].message).to.eql('Failed to access the persistence layer with .cancelTaskProcessing() caused by: Failed!')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should report finishTaskProcessing()', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.finishTaskProcessing
        pl.finishTaskProcessing = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = 0
        let lastErrMonitored = null

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored += 1
                lastErrMonitored = err
            }
        })

        pencilPusher.defineTask('simple', {
            implementation: () => {}
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored).to.eql(1)
                expect(lastErrMonitored.message).to.eql('Failed to access the persistence layer with .finishTaskProcessing() caused by: Failed!')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should report getNextPollingTime()', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.getNextPollingTime
        pl.getNextPollingTime = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = 0
        let lastErrMonitored = null

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored += 1
                lastErrMonitored = err
            }
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored).to.eql(1)
                expect(lastErrMonitored.message).to.eql('Failed to access the persistence layer with .getNextPollingTime() caused by: Failed!')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should report storeNewTask()', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.storeNewTask
        pl.storeNewTask = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let errorsMonitored = 0
        let lastErrMonitored = null

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (err) => {
                errorsMonitored += 1
                lastErrMonitored = err
            }
        })

        pencilPusher.defineTask('simple', {
            implementation: () => {}
        })

        process.once('unhandledRejection', () => { /* Ignore it */ })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })
            .then(
                () => {
                    throw new Error('Expected scheduleTask(...) to be rejected')
                },
                (err) => {

                    expect(errorsMonitored).to.eql(1)
                    expect(lastErrMonitored.message).to.eql('Failed to access the persistence layer with .storeNewTask() caused by: Failed!')

                    expect(err).to.eql(lastErrMonitored)

                    done()

                }
            )

    })

    it('should catch errors in the error monitoring itself', (done) => {

        let pl = new MemoryPersistenceLayer()
        let numCalls = 0
        let origFn = pl.getNextPendingTask
        pl.getNextPendingTask = (...args) => {
            numCalls += 1
            if (numCalls === 1) {
                throw new Error('Failed!')
            }
            return Reflect.apply(origFn, pl, args)
        }

        let pencilPusher = new PencilPusher({
            persistenceLayer: pl,
            errorMonitoring: (xyz) => {
                throw new Error('monitoring failed')
            }
        })

        let stderr = []
        let origStderrWrite = process.stderr.write
        process.stderr.write = (string, encoding, fd) => {
            stderr.push(string)
        }

        pencilPusher.start()

        setTimeout(() => {

            try {

                process.stderr.write = origStderrWrite

                expect(stderr.join('')).to.contain('monitoring failed')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

})
