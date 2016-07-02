'use strict'


class PersistenceLayerAccessError extends Error {

    constructor(cause, operation, args) {

        super()

        this.name = 'PersistenceLayerAccessError'
        this.message = `Failed to access the persistence layer with .${ operation }() caused by: ${ cause.message }`
        this.cause = cause
        this.operation = operation
        this.args = args

        this.stack = cause.stack

    }

}


module.exports = {
    PersistenceLayerAccessError
}
