'use strict'

let _ = require('lodash')
let JSCK = require('jsck')
let moment = require('moment')
let path = require('path')


class Task {

    constructor(name, options) {

        this.options = _.defaultsDeep({ name }, options, {
            inputSchema: null,
            outputSchema: null,
            execution: {
                context: 'main',
                completesWithin: moment.duration(24, 'hours')
            },
            retention: false
        })

        if (!_.isFunction(this.options.implementation) && !_.isString(this.options.implementation)) {
            throw new TypeError(`options.implementation must be either a function or a path pointing to a source file.`)
        }

        if (_.isString(this.options.implementation) && !path.isAbsolute(this.options.implementation)) {
            throw new Error(`The path passed to options.implementation must be absolute. Use require.resolve(...) to get the path.`)
        }

        if (!_.isPlainObject(this.options.execution)) {
            throw new TypeError('options.execution must be an object.')
        }

        // TODO: Validate execution.context

        if ((!_.isFinite(this.options.execution.completesWithin) || this.options.execution.completesWithin <= 0) && !/*moment.isDuration*/_.isObjectLike(this.options.execution.completesWithin)) {
            throw new TypeError('options.execution.completesWithin must either be a positive number (of seconds) or a moment.duration(...).')
        }

        if (!_.isBoolean(this.options.retention) && !_.isPlainObject(this.options.retention)) {
            throw new TypeError('options.retention must either be a boolean or an object.')
        }

        if (_.isPlainObject(this.options.retention)) {

            this.options.retention = _.defaultsDeep(this.options.retention, {
                period: Infinity,
                storeOutput: false
            })

            if (this.options.retention.period !== Infinity && !/*moment.isDuration*/_.isObjectLike(this.options.retention.period)) {
                throw new TypeError('options.retention.period must either be Infinity or a moment.duration(...).')
            }

            if (!_.isBoolean(this.options.retention.storeOutput)) {
                throw new TypeError('options.retention.storeOutput must be a boolean.')
            }

        }

        if (this.options.inputSchema !== null) {
            this.options.inputSchema = new JSCK.draft4(this.options.inputSchema)
        }

        if (this.options.outputSchema !== null) {
            this.options.outputSchema = new JSCK.draft4(this.options.outputSchema)
        }

    }

}

module.exports = Task
