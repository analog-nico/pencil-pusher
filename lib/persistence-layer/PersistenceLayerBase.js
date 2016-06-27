'use strict'

class PersistenceLayerBase {

    constructor() {}

    /**
     * Returns the next pending task for processing.
     *
     * Must return the task that fulfills the following conditions:
     * 1. Is due or past due
     * 2. Is not already being processed
     * 3. Is the task with the earliest due date of all tasks that fulfill 1. an 2.
     *
     * Must return `null` if no such task exists.
     *
     * Must mark the returned task as being processed.
     *
     * A task instance must an object with the following properties:
     * - name - value as specified in the pencilPusher.defineTask(name, ...) call
     * - input - input data which will be validated against the inputSchema if available
     *
     * @returns Task instance or Promise
     */
    getNextPendingTask() {
        throw new Error('Mising implementation for PersistenceLayerBase.getNextPendingTask(...)')
    }

    setTaskProcessingTime({ task, until }) {
        throw new Error('Mising implementation for PersistenceLayerBase.setTaskProcessingTime(...)')
    }

    cancelTaskProcessing({ task }) {
        throw new Error('Mising implementation for PersistenceLayerBase.cancelTaskProcessing(...)')
    }

    finishTaskProcessing({ task, retain, retainUntil, storeOutput, output }) {
        throw new Error('Mising implementation for PersistenceLayerBase.finishTaskProcessing(...)')
    }

    /**
     * Returns the time when polling for the next pending task shall take place.
     *
     * The implementation must consider:
     * 1. All tasks that are due and are not being processed
     * 2. All tasks that are being processed and will become pending after the processing timeout
     * 3. All tasks that will be due shortly
     *
     * A time must be returned that is no later than the earliest calculated time according the above consideration.
     * A time earlier than the current time is handled as if the current time was returned.
     *
     * Must return `null` if no task exists.
     *
     * @returns Unix epoch time or Promise
     */
    getNextPollingTime() {
        throw new Error('Mising implementation for PersistenceLayerBase.getNextPollingTime(...)')
    }

    /**
     * Stores a new task.
     *
     * If the task is stored asynchronously a Promise must be returned that
     * resolves once the task is stored and could be retrieved through
     * getNextPendingTask. This covers an edge case where the new task is
     * scheduled for immediate execution to make sure polling for this task does
     * not happen before it was properly stored.
     *
     * @param options.task - instance of class Task
     * @returns Promise - options
     */
    storeNewTask({ task }) {
        throw new Error('Mising implementation for PersistenceLayerBase.storeNewTask(...)')
    }

}

module.exports = PersistenceLayerBase
