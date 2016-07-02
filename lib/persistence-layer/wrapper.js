'use strict'

let _ = require('lodash')
let BPromise = require('bluebird')

let persistenceLayerErrors = require('./errors.js')


module.exports = (persistenceLayer, errorMonitoring) => {

    /* istanbul ignore if */
    if (persistenceLayer.__monitored) {
        return
    }
    persistenceLayer.__monitored = true


    let functionNames = [
        'getNextPendingTask',
        'setTaskProcessingTime',
        'cancelTaskProcessing',
        'finishTaskProcessing',
        'getNextPollingTime',
        'storeNewTask'
    ]

    _.forEach(functionNames, (functionName) => {

        let originalFunction = persistenceLayer[functionName]

        persistenceLayer[functionName] = (...args) => {

            return BPromise.try(() => {

                return Reflect.apply(originalFunction, persistenceLayer, args)

            })
                .catch((err) => {

                    let wrappedErr = new persistenceLayerErrors.PersistenceLayerAccessError(err, functionName, args)

                    errorMonitoring(wrappedErr)

                    throw wrappedErr

                })

        }

    })

}
