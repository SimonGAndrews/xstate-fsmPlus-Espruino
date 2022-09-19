/* Unit tests via jest for fsmplus state referencing functions */

const {createMachine,getStateMap,getStateFromID,getInitial,validateStateID,makeStateID,assign} = require("../../src/xstate-fsm");


carBuildMachine1 = { // baseline case
  id: 'buildCar',
  initial: 'chassie',
  states: {
          chassie: {
          initial: 'axle',
          on:{SCRAP: '#buildCar.scrap'},
          states:{
            axle: { on:{DONE: '#buildCar.body', RESET:'#buildCar.chassie.engine'}},
            engine: {
              initial: 'transmission',
              on:{SCRAP: '#buildCar.chassie.engine.scrapEngine'},
              states:{
                  block:{id:'engineBlock', on:{DONE: 'transmission'}},
                  transmission:{ on:{DONE: '#buildCar.chassie.axle'}},
                  scrapEngine:{}
              }
            }
          },
      },
      body: {
        id:'body',
        type:'atomic',
        initial:'aType',
        states: {aType:{},bType:{}}
      },
      scrap: {}
  }
};

stateMap = getStateMap(carBuildMachine1);


/**  function validateStateID(stateRef,stateMap,mapInitial)
 * fsmPlus - validates/converts and returns full state ID from a state reference
 * using lookups into stateMap. expects arg stateRef is in form of a full state id or a custom id 
 *  - in all cases returns null if resolved state does not exist in stateMap
 *  - returns stateRef as full ID if exists as key in stateMap
 *  - returns full ID lookup in stateMap if stateRef is a custom ID 
 *  - returns stateRef as full ID if stateRef is pathID of a custom ID
 *  - returns lookup of initial in stateMap when mapInitial is true (used validating target paths) 
 *  
 */

 /**  function makeStateID(name, from, machineID) 
  * fsmPlus issue #16- returns a full state ID (or null if error)
  * supporting xstate node referencing techniques,
  * arg: name - the name found in config
  * arg: from - the full state ID context from which name is used 
  * returned value is NOT validated as existing in the config -see validateStateID() for this
 */
 
  /* first level name */
  /* sibling state */

test('validate stateID exists', () => {
  expect(validateStateID("#buildCar.chassie",stateMap)).toBe("#buildCar.chassie")
});

test('validate stateID does not exist', () => {
  expect(validateStateID("#buildCar.chassiex",stateMap)).toBe(null)
});

test('validate stateID handles undefined reference', () => {
  expect(validateStateID(undefined,stateMap)).toBe(null)
});

test('validate stateID handles null reference', () => {
  expect(validateStateID(null,stateMap)).toBe(null)
});

test('validate custom ID exists and return path', () => {
  expect(validateStateID("#engineBlock",stateMap)).toBe("#buildCar.chassie.engine.block")
});

test('validate custom ID does not exist', () => {
  expect(validateStateID("engineBlockx",stateMap)).toBe(null)
});

test('validate state name when its a path of custom ID', () => {
  expect(validateStateID("#buildCar.body.aType",stateMap)).toBe('#buildCar.body.aType')
});

test('validate stateID exists and return initial', () => {
  expect(validateStateID("#buildCar.chassie",stateMap,true)).toBe("#buildCar.chassie.axle")
});

test('validate stateID does not exist with return initial true', () => {
  expect(validateStateID("#buildCar.chassiex",stateMap,true)).toBe(null)
});

test('make ID from full state ID ', () => {
  expect(makeStateID("#buildCar.scrap","#buildCar.chassie")).toBe("#buildCar.scrap")
});

test('make ID from custom ID ', () => {
  expect(makeStateID("#body","#buildCar.chassie.engine.engineBlock")).toBe("#body")
});

test('make ID from custom ID and validate, returning pathID', () => {
  expect (validateStateID(makeStateID("#body","#buildCar.chassie.engine.engineBlock"),stateMap)).toBe("#buildCar.body")
});

test('make ID from custom ID and validate with getInitial, returning initial', () => {
  expect (validateStateID(makeStateID("#body","#buildCar.chassie.engine.engineBlock"),stateMap,true)).toBe("#buildCar.body.aType")
});

test('validate non existing custom ID and returning null', () => {
  expect (validateStateID(makeStateID("#bodyx","#buildCar.chassie.engine.engineBlock"),stateMap)).toBe(null)
});

test('validate relative state', () => {
  expect (validateStateID(makeStateID(".engine","#buildCar.chassie"),stateMap)).toBe('#buildCar.chassie.engine')
});

test('validate relative state with getInitial returning initial', () => {
  expect (validateStateID(makeStateID(".engine","#buildCar.chassie"),stateMap,true)).toBe('#buildCar.chassie.engine.transmission')
});

test('validate relative state with getInitial returning full path as initial', () => {
  expect (validateStateID(makeStateID(".axle","#buildCar.chassie"),stateMap,true)).toBe('#buildCar.chassie.axle')
});


const lightMachine = {
  id: "machine",
  initial: "green",
  states: {
    green: {
      on: {
        TIMER: {
          target: "yellow",
        },
      },
    },
    yellow: {
      on: {
        TIMER: {
          target: "red",
        },
      },
    },
    red: {
      initial: "walk",
      states: {
        walk: {
          on: {
            PED_COUNTDOWN: {
              target: "wait",
            },
          },
        },
        wait: {
          on: {
            PED_COUNTDOWN: {
              target: "stop",
            },
          },
        },
        stop: {},
        blinking: {},
      },
      on: {
        TIMER: {
          target: "green",
        },
      },
    },
  },
  on: {
    POWER_OUTAGE: {
      target: ".red.blinking",
    },
    POWER_RESTORED: {
      target: ".red",
    },
  },
};

let stateMap2 = getStateMap(lightMachine);
// console.log (stateMap2);

test('make ID for machine level name', () => {
  expect(makeStateID("yellow","#machine")).toBe("#machine.yellow")
});

test('make ID from machine level plus a sub state ', () => {
  expect(makeStateID("yellow","#machine.red")).toBe("#machine.yellow")
});

test('make ID for machine level name, validate and get initial', () => {
  expect (validateStateID(makeStateID("red","#machine"),stateMap2,true)).toBe('#machine.red.walk')
});

test('make ID for relative name from machine level name, validate and get initial', () => {
  expect (validateStateID(makeStateID(".red","#machine"),stateMap2,true)).toBe('#machine.red.walk')
});

test('make ID for relative name (with substate) from machine level, validate and get initial as full path', () => {
  expect (validateStateID(makeStateID(".red.blinking","#machine"),stateMap2,true)).toBe('#machine.red.blinking')
});

test('make ID for relative name, validate and get initial as full path', () => {
  expect (validateStateID(makeStateID(".wait","#machine.red"),stateMap2,true)).toBe('#machine.red.wait')
});

test('make ID for invalid relative name, validate and return null', () => {
  expect (validateStateID(makeStateID(".run","#machine.red"),stateMap2,true)).toBe(null)
});

test('make ID for sibling state, validate and get initial as full path', () => {
  expect (validateStateID(makeStateID("wait","#machine.red.walk"),stateMap2,true)).toBe('#machine.red.wait')
});

test('make ID for invalid sibling state, validate and return null', () => {
  expect (validateStateID(makeStateID("run","#machine.red.walk"),stateMap2,true)).toBe(null)
});