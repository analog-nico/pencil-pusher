'use strict'

let _ = require('lodash')
let JSCK = require('jsck')
let moment = require('moment')
let path = require('path')


class TaskDefinition {

    constructor(name, options) {

        this._definition = _.defaultsDeep({ name }, options, {
            inputSchema: null,
            outputSchema: null,
            execution: {
                context: 'main',
                completesWithin: moment.duration(24, 'hours')
            },
            retention: false
        })

        if (!_.isFunction(this._definition.implementation) && !_.isString(this._definition.implementation)) {
            throw new TypeError('options.implementation must be either a function or a path pointing to a source file.')
        }

        if (_.isString(this._definition.implementation) && !path.isAbsolute(this._definition.implementation)) {
            throw new Error('The path passed to options.implementation must be absolute. Use require.resolve(...) to get the path.')
        }

        if (!_.isPlainObject(this._definition.execution)) {
            throw new TypeError('options.execution must be an object.')
        }

        if ((!_.isFinite(this._definition.execution.completesWithin) || this._definition.execution.completesWithin <= 0) &&
            !_.isObjectLike(this._definition.execution.completesWithin)) { // moment.isDuration cannot be used if moment was installed more than once
            throw new TypeError('options.execution.completesWithin must either be a positive number (of seconds) or a moment.duration(...).')
        }

        if (!_.isBoolean(this._definition.retention) && !_.isPlainObject(this._definition.retention)) {
            throw new TypeError('options.retention must either be a boolean or an object.')
        }

        if (this._definition.retention === true) {
            this._definition.retention = {}
        }

        if (_.isPlainObject(this._definition.retention)) {

            this._definition.retention = _.defaultsDeep(this._definition.retention, {
                period: Infinity,
                storeOutput: false
            })

            if (this._definition.retention.period !== Infinity &&
                !_.isObjectLike(this._definition.retention.period)) { // moment.isDuration cannot be used if moment was installed more than once
                throw new TypeError('options.retention.period must either be Infinity or a moment.duration(...).')
            }

            if (!_.isBoolean(this._definition.retention.storeOutput)) {
                throw new TypeError('options.retention.storeOutput must be a boolean.')
            }

        }

        if (this._definition.inputSchema !== null) {
            this._definition.inputSchema = new JSCK.draft4(this._definition.inputSchema)
        }

        if (this._definition.outputSchema !== null) {
            this._definition.outputSchema = new JSCK.draft4(this._definition.outputSchema)
        }

    }

    getName() {
        return this._definition.name
    }

    getExecutionContext() {
        return this._definition.execution.context
    }

    getProcessingUntil() {

        if (_.isFinite(this._definition.execution.completesWithin)) {
            return moment().unix() + this._definition.execution.completesWithin
        } else {
            return moment.utc().add(this._definition.execution.completesWithin).unix()
        }

    }

    getInputSchema() {
        return this._definition.inputSchema
    }

    validateInput(input) {

        if (this._definition.inputSchema === null) {
            return { valid: true }
        }

        return this._definition.inputSchema.validate(input)

    }

    getImplementation() {
        return this._definition.implementation
    }

    getOutputSchema() {
        return this._definition.outputSchema
    }

    validateOutput(output) {

        if (this._definition.outputSchema === null) {
            return { valid: true }
        }

        return this._definition.outputSchema.validate(output)

    }

    shallRetain() {
        return this._definition.retention !== false
    }

    shallRetainUntil() {
        if (this._definition.retention === false) {
            return null
        } else if (this._definition.retention === true || this._definition.retention.period === Infinity) {
            return Infinity
        } else {
            return moment().unix() + this._definition.retention.period.asSeconds()
        }
    }

    shallRetainOutput() {
        if (this._definition.retention === false || this._definition.retention === true) {
            return false
        } else {
            return this._definition.retention.storeOutput
        }
    }

}

module.exports = TaskDefinition
