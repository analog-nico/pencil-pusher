'use strict'

let _ = require('lodash')

let ExecutionContextBase = require('./ExecutionContextBase.js')


class MainExecutionContext extends ExecutionContextBase {

    constructor() {
        super()
    }

    run(task, taskDefinition) {

        let impl = taskDefinition.getImplementation()

        if (_.isString(impl)) {
            impl = require(impl)
        }

        if (!_.isFunction(impl)) {
            throw new Error(`The implementation for task "${ taskDefinition.getName() }" does not point to a function`)
        }

        return impl(task.input)

    }

}

module.exports = MainExecutionContext
