const createMachine = require('xstate-fsm').createMachine;

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } }
  }
});

console.log(toggleMachine);

const initialState  = toggleMachine.initialState;

const toggledState = toggleMachine.transition(initialState, 'TOGGLE');
console.log (toggledState.value);
const untoggledState = toggleMachine.transition(toggledState, 'TOGGLE');
console.log (untoggledState.value);
// => 'inactive'