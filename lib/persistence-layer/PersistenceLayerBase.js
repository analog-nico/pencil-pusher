'use strict'

class PersistenceLayerBase {

    constructor() {}

    /**
     * Returns the next pending task for processing.
     *
     * Must return the task that fulfills the following conditions:
     * 1. Is due or past due
     * 2. Is not already being processed
     * 3. Is being processed but the processing timed out (see setTaskProcessingTime)
     * 4. Its processing was not cancelled due to a failure (see cancelTaskProcessing)
     * 5. Is the task with the earliest due date of all tasks that fulfill the previous points
     *
     * Must return `null` if no such task exists.
     *
     * Must mark the returned task as being processed.
     *
     * A task instance must be an object with the following properties:
     * - name - value as specified in the pencilPusher.defineTask(name, ...) call
     * - input - input data which will be validated against the inputSchema if available
     * - More properties - e.g. an id - may be passed as well to support operations like
     *   setTaskProcessingTime where the task instance is passed back
     *
     * @returns task instance or Promise
     */
    getNextPendingTask() {
        throw new Error('Mising implementation for PersistenceLayerBase.getNextPendingTask(...)')
    }

    /**
     * Sets the maximum processing time for a task which justs starts to be processed.
     *
     * `until` is calculated according to the `execution.completesWithin` value given by
     * `pencilPusher.defineTask(task.name, ...)`. This allows restarting tasks that did
     * not complete due to server crashes etc.
     *
     * @param task - The task instance originally returned by getNextPendingTask()
     * @param until - Unix epoch through which the processing may take place
     */
    setTaskProcessingTime({ task, until }) {
        throw new Error('Mising implementation for PersistenceLayerBase.setTaskProcessingTime(...)')
    }

    /**
     * Cancels the execution of a task which makes it pending again.
     *
     * @param options.task - The task instance originally returned by `getNextPendingTask()`
     * @param executionFailed - `true` if the execution did not finish successfully
     *                          `false` if the task was not executed, e.g. task was queued while the server shuts down
     * @param err - The error if `executionFailed === true`
     */
    cancelTaskProcessing({ task, executionFailed, err }) {
        throw new Error('Mising implementation for PersistenceLayerBase.cancelTaskProcessing(...)')
    }

    /**
     * Finishes the task processing and takes care of its rentention.
     *
     * @param task - The task instance originally returned by `getNextPendingTask()`
     * @param retain - `true` if the task record shall be retained, `false` if it shall be deleted
     * @param retainUntil - Unix epoch or `Infinity` if `retain === true`, task record shall be deleted after unix epoch
     * @param storeOutput - `true` if the `output` shall be stored in the task record
     * @param output - The output to store
     */
    finishTaskProcessing({ task, retain, retainUntil, storeOutput, output }) {
        throw new Error('Mising implementation for PersistenceLayerBase.finishTaskProcessing(...)')
    }

    /**
     * Returns the time when polling for the next pending task shall take place.
     *
     * The implementation must consider:
     * 1. All tasks that are due and are neither being processed nor their execution failed
     * 2. All tasks that are being processed and will become pending after the processing timeout
     * 3. All tasks that will be due shortly
     *
     * A time must be returned that is no later than the earliest calculated time according the above considerations.
     * A time earlier than the current time is handled as if the current time was returned.
     *
     * Must return `null` if no such tasks exist.
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
     * @param options.task - object with properties name, input, and due as passed to PencilPusher.scheduleTask(...)
     * @returns Promise
     */
    storeNewTask({ task }) {
        throw new Error('Mising implementation for PersistenceLayerBase.storeNewTask(...)')
    }

}

module.exports = PersistenceLayerBase
