carBuildMachine = {
  id: 'buildCar',
  initial: 'chassie',
  context: {},
  states: {
          chassie: {
          initial: 'axle',
       //    type:'compound',
          on:{
              SCRAP: '#buildCar.scrap'
         //     ,DONE: 'body'
          },
          states:{
              engine: {
                initial: 'block',
                on:{SCRAP: '#buildCar.chassie.engine.scrapEngine'},
                states:{
                    block:{id:'engineBlock', on:{DONE: 'transmission'}},
                    transmission:{ on:{DONE: '#buildCar.chassie.axle'}},
                    scrapEngine:{}
                }
              },
              axle: { on:{DONE: '#buildCar.body'}}
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

/** fsmPlus returns initial state as string in the form of full id 
  * operates on top level machine (obj = fsmconfig, initialValue = undefined)
  * operates on any compound node (obj = state config object, initialValue = full ID to state )
  * works down from obj top level thru initial values of any substates as a recursive function
  * checking each level until no substates exist.
  * throws error in cases where 
  *  - initial not present where (states.states exists) 
  *  - a specified initial state is not available in the state's substates
*/
function getInitial(obj, initialValue) {
   if (initialValue === undefined) { /* assume working on a machine config */
    if (!(obj.id)) {
      throw new Error('(getInitial) - Machine config requires an ID at top level');
    } else initialValue = ['#' + obj.id];
  }

  if (obj.states && obj.initial) { 
    if (obj.states[obj.initial]) { // initial node verified as found in substates
      return getInitial(obj.states[obj.initial], initialValue + '.' + obj.initial);
    } else throw new Error('(getInitial) - initial state ' + obj.initial + ' not found ' + (initialValue ? 'at state ' + initialValue : ''));
  } else if ((obj.states) && !(obj.initial)) throw new Error('(getInitial) - initial not defined ' + (initialValue ? 'for state ' + initialValue : 'for machine.'))
  return initialValue;
}

/* fsmPlus Function - returns a map of all state nodes in a machine 
  * in the form of an object with a key set to ID of each state node (custom ID or full def ID).
  * the keys value is an object with optional properties:
  *  - pathID: state ID if state node ID is a custom ID
  *  - initial: id of the state nodes initial state/substate when node is compound
  *  - type: future uses ?
  * a recursive function , Called with arg obj set to machine config object, other args are empty on initial call
  * see functions: validateStateID(), for usage
*/
function getStateMap(obj, sofar,stateMap) { 
  if (sofar === undefined) {
    if (typeof(obj.id) === 'undefined') {
      throw new Error ('(getStateMap) - Machine config requires an ID at top level');
    } else {
      sofar = ['#' + obj.id];
      stateMap = {};
    }
  }
  if (obj.states !== undefined) { // to do simplify
    Object.keys(obj.states).forEach(function (k) {
        if ('id' in obj.states[k]) { // add id as a custom
          node = '#'+ obj.states[k].id;
          stateMap[node] = {};
          stateMap[node].pathID = sofar.concat([k]).join('.');
        }
       else {
         node = sofar.concat([k]).join('.');
         stateMap[node]= {};
       }
       /* check if object has substates and assign type and initial */
        if (obj.states[k].states) {
          stateMap[node].type = 'C';
          stateMap[node].initial = getInitial(obj.states[k],sofar.concat([k]).join('.'));
        }
        else stateMap[node].type = 'A';

        if (typeof(obj.states[k].states) === 'object') getStateMap(obj.states[k],sofar.concat([k]),stateMap);
        else return stateMap;
    });
 } 
  return stateMap;
}

// fsmPlus - returns the state config object from a given full state ID
// assumes a full state id which exists in the machine
function getStateFromID(id, fsmConfig) {
  if (id == null) return null
  path = 'states.' + id.slice(id.indexOf('.') + 1).split('.').join('.states.');
  return path.split('.').reduce((prev, curr) => prev && prev[curr], fsmConfig);
}

/* fsmPlus - validates/converts and returns full def ID from varying types of state reference
 * using lookups into stateMap. expects arg stateRef is in form of a full state id or a custom id 
 *  - in all cases returns null if resolved state does not exist in stateMap
 *  - returns stateRef as full ID if exists as key in stateMap
 *  - returns full ID lookup in stateMap if stateRef is a custom ID 
 *  - returns stateRef as full ID if stateRef is pathID of a custom ID
 *  - returns initial lookup in stateMap when mapInitial is true (used validating target paths)
*/
function validateStateID(stateRef,stateMap,mapInitial) {
  if (!(stateMap[stateRef])){ 
    /* stateRef not a full state ID - maybe a custom id */
    if (id = Object.keys(stateMap).find( k => stateMap[k].pathID === stateRef)){
      /* id assigned to key of a custom id */ 
      if (mapInitial && stateMap[id].initial) return stateMap[id].initial
      return  stateMap[id].pathID
    } 
    else return null ;
  }
  else if (mapInitial && stateMap[stateRef].initial) return stateMap[stateRef].initial
  return (stateMap[stateRef].pathID) ? stateMap[stateRef].pathID : stateRef
}

/** fsmPlus - returns a full state ID (or null if error)
  * creates ID from arg stateRef in cases of stateRef being
  *  - custom ID or full def id
  *  - relative state
  *  - a named sibling state 
  *  - first level named state (fsm backward compatabile) 
  * arg value is the current state from which the reference is made
  * arg machine ID is for the current machine
*/
function makeStateID(stateRef, value, machineID) {
  if (stateRef == null || stateRef == '') /* arg error*/   return null;
  if (stateRef.substr(0, 1) === '#') /* custom ID */   return stateRef;
  if (stateRef.substr(0, 1) === '.') /* relative state */  return value + stateRef;
  if (value === stateRef) /* first level name */ return '#' + machineID + '.' + stateRef;
  pos = (value.lastIndexOf('.')); /* sibling state */
  if (pos === -1) return null;
  else return value.substr(0, pos + 1) + stateRef;
}


stateMap = getStateMap(carBuildMachine);
console.log(stateMap);
// fsmConfig = carBuildMachine;

console.log (validateStateID('#buildCar.chassie',stateMap));
console.log (validateStateID('#buildCar.chassie',stateMap,true));

console.log (validateStateID('#engineBlock',stateMap));

console.log (validateStateID('#body',stateMap));
console.log (validateStateID('#body',stateMap,true));
console.log (validateStateID('#buildCar.body',stateMap));
console.log (validateStateID('#buildCar.body',stateMap,true));

