# The Pencil Pusher

[![Build Status](https://img.shields.io/travis/analog-nico/pencil-pusher/master.svg?style=flat-square)](https://travis-ci.org/analog-nico/pencil-pusher)
[![Coverage Status](https://img.shields.io/coveralls/analog-nico/pencil-pusher.svg?style=flat-square)](https://coveralls.io/r/analog-nico/pencil-pusher)
[![Dependency Status](https://img.shields.io/david/analog-nico/pencil-pusher.svg?style=flat-square)](https://david-dm.org/analog-nico/pencil-pusher)
[![Known Vulnerabilities](https://snyk.io/test/npm/pencil-pusher/badge.svg?style=flat-square)](https://snyk.io/test/npm/pencil-pusher)


Description forthcoming.

## Installation

[![NPM Stats](https://nodei.co/npm/pencil-pusher.png?downloads=true)](https://npmjs.org/package/pencil-pusher)

This is a module for node.js and is installed via npm:

``` bash
npm install pencil-pusher --save
```

## Usage

Description forthcoming.

## Contributing

To set up your development environment for `pencil-pusher`:

1. Clone this repo to your desktop,
2. in the shell `cd` to the main folder,
3. hit `npm install`,
4. hit `npm install gulp -g` if you haven't installed gulp globally yet, and
5. run `gulp dev`. (Or run `node ./node_modules/.bin/gulp dev` if you don't want to install gulp globally.)

`gulp dev` watches all source files and if you save some changes it will lint the code and execute all tests. The test coverage report can be viewed from `./coverage/lcov-report/index.html`.

If you want to debug a test you should use `gulp test-without-coverage` to run all tests without obscuring the code by the test coverage instrumentation.

## Change History

- v0.0.4 (2019-02-21)
    - Feat: Supporting `maxConcurrentTasks` on the task definition level. For the task type `options.execution.maxConcurrentTasks` overwrites the global `maxConcurrentTasks` if it is lower than the global value.
      To support this setting, custom persistence layer implementations have to process the new `excludeTasksWithNames` parameter of the `getNextPendingTask` and `getNextPollingTime` functions. See `PersistenceLayerBase` for details.
- v0.0.3 (2018-08-21)
    - Feat: tracking if a task is taking too long
        - Forwarding `TaskExecutionTakingTooLongError` to error monitoring when task execution surpasses `execution.completesWithin` duration
        - Forwarding `TaskExecutionTakingTooLongFinishedError` to error monitoring when task finishes past `execution.completesWithin` duration
- v0.0.2 (2017-09-03)
    - Fix: do time calculations in utc to avoid dst switching issues
- v0.0.1 (2016-07-02)
    - Initial version

## License (ISC)

In case you never heard about the [ISC license](http://en.wikipedia.org/wiki/ISC_license) it is functionally equivalent to the MIT license.

See the [LICENSE file](LICENSE) for details.
