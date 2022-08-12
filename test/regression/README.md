# XState/fsm core tests

This folder contains core tests as provided by the XState/fsm package.
These tests will act as regression tests for changes to the original XState FSM package.
See <https://github.com/statelyai/xstate/blob/main/packages/xstate-fsm/test/fsm.test.ts>

These tests have been transpiled from the TypeScript source to JavaScript

## how test was setup and executed

Copy xstate-fsm unit test from XState FSM package and setup to run here via jest:

working with sources in <https://github.com/statelyai/xstate/tree/main/packages/xstate-fsm/test>

* transpile fsm.test.ts to .js using tsc ( tsc -t es5 fsm.test.ts) in a temp fork of XState.
* copy fsm.test.js to this folder
* setup jest (see <https://jestjs.io/> ) with a config
* execute test using terminal from this folder  > jest fsm.test.js
* See image fsm_test_baseline.PNG for expected test output
