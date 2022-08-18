const createMachine = require('xstate-fsm').createMachine;
const interpret = require('xstate-fsm').interpret;

const toggleMachine = createMachine({
    id: 'toggle',
    initial: 'inactive',
    states: {
      inactive: { on: { TOGGLE: 'active' } },
      active: { on: { TOGGLE: 'inactive' } }
    }
  });
  
console.log(toggleMachine);

const toggleService = interpret(toggleMachine).start();

toggleService.subscribe((state) => {
  console.log(state.value);
});

toggleService.send('TOGGLE');
toggleService.send('TOGGLE');
toggleService.stop();