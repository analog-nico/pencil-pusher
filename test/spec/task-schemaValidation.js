'use strict'

let moment = require('moment')

let MemoryPersistenceLayer = require('../../lib/persistence-layer/MemoryPersistenceLayer.js')
let PencilPusher = require('../../')


describe('Tasks with schema definitions', () => {

    const DEFAULT_RUNNING_TIME = 20

    it('should validate the input (fail)', (done) => {

        let errorsMonitored = []

        let pencilPusher = new PencilPusher({
            persistenceLayer: new MemoryPersistenceLayer(),
            errorMonitoring: (err) => {
                errorsMonitored.push(err)
            }
        })

        pencilPusher.defineTask('with schema', {
            inputSchema: {
                type: 'object',
                required: ['a', 'b'],
                properties: {
                    a: {
                        type: 'number'
                    }
                }
            },
            implementation: () => {}
        })

        pencilPusher.scheduleTask({
            name: 'with schema',
            input: {
                a: 'not a number'
                // b missing
            },
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored.length).to.eql(1)
                expect(errorsMonitored[0].message).to.contain('The input of a "with schema" task failed to validate: ')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should validate the input (success)', (done) => {

        let errorsMonitored = []

        let pencilPusher = new PencilPusher({
            persistenceLayer: new MemoryPersistenceLayer(),
            errorMonitoring: (err) => {
                errorsMonitored.push(err)
            }
        })

        pencilPusher.defineTask('with schema', {
            inputSchema: {
                type: 'object',
                required: ['a', 'b'],
                properties: {
                    a: {
                        type: 'number'
                    }
                }
            },
            implementation: () => {}
        })

        pencilPusher.scheduleTask({
            name: 'with schema',
            input: {
                a: 1,
                b: 'some string'
            },
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored.length).to.eql(0)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should validate the output (fail)', (done) => {

        let errorsMonitored = []

        let pencilPusher = new PencilPusher({
            persistenceLayer: new MemoryPersistenceLayer(),
            errorMonitoring: (err) => {
                errorsMonitored.push(err)
            }
        })

        pencilPusher.defineTask('with schema', {
            implementation: () => {
                return {
                    a: 'not a number'
                    // b missing
                }
            },
            outputSchema: {
                type: 'object',
                required: ['a', 'b'],
                properties: {
                    a: {
                        type: 'number'
                    }
                }
            }
        })

        pencilPusher.scheduleTask({
            name: 'with schema',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored.length).to.eql(1)
                expect(errorsMonitored[0].message).to.contain('The output of a "with schema" task failed to validate: ')

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

    it('should validate the output (success)', (done) => {

        let errorsMonitored = []

        let pencilPusher = new PencilPusher({
            persistenceLayer: new MemoryPersistenceLayer(),
            errorMonitoring: (err) => {
                errorsMonitored.push(err)
            }
        })

        pencilPusher.defineTask('with schema', {
            implementation: () => {
                return {
                    a: 1,
                    b: 'some string'
                }
            },
            outputSchema: {
                type: 'object',
                required: ['a', 'b'],
                properties: {
                    a: {
                        type: 'number'
                    }
                }
            }
        })

        pencilPusher.scheduleTask({
            name: 'with schema',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            try {

                expect(errorsMonitored.length).to.eql(0)

            } finally {
                pencilPusher.stop()
            }

            done()

        }, DEFAULT_RUNNING_TIME)

    })

})
