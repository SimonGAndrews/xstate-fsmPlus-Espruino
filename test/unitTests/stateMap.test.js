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

carBuildMachine2 = { //case missing machine level initial
  id: 'buildCar',
  // initial: 'chassie',
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

carBuildMachine3 = { //case missing machine level id 
  // id: 'buildCar',
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
carBuildMachine4 = { //case with initial pointing to non existant state
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
        initial:'aTypex', //illegal state
        states: {aType:{},bType:{}}
      },
      scrap: {}
  }
};

getStateFromID = require("../../src/xstate-fsm").getStateFromID;
getInitial = require("../../src/xstate-fsm").getInitial;
getStateMap = require("../../src/xstate-fsm").getStateMap;

const expectedStateMap = {
    '#buildCar': { type: 'M', initial: '#buildCar.chassie.axle' },
    '#buildCar.chassie': { type: 'C', initial: '#buildCar.chassie.axle' },
    '#buildCar.chassie.axle': { type: 'A' },
    '#buildCar.chassie.engine': { type: 'C', initial: '#buildCar.chassie.engine.transmission' },
    '#engineBlock': { pathID: '#buildCar.chassie.engine.block', type: 'A' },
    '#buildCar.chassie.engine.transmission': { type: 'A' },
    '#buildCar.chassie.engine.scrapEngine': { type: 'A' },
    '#body': {
      pathID: '#buildCar.body',
      type: 'C',
      initial: '#buildCar.body.aType'
    },
    '#buildCar.body.aType': { type: 'A' },
    '#buildCar.body.bType': { type: 'A' },
    '#buildCar.scrap': { type: 'A' }
  }


/* test getStateFromID */
test('get state from ID for substate case 1', () => {
  expect(getStateFromID("#buildCar.chassie",carBuildMachine1)).toMatchObject(carBuildMachine1.states.chassie)
});

test('get state from ID for substate case 2', () => {
  expect(getStateFromID("#buildCar.chassie.axle",carBuildMachine1)).toMatchObject(carBuildMachine1.states.chassie.states.axle)
});

test('get state from ID for substate case 3', () => {
  expect(getStateFromID("#buildCar.body",carBuildMachine1)).toMatchObject(carBuildMachine1.states.body)
});

/* test getInitial and getStateMap */
test('traps error - initial property missing on machine', () => {
  expect(() => {getStateMap(carBuildMachine2)}).toThrow(" requires 'initial' state at top level");
});

test('traps error - missing ID property on machine', () => {
  expect(() => {getStateMap(carBuildMachine3)}).toThrow("Machine config requires 'id' at top level");
});

test('traps error - state defined in initial not present', () => {
  expect(() => {getStateMap(carBuildMachine4)}).toThrow("initial state aTypex not found in #buildCar.body");
});

test('stateMap contains key for machine ID with type M and initial property', () => {
  expect(getStateMap(carBuildMachine1)).toMatchObject({'#buildCar': { type: 'M', initial: '#buildCar.chassie.axle' }})
});


test('stateMap creates key with a custom ID for a state with an ID and creates a pathID property on atomic state', () => {
  expect(getStateMap(carBuildMachine1)).toMatchObject({'#engineBlock': { pathID: '#buildCar.chassie.engine.block', type: 'A' }})
});

test('stateMap creates key with a custom ID for a state with an ID and creates a pathID and initial propertys on compound state', () => {
  expect(getStateMap(carBuildMachine1)).toMatchObject({'#body': {
    pathID: '#buildCar.body',
    type: 'C',
    initial: '#buildCar.body.aType'
  }})
});

test('generate complete stateMap', () => {
  expect(getStateMap(carBuildMachine1)).toMatchObject(expectedStateMap)
});



// console.log (getStateMap(carBuildMachine1))