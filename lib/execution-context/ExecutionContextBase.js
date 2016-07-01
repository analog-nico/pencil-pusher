'use strict'

class ExecutionContextBase {

    constructor() {}

    /**
     * Runs a task.
     *
     * Get the code through `taskDefinition.getImplementation()` which return either a function or an absolute path
     * to the source file that is expected but not guaranteed to export a function.
     *
     * Pass `task.input` to the function to execute the task.
     *
     * @param task - object originally retrieved through persistenceLayer.getNextPendingTask()
     *               with guaranteed properties `name` and `input`
     * @param taskDefinition - Instance of `TaskDefinition`
     */
    run(task, taskDefinition) {
        throw new Error('Mising implementation for ExecutionContextBase.run(...)')
    }

}

module.exports = ExecutionContextBase
