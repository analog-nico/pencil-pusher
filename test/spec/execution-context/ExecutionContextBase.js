'use strict'

let ExecutionContextBase = require('../../../lib/execution-context/ExecutionContextBase.js')

describe('ExecutionContextBase', () => {

    it('should throw errors for every function', () => {

        let executionContext = new ExecutionContextBase()

        expect(() => {
            executionContext.run()
        }).to.throw()

    })

})
