carBuild = {
  // id: 'buildCar',
   initial: 'chassie',
    context: {},
    states: {
        chassie: {
          initial: 'engine',
            type:'compound',
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
            type:'atomic'
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

  console.log (getInitial(carBuild));