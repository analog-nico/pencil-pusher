'use strict'

let _ = require('lodash')
let moment = require('moment')

let MemoryPersistenceLayer = require('../../lib/persistence-layer/MemoryPersistenceLayer.js')


describe('MemoryPersistenceLayer', () => {

    let persistenceLayer = null

    beforeEach(() => {
        persistenceLayer = new MemoryPersistenceLayer()
    })

    it('should support scheduling, processing, and finishing a task', (done) => {

        // Init empty instance

        // persistenceLayer = new MemoryPersistenceLayer() // See beforeEach

        expect(persistenceLayer._tasks.size).to.eql(0)
        expect(persistenceLayer.getNextPollingTime()).to.eql(null)
        expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        // Store task

        let due = moment().unix()-1
        let task = {
            name: 'test',
            input: 'some input',
            due
        }
        persistenceLayer.storeNewTask({ task })

        expect(task).to.eql({
            id: 0,
            name: 'test',
            input: 'some input',
            due,
            status: persistenceLayer.STATUS.SCHEDULED
        })
        expect(persistenceLayer.getNextPollingTime()).to.eql(due)

        // Get next pending task

        let nextPendingTask = persistenceLayer.getNextPendingTask()

        expect(nextPendingTask === task).to.eql(true)
        expect(task).to.eql({
            id: 0,
            name: 'test',
            input: 'some input',
            due,
            status: persistenceLayer.STATUS.PROCESSING,
            processingUntil: task.processingUntil
        })
        expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        // Set task processing time

        let until = moment().add(1, 'hours').unix()
        persistenceLayer.setTaskProcessingTime({ task, until })

        expect(task).to.eql({
            id: 0,
            name: 'test',
            input: 'some input',
            due,
            status: persistenceLayer.STATUS.PROCESSING,
            processingUntil: until
        })
        expect(persistenceLayer.getNextPollingTime()).to.eql(until+1)

        // Finish processing

        let output = 'some output'
        persistenceLayer.finishTaskProcessing({
            task,
            retain: true,
            retainUntil: 0, // in the past
            storeOutput: true,
            output
        })

        expect(task).to.eql({
            id: 0,
            name: 'test',
            input: 'some input',
            output,
            due,
            status: persistenceLayer.STATUS.DONE,
            retainUntil: 0
        })
        expect(persistenceLayer._tasks.size).to.eql(1)
        expect(persistenceLayer.getNextPollingTime()).to.eql(null)
        expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        setTimeout(() => {
            expect(persistenceLayer._tasks.size).to.eql(0)
            expect(persistenceLayer.getNextPollingTime()).to.eql(null)
            expect(persistenceLayer.getNextPendingTask()).to.eql(null)
            done()
        })

    })

    describe('.getNextPendingTask()', () => {

        it('should return tasks due and past due in the right order', () => {

            let taskDue = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }
            let taskPastDue1 = _.assign(_.clone(taskDue), {
                due: taskDue.due-1
            })
            let taskPastDue2 = _.assign(_.clone(taskDue), {
                due: taskDue.due-2
            })

            persistenceLayer.storeNewTask({ task: taskPastDue1 })
            persistenceLayer.storeNewTask({ task: taskDue })
            persistenceLayer.storeNewTask({ task: taskPastDue2 })

            expect(persistenceLayer.getNextPendingTask()).to.eql(taskPastDue2)
            expect(persistenceLayer.getNextPendingTask()).to.eql(taskPastDue1)
            expect(persistenceLayer.getNextPendingTask()).to.eql(taskDue)
            expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        })

        it('should not return a task not due yet', () => {

            persistenceLayer.storeNewTask({
                task: {
                    name: 'test',
                    input: 'some input',
                    due: moment().add(1, 'day').unix()
                }
            })

            expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        })

        it('should return a task being processed and timed out', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)
            expect(task.status).to.eql(persistenceLayer.STATUS.PROCESSING)

            persistenceLayer.setTaskProcessingTime({ task, until: moment().unix()-1 }) // timed out

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)
            expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        })

        it('should not return a task that was cancelled due to a failure', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)

            persistenceLayer.cancelTaskProcessing({ task, executionFailed: false })

            expect(task.status).to.eql(persistenceLayer.STATUS.SCHEDULED)
            expect(persistenceLayer.getNextPendingTask()).to.eql(task)

            persistenceLayer.cancelTaskProcessing({ task, executionFailed: true, err: new Error() })

            expect(task.status).to.eql(persistenceLayer.STATUS.FAILED)
            expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        })

        it('should not return a task that is finished', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)

            persistenceLayer.finishTaskProcessing({ task, retain: true, retainUntil: Infinity, storeOutput: false })
            expect(task.status).to.eql(persistenceLayer.STATUS.DONE)
            expect(persistenceLayer._tasks.size).to.eql(1)

            expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        })

    })

    describe('.setTaskProcessingTime(...)', () => {

        it('should update the processing timeout', () => {

            let task1 = {
                name: 'test1',
                input: 'some input1',
                due: moment().unix()
            }
            let task2 = {
                name: 'test2',
                input: 'some input2',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task: task1 })
            persistenceLayer.storeNewTask({ task: task2 })

            expect(persistenceLayer.getNextPendingTask()).to.not.eql(null)
            expect(persistenceLayer.getNextPendingTask()).to.not.eql(null)

            persistenceLayer.setTaskProcessingTime({ task: task1, until: moment().unix()-1 })
            persistenceLayer.setTaskProcessingTime({ task: task2, until: moment().unix()+2 })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task1) // timed out
            expect(persistenceLayer.getNextPendingTask()).to.eql(null) // still processing

        })

    })

    describe('.cancelTaskProcessing(...)', () => {

        it('should revert task to being scheduled when no failure occurred', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)

            persistenceLayer.cancelTaskProcessing({ task, executionFailed: false })

            expect(task.status).to.eql(persistenceLayer.STATUS.SCHEDULED)
            expect(persistenceLayer.getNextPendingTask()).to.eql(task)

        })

        it('should set task to failed and retain it', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)

            let err = new Error('Some failure')
            persistenceLayer.cancelTaskProcessing({ task, executionFailed: true, err })

            expect(task.status).to.eql(persistenceLayer.STATUS.FAILED)
            expect(task.error).to.eql(err)
            expect(persistenceLayer._tasks.size).to.eql(1)
            expect(persistenceLayer.getNextPendingTask()).to.eql(null)

        })

    })

    describe('.finishTaskProcessing(...)', () => {

        it('should delete the task when retain === false', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)
            expect(persistenceLayer._tasks.size).to.eql(1)

            persistenceLayer.finishTaskProcessing({
                task,
                retain: false,
                storeOutput: false
            })
            expect(persistenceLayer._tasks.size).to.eql(0)

        })

        it('should retain the task and store the output', () => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)
            expect(persistenceLayer._tasks.size).to.eql(1)

            persistenceLayer.finishTaskProcessing({
                task,
                retain: true,
                retainUntil: Infinity,
                storeOutput: true,
                output: 'some output'
            })
            expect(persistenceLayer._tasks.size).to.eql(1)
            expect(task.output).to.eql('some output')

        })

        it('should retain the task for the given time', (done) => {

            let task = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }

            persistenceLayer.storeNewTask({ task })

            expect(persistenceLayer.getNextPendingTask()).to.eql(task)
            expect(persistenceLayer._tasks.size).to.eql(1)

            persistenceLayer.finishTaskProcessing({
                task,
                retain: true,
                retainUntil: moment().unix(),
                storeOutput: false
            })
            expect(persistenceLayer._tasks.size).to.eql(1)

            setTimeout(() => {
                expect(persistenceLayer._tasks.size).to.eql(0)
                done()
            })

        })

    })

    describe('.getNextPollingTime()', () => {

        it('should return the earliest due date of all scheduled tasks (due in the future)', () => {

            let taskDue1 = {
                name: 'test',
                input: 'some input',
                due: moment().unix()+1
            }
            let taskDue2 = _.assign(_.clone(taskDue1), {
                due: taskDue1.due+2
            })

            persistenceLayer.storeNewTask({ task: taskDue2 })
            persistenceLayer.storeNewTask({ task: taskDue1 })

            expect(persistenceLayer.getNextPollingTime()).to.eql(taskDue1.due)

        })

        it('should return the earliest due date of all scheduled tasks (past due)', () => {

            let taskDue = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }
            let taskPastDue1 = _.assign(_.clone(taskDue), {
                due: taskDue.due-1
            })
            let taskPastDue2 = _.assign(_.clone(taskDue), {
                due: taskDue.due-2
            })

            persistenceLayer.storeNewTask({ task: taskPastDue1 })
            persistenceLayer.storeNewTask({ task: taskDue })
            persistenceLayer.storeNewTask({ task: taskPastDue2 })

            expect(persistenceLayer.getNextPollingTime()).to.eql(taskPastDue2.due)

        })

        it('should ignore task currently being processed', () => {

            let taskDue = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }
            let taskPastDue1 = _.assign(_.clone(taskDue), {
                due: taskDue.due-1
            })
            let taskPastDue2 = _.assign(_.clone(taskDue), {
                due: taskDue.due-2
            })

            persistenceLayer.storeNewTask({ task: taskPastDue1 })
            persistenceLayer.storeNewTask({ task: taskDue })
            persistenceLayer.storeNewTask({ task: taskPastDue2 })

            expect(persistenceLayer.getNextPendingTask()).to.eql(taskPastDue2)

            expect(persistenceLayer.getNextPollingTime()).to.eql(taskPastDue1.due)

        })

        it('should ignore task for which the processing failed', () => {

            let taskDue = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }
            let taskPastDue1 = _.assign(_.clone(taskDue), {
                due: taskDue.due-1
            })
            let taskPastDue2 = _.assign(_.clone(taskDue), {
                due: taskDue.due-2
            })

            persistenceLayer.storeNewTask({ task: taskPastDue1 })
            persistenceLayer.storeNewTask({ task: taskDue })
            persistenceLayer.storeNewTask({ task: taskPastDue2 })

            expect(persistenceLayer.getNextPendingTask()).to.eql(taskPastDue2)
            persistenceLayer.cancelTaskProcessing({
                task: taskPastDue2,
                executionFailed: true,
                err: new Error()
            })

            expect(persistenceLayer.getNextPollingTime()).to.eql(taskPastDue1.due)

        })

        it('should ignore tasks for which the processing finished', () => {

            let taskDue = {
                name: 'test',
                input: 'some input',
                due: moment().unix()
            }
            let taskPastDue1 = _.assign(_.clone(taskDue), {
                due: taskDue.due-1
            })
            let taskPastDue2 = _.assign(_.clone(taskDue), {
                due: taskDue.due-2
            })

            persistenceLayer.storeNewTask({ task: taskPastDue1 })
            persistenceLayer.storeNewTask({ task: taskDue })
            persistenceLayer.storeNewTask({ task: taskPastDue2 })

            expect(persistenceLayer.getNextPendingTask()).to.eql(taskPastDue2)
            persistenceLayer.finishTaskProcessing({
                task: taskPastDue2,
                retain: true,
                retainUntil: Infinity,
                storeOutput: false
            })

            expect(persistenceLayer.getNextPollingTime()).to.eql(taskPastDue1.due)

        })

        it('should consider the processing timeout', () => {

            let now = moment()

            let taskDue = {
                name: 'test',
                input: 'some input',
                due: now.unix()
            }
            let taskDueFuture = _.assign(_.clone(taskDue), {
                due: now.clone().add(6, 'minutes').unix()
            })

            persistenceLayer.storeNewTask({ task: taskDueFuture })
            persistenceLayer.storeNewTask({ task: taskDue })

            expect(persistenceLayer.getNextPendingTask()).to.eql(taskDue)

            expect(persistenceLayer.getNextPollingTime()).to.eql(taskDueFuture.due)

            let timingOutOn = now.clone().add(5, 'minutes').unix()
            persistenceLayer.setTaskProcessingTime({
                task: taskDue,
                until: timingOutOn
            })

            expect(persistenceLayer.getNextPollingTime()).to.eql(timingOutOn+1)

        })

    })

    describe('.storeNewTask(...)', () => {

        it('should return a promise if task is stored asychronously', () => {

            // Does not apply. MemoryPersistenceLayer is all sync.

        })

    })

})
