'use strict'

let moment = require('moment')

let MainExecutionContext = require('../../lib/execution-context/MainExecutionContext.js')
let PencilPusher = require('../../')


describe('During initialization PencilPusher', () => {

    it('should validate the options of new PencilPusher(...)', () => {

        expect(() => {
            new PencilPusher()
        }).to.throw('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')

        expect(() => {
            new PencilPusher(null)
        }).to.throw(/* 'Cannot match against \'undefined\' or \'null\'.' or similar */)

        expect(() => {
            new PencilPusher(true)
        }).to.throw('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')

        expect(() => {
            new PencilPusher('not an object')
        }).to.throw('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')

        expect(() => {
            new PencilPusher({})
        }).to.throw('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')

        expect(() => {
            new PencilPusher({
                persistenceLayer: 'wrong type'
            })
        }).to.throw('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')

        expect(() => {
            new PencilPusher({
                persistenceLayer: new PencilPusher.PersistenceLayerBase()
            })
        }).to.throw('options.persistenceLayer must extend PencilPusher.PersistenceLayerBase')

        expect(() => {
            new PencilPusher({
                persistenceLayer: new PencilPusher.MemoryPersistenceLayer()
            })
        }).not.to.throw()

    })

    it('should validate a task definition', () => {

        let pencilPusher = new PencilPusher({
            persistenceLayer: new PencilPusher.MemoryPersistenceLayer()
        })

        expect(() => {
            pencilPusher.defineTask()
        }).to.throw('name must be a non-empty string')

        expect(() => {
            pencilPusher.defineTask('')
        }).to.throw('name must be a non-empty string')

        expect(() => {
            pencilPusher.defineTask('test', 'not an object')
        }).to.throw('options.implementation must be either a function or a path pointing to a source file.')

        expect(() => {
            pencilPusher.defineTask('test', { implementation: -1 })
        }).to.throw('options.implementation must be either a function or a path pointing to a source file.')

        expect(() => {
            pencilPusher.defineTask('test', { implementation: () => {} })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test', { implementation: () => {} })
        }).to.throw('A task named "test" is already defined')

        expect(() => {
            pencilPusher.defineTask('test2', { implementation: 'relative/path' })
        }).to.throw('The path passed to options.implementation must be absolute. Use require.resolve(...) to get the path.')

        expect(() => {
            pencilPusher.defineTask('test2', { implementation: __filename })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test3', {
                implementation: () => {},
                execution: 'not an object'
            })
        }).to.throw('options.execution must be an object.')

        expect(() => {
            pencilPusher.defineTask('test3', {
                implementation: () => {},
                execution: {
                    completesWithin: 'wrong type'
                }
            })
        }).to.throw('options.execution.completesWithin must either be a positive number (of seconds) or a moment.duration(...).')

        expect(() => {
            pencilPusher.defineTask('test3', {
                implementation: () => {},
                execution: {
                    completesWithin: -5
                }
            })
        }).to.throw('options.execution.completesWithin must either be a positive number (of seconds) or a moment.duration(...).')

        expect(() => {
            pencilPusher.defineTask('test3', {
                implementation: () => {},
                execution: {
                    completesWithin: 5
                }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test4', {
                implementation: () => {},
                execution: {
                    completesWithin: moment.duration(5, 'minutes')
                }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test5', {
                implementation: () => {},
                retention: 'wrong type'
            })
        }).to.throw('options.retention must either be a boolean or an object.')

        expect(() => {
            pencilPusher.defineTask('test5', {
                implementation: () => {},
                retention: true
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test6', {
                implementation: () => {},
                retention: {
                    period: 1
                }
            })
        }).to.throw('options.retention.period must either be Infinity or a moment.duration(...).')

        expect(() => {
            pencilPusher.defineTask('test6', {
                implementation: () => {},
                retention: {
                    period: Infinity
                }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test7', {
                implementation: () => {},
                retention: {
                    period: moment.duration(5, 'years')
                }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test8', {
                implementation: () => {},
                retention: {
                    storeOutput: 'wrongType'
                }
            })
        }).to.throw('options.retention.storeOutput must be a boolean.')

        expect(() => {
            pencilPusher.defineTask('test8', {
                implementation: () => {},
                retention: {
                    storeOutput: true
                }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test9', {
                implementation: () => {},
                inputSchema: 'not a schema'
            })
        }).to.throw()

        expect(() => {
            pencilPusher.defineTask('test9', {
                implementation: () => {},
                inputSchema: { type: 'string' }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test10', {
                implementation: () => {},
                outputSchema: 'not a schema'
            })
        }).to.throw()

        expect(() => {
            pencilPusher.defineTask('test10', {
                implementation: () => {},
                outputSchema: { type: 'string' }
            })
        }).to.not.throw()

        expect(() => {
            pencilPusher.defineTask('test11', {
                implementation: () => {},
                execution: {
                    context: 'unknown'
                }
            })
        }).to.throw('The execution context "unknown" does not exist')

        expect(() => {
            pencilPusher.defineTask('test11', {
                implementation: () => {},
                execution: {
                    context: 'main'
                }
            })
        }).to.not.throw()

    })

    describe('should validate a scheduled task', () => {

        let pencilPusher = null

        before(() => {

            pencilPusher = new PencilPusher({
                persistenceLayer: new PencilPusher.MemoryPersistenceLayer()
            })
            pencilPusher.defineTask('test', { implementation: () => {} })

        })

        it('options.name', () => {

            process.once('unhandledRejection', () => { /* Ignore it */ })

            return expect(pencilPusher.scheduleTask({
                name: false
            })).to.eventually.be.rejectedWith('options.name must be a non-empty string.')

        })

        it('options.name.length', () => {

            process.once('unhandledRejection', () => { /* Ignore it */ })

            return expect(pencilPusher.scheduleTask({
                name: ''
            })).to.eventually.be.rejectedWith('options.name must be a non-empty string.')

        })

        it('options.name defined', () => {

            process.once('unhandledRejection', () => { /* Ignore it */ })

            return expect(pencilPusher.scheduleTask({
                name: 'unknown'
            })).to.eventually.be.rejectedWith('No task definition for "unknown" found.')

        })

        it('options.input', () => {

            process.once('unhandledRejection', () => { /* Ignore it */ })

            return expect(pencilPusher.scheduleTask({
                name: 'test'
            })).to.eventually.be.rejectedWith('options.input is required.')

        })

        it('options.due', () => {

            process.once('unhandledRejection', () => { /* Ignore it */ })

            return expect(pencilPusher.scheduleTask({
                name: 'test',
                input: null,
                due: Infinity
            })).to.eventually.be.rejectedWith('options.due must be a finited number.')

        })

        it('all valid', () => {

            return expect(pencilPusher.scheduleTask({
                name: 'test',
                input: 'some input',
                due: 0
            })).to.eventually.be.fulfilled

        })

    })

    it('should validate a registered execution context', () => {

        let pencilPusher = new PencilPusher({
            persistenceLayer: new PencilPusher.MemoryPersistenceLayer()
        })

        expect(() => {
            pencilPusher.registerExecutionContext()
        }).to.throw('name must be a non-empty string')

        expect(() => {
            pencilPusher.registerExecutionContext('')
        }).to.throw('name must be a non-empty string')

        expect(() => {
            pencilPusher.registerExecutionContext('main')
        }).to.throw('An execution context named "main" is already defined')

        expect(() => {
            pencilPusher.registerExecutionContext('new', {})
        }).to.throw('executionContext must extend PencilPusher.ExecutionContextBase')

        expect(() => {
            pencilPusher.registerExecutionContext('new', new PencilPusher.ExecutionContextBase())
        }).to.throw('executionContext must extend PencilPusher.ExecutionContextBase')

        expect(() => {
            pencilPusher.registerExecutionContext('new', new MainExecutionContext())
        }).to.not.throw()

    })

})
