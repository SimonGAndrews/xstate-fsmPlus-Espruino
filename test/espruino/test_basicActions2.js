const createMachine = require('xstate-fsm').createMachine;
const interpret = require('xstate-fsm').interpret;
const assign = require('xstate-fsm').assign;

const lightMachine = createMachine({
  id: 'light',
  initial: 'green',
  context: { redLights: 0 },
  states: {
    green: {
      entry: () => console.log('entering green'),
      on: {
        TIMER: 'yellow'
      }
    },
    yellow: {
      on: {
        TIMER: {
          target: 'red',
          actions: () => console.log('Going to red!')
        }
      }
    },
    red: {
      entry: assign({ redLights: (ctx) => ctx.redLights + 1 }),
      exit: () => console.log('leaving Red'),
      on: {
        TIMER: 'green'
      }
    }
  }
});

const lightService = interpret(lightMachine);

lightService.subscribe((state) => {
  console.log(state);
});

lightService.start();
lightService.send('TIMER');
lightService.send('TIMER');