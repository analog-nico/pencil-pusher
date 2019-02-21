'use strict'

let _ = require('lodash')


class TaskDispatchTracker {

    constructor({
        maxConcurrentTasks
    }) {

        this._concurrentTasks = 0
        this._maxConcurrentTasks = _.isInteger(maxConcurrentTasks) && maxConcurrentTasks > 0 ? maxConcurrentTasks : 1

        this._taskMap = new Map()

    }

    addTaskDefinition(taskDefinition) {

        this._taskMap.set(taskDefinition.getName(), {
            definition: taskDefinition,
            concurrentTasks: 0
        })

    }

    trackTaskStarted(name) {

        // Must register task synchronously in this function to avoid race conditions

        this._concurrentTasks += 1

        this._taskMap.get(name).concurrentTasks += 1

    }

    trackTaskStopped(name) {

        this._concurrentTasks -= 1

        this._taskMap.get(name).concurrentTasks -= 1

    }

    reachedMaxCapacity() {

        return this._concurrentTasks >= this._maxConcurrentTasks

    }

    _reachedMaxCapacityForTask(task) {

        let maxConcurrentTasks = task.definition.getMaxConcurrentTasks()
        if (maxConcurrentTasks === null) {
            return false
        }

        return task.concurrentTasks >= maxConcurrentTasks

    }

    reachedMaxCapacityForTask(name) {

        let task = this._taskMap.get(name)

        return this._reachedMaxCapacityForTask(task)

    }

    getTaskNamesThatReachedMaxCapacity() {

        let taskNames = []

        this._taskMap.forEach((task, name) => {

            if (this._reachedMaxCapacityForTask(task)) {
                taskNames.push(name)
            }

        })

        return taskNames

    }

}

module.exports = TaskDispatchTracker
