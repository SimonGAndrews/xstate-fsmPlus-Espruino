# Regression Test Files for xstate-fsmPlus-Espruino

## fsmPlus.test.js   - modifed version of fsm.test.js 

a jest test

fsmPlus.test.js is a modified javascript version of the original xstate/fsm test file from
<https://github.com/statelyai/xstate/tree/main/packages/xstate-fsm/test>

This file can be run in node, as a regression test of the initial xstate/fsm functionality.

This file has been modified for fsmPlus functionality:

* all machine configurations in the test have been given an id: property.
* state.value - expected results that included state.value have been change so that state.value includes the machine id with a '#' prefix.  (to correspond to the the full id format of value used in fsmPlus)

## deep.test.js

a jest test

the tsc transpiled copy of <https://github.com/statelyai/xstate/blob/main/packages/core/test/deep.test.ts>

an xstate core test for Hierarchical State Nodes, tests new hierarchical node functionality is in line with equivalent xstate core  



## how jest tests were setup and executed
as example: 
Copy xstate-fsm unit test from XState 

working with https://github.com/statelyai/xstate/tree/main/packages/xstate-fsm/test

* transpile fsm.test.ts to .js using tsc in a temp fork of XState.
* copy fsm.test.js to this folder
* npm install --save-dev jest
* setup jest https://jestjs.io/ with a config 
* run with > jest fsm.test.js

