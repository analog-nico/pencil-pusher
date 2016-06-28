'use strict'

class ExecutionContextBase {

    constructor() {}

    run(task, taskDefinition) {
        throw new Error('Mising implementation for ExecutionContextBase.run(...)')
    }

}

module.exports = ExecutionContextBase
