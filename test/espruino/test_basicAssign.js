const createMachine = require('xstate-fsm').createMachine;
const interpret = require('xstate-fsm').interpret;
const assign = require('xstate-fsm').assign;

const lightMachine = createMachine({
  id: 'light',
  initial: 'green',
  context: {redLights: 10, greenlights:0, yellowlights:0 ,btw:12},
  states: {
    green: {
      exit: [assign({ greenlights: (ctx) => ctx.greenlights + 1 })],
      on: {
        TIMER: 'yellow'
      }
    },
    yellow: {
        entry: [assign({ yellowlights: (ctx) => ctx.yellowlights + 1 })
              ,assign({ btw: (ctx) => ctx.btw + 12 })
              ,assign({ redLights: (ctx) => ctx.redLights + 1 })
      ],
      on: {
        TIMER: {
          target: 'red',
        }
      }
    },
    red: {
      entry: [assign({ redLights: (ctx) => ctx.redLights + 1 })],
      on: {
        TIMER: 'green'
      }
    }
  }
});

console.log(JSON.stringify(lightMachine,null,3));
const lightService = interpret(lightMachine);

lightService.subscribe((state) => {
  console.log(state);
});

lightService.start();
lightService.send('TIMER');
lightService.send('TIMER');
lightService.send('TIMER');
lightService.send('TIMER');