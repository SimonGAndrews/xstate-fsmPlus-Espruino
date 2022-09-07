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

carBuildMachine3= { // case missing ID
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

carBuildMachine4 = {  // Case initial specified states not existing
  id: 'buildCar',
  initial: 'chassie',
  states: {
          chassie: {
          initial: 'axleXX',
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
        initial:'aTypeXXX',
        states: {aType:{},bType:{}}
      },
      scrap: {}
  }
};


/** fsmPlus returns initial state as string in the form of full id 
  * operates on top level machine (obj = fsmconfig, initialValue = undefined)
  * operates on any compound node (obj = state config object, initialValue = full ID to state )
  * works down from obj top level thru initial values of any substates as a recursive function
  * checking each level until no substates exist.
  * throws error in cases where 
  *  - initial not present where (states.states exists) 
  *  - a specified initial state is not available in the state's substates
*/

// fsmPlus - returns the state config object from a given full state ID
// assumes a full state id which exists in the machine
// to do - does not validate #machineID
function getStateFromID(id,fsmConfig){
  if (id == null) return null;
  path = 'states.' + id.slice(id.indexOf('.')+1).split('.').join('.states.');
  return path.split('.').reduce((prev, curr) => prev && prev[curr], fsmConfig);
 }

/*
call with:
   fsmConfig
   initial state - full state ID of state to resolve initial or undefined to resolve machine level initial
   traps machine missing ID or top level initial ONLY when called on machine level (ie initialState undefined)
   traps when called with invalid initialState and invalid initial: state found in config
*/
function getInitial(fsmConfig,initialState) {
  if (!initialState) { /* looking at Machine level */
    if (!fsmConfig.id) throw new Error('(getInitial) - machine needs an ID');
    if (!fsmConfig.initial) throw new Error('(getInitial) - initial not found for machine ' + fsmConfig.id);
   initialState = '#' + fsmConfig.id + '.' + fsmConfig.initial;
  } 

  /*now looking for initial on a substate*/
  var obj = getStateFromID(initialState,fsmConfig);
  if (!obj) throw new Error ('(getInitial) - initial state ' + initialState + ' not found in config.');
  if (typeof obj.initial === "undefined") return initialState 
  else return getInitial(fsmConfig,initialState +'.'+ obj.initial);
}

/* exercise visually without jest (ie on Espruino)
console.log ("Machine > " + getInitial(carBuildMachine1));
console.log ("#buildCar.chassie > " + getInitial(carBuildMachine1,'#buildCar.chassie'));
console.log ("buildCar.chassie.engine > " + getInitial(carBuildMachine1,'#buildCar.chassie.engine'));
console.log ("#buildCar.body > " + getInitial(carBuildMachine1,'#buildCar.body'));
console.log(getInitial(carBuildMachine2,"#buildCar.body"));  // mising initial in config
console.log(getInitial(carBuildMachine3,"#buildCar.body"));  // missing ID in config 
*/

test('get state from ID for 1st level state returns object', () => {
  expect(getStateFromID("#buildCar.chassie",carBuildMachine1)).toHaveProperty("states")
});

test('get state from ID for substate returns object', () => {
  expect(getStateFromID("#buildCar.chassie.axle",carBuildMachine1)).toHaveProperty("on")
});

test('get state from ID for 1st level state returns object', () => {
  expect(getStateFromID("#buildxxx.chassie",carBuildMachine1)).toHaveProperty("states")
});

test('find initial state for the machine', () => {
  expect(getInitial(carBuildMachine1)).toBe("#buildCar.chassie.axle");
});

test('find initial state on path of machines initial', () => {
  expect(getInitial(carBuildMachine1,"#buildCar.chassie")).toBe("#buildCar.chassie.axle");
});

test('find initial in state not on machine initial path', () => {
  expect(getInitial(carBuildMachine1,"#buildCar.body")).toBe("#buildCar.body.aType");
});

test('find initial in state not on machine initial path in substate', () => {
  expect(getInitial(carBuildMachine1,"#buildCar.chassie.engine")).toBe("#buildCar.chassie.engine.transmission");
});

test('traps error - initial missing when finding initial on machine', () => {
  expect(() => {getInitial(carBuildMachine2)}).toThrow('initial not found for machine');
});

test('does not trap error  initial missing - when specifying an initialState', () => {
  expect(getInitial(carBuildMachine2,"#buildCar.body")).toBe("#buildCar.body.aType");
});

test('traps error - missing ID finding initial on machine', () => {
  expect(() => {getInitial(carBuildMachine3)}).toThrow('machine needs an ID');
});

test('does not trap error  Missing ID - when specifying an initialState', () => {
  expect(getInitial(carBuildMachine3,"#buildCar.body")).toBe("#buildCar.body.aType");
});

test('traps error - called with initialState not in config', () => {
  expect(() => {getInitial(carBuildMachine4,'#buildCar.chassiex')}).toThrow('not found in config');
});

test('traps error - an initial state in config does not exist', () => {
  expect(() => {getInitial(carBuildMachine4,'#buildCar.chassie')}).toThrow('not found in config');
});