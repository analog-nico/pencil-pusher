'use strict'

let PencilPusher = require('../../')
let MemoryPersistenceLayer = require('../fixtures/MemoryPersistenceLayer.js')

describe('During initialization PencilPusher', () => {

    it('should validate the options', () => {

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
        }).not.to.throw()

        expect(() => {
            new PencilPusher({
                persistenceLayer: new MemoryPersistenceLayer()
            })
        }).not.to.throw()

    })

})
