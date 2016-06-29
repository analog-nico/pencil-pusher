'use strict'

let moment = require('moment')

let PencilPusher = require('../../')


describe('PencilPusher\'s task management', () => {

    it('should schedule and process a task', (done) => {

        let pencilPusher = new PencilPusher({
            persistenceLayer: new PencilPusher.MemoryPersistenceLayer()
        })

        let taskWasExecuted = false

        pencilPusher.defineTask('simple', {
            implementation: () => {
                taskWasExecuted = true
            }
        })

        pencilPusher.scheduleTask({
            name: 'simple',
            input: null,
            due: moment().unix()
        })

        pencilPusher.start()

        setTimeout(() => {

            expect(taskWasExecuted).to.eql(true)

            pencilPusher.stop()

            done()

        }, 10)

    })

    it('should cancel an undefined task')

})
