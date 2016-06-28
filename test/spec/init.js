'use strict'

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

})
