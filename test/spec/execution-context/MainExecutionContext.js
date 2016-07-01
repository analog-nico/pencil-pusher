'use strict'

let MainExecutionContext = require('../../../lib/execution-context/MainExecutionContext.js')
let TaskDefinition = require('../../../lib/task/TaskDefinition.js')

describe('MainExecutionContext', () => {

    it('should run a function', () => {

        let executionContext = new MainExecutionContext()

        let task = {
            name: 'test',
            input: 'some input'
        }

        let taskDefinition = new TaskDefinition('test', {
            implementation: (input) => {
                return `${ input } processed`
            }
        })

        expect(executionContext.run(task, taskDefinition)).to.eql('some input processed')

    })

    it('should run a function provided by an absolute path', () => {

        let executionContext = new MainExecutionContext()

        let task = {
            name: 'test',
            input: 'some input'
        }

        let taskDefinition = new TaskDefinition('test', {
            implementation: require.resolve('../../fixtures/task-src/sync-function.js')
        })

        expect(executionContext.run(task, taskDefinition)).to.eql('some input processed by sync-function.js')

    })

    it('should throw if a module provided by an absolute path does not export a function', () => {

        let executionContext = new MainExecutionContext()

        let task = {
            name: 'test',
            input: 'some input'
        }

        let taskDefinition = new TaskDefinition('test', {
            implementation: require.resolve('../../fixtures/task-src/no-function.js')
        })

        expect(() => {
            executionContext.run(task, taskDefinition)
        }).to.throw('The implementation for task "test" does not point to a function')

    })

})
