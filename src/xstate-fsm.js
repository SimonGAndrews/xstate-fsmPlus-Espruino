'use strict';

var InterpreterStatus ;

(function (InterpreterStatus) {
    InterpreterStatus[InterpreterStatus["NotStarted"] = 0] = "NotStarted";
    InterpreterStatus[InterpreterStatus["Running"] = 1] = "Running";
    InterpreterStatus[InterpreterStatus["Stopped"] = 2] = "Stopped";
})(InterpreterStatus || (InterpreterStatus = {})); 

const INIT_EVENT = { type: 'xstate.init' };
const ASSIGN_ACTION = 'xstate.assign';
function toArray(item) {
    return item === undefined ? [] : [].concat(item);
}
function assign(assignment) {
    return {
        type: ASSIGN_ACTION,
        assignment
    };
}
function toActionObject(
// tslint:disable-next-line:ban-types
action, actionMap) {
    action =
        typeof action === 'string' && actionMap && actionMap[action]
            ? actionMap[action]
            : action;
    return typeof action === 'string'
        ? {
            type: action
        }
        : typeof action === 'function'
            ? {
                type: action.name,
                exec: action
            }
            : action;
}
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
function createMatcher(value) {
    return (stateValue) => value === stateValue;
}
function toEventObject(event) {
    return (typeof event === 'string' ? { type: event } : event);
}
function createUnchangedState(value, context) {
    return {
        value,
        context,
        actions: [],
        changed: false,
        matches: createMatcher(value)
    };
}
function handleActions(actions, context, eventObject) {
    let nextContext = context;
    let assigned = false;
    const nonAssignActions = actions.filter((action) => {
        if (action.type === ASSIGN_ACTION) {
            assigned = true;
            let tmpContext = Object.assign({}, nextContext);
            if (typeof action.assignment === 'function') {
                tmpContext = action.assignment(nextContext, eventObject);
            }
            else {
                Object.keys(action.assignment).forEach((key) => {
                    tmpContext[key] =
                        typeof action.assignment[key] === 'function'
                            ? action.assignment[key](nextContext, eventObject)
                            : action.assignment[key];
                });
            }
            nextContext = tmpContext;
            return false;
        }
        return true;
    });
    return [nonAssignActions, nextContext, assigned];
}

/* fsmPlus ref issue #12 - returns the state config object from a given full state ID
 * assumes a valid full state id which exists in the machine
 * to do - does not validate #machineID
 */
 function getStateFromID(id,fsmConfig){
   if (id == null) return null;
   let path = 'states.' + id.slice(id.indexOf('.')+1).split('.').join('.states.');
   return path.split('.').reduce((prev, curr) => prev && prev[curr], fsmConfig);
 }

 /* fsnPlus ref issue 14 - returns the initial state as full state ID string
  * path = path to the state as full ID
  * stateObj = state object on path in which to determine intitial state
  */
 function getInitial(path,stateObj){
  while ('states' in stateObj && 'initial' in stateObj) { 
    if (!stateObj.states[stateObj.initial]) throw new Error('(getInitial) - initial state ' + stateObj.initial + ' not found in ' + path);   
    path = path +'.'+ stateObj.initial;
    stateObj = stateObj.states[stateObj.initial];
  }
  return path;
}

/** fsmPlus ref issue 15 - returns a map of all state nodes in a machine 
  * in the form of an object with a key set to ID of each state node (custom ID or full def ID).
  * the keys value is an object with optional properties:
  *  - pathID: full state ID if state node ID is a custom ID
  *  - initial: id of the state nodes initial state/substate when node is compound
  *  - type: M machine, C Compound, A Atomic, 
  * a recursive function , Called with arg obj set to machine config object, other args are empty on initial call
  * see functions: validateStateID(), for usage
  */
function getStateMap(obj,sofar,stateMap){ // recursive function to generate stateMap from fsmConfig
  if (!obj) throw new Error('(getStateMap) - called without a configuration object');
  if (!sofar) { //assume calling at top of config (machine)
    stateMap = {};
    if (! ('id' in obj)) {throw new Error ("(getStateMap) - Machine config requires 'id' at top level");}
    sofar = '#' + obj.id;
    if (!('initial' in obj) && 'states' in obj ) {throw new Error ("(getStateMap) - Machine " + sofar + " requires 'initial' state at top level");}
    stateMap[sofar]={type:'M',initial:getInitial(sofar,obj)};
  }

  if ('states' in obj) { 
    Object.keys(obj.states).forEach((k) => {
      let node="";  
      if ('id' in obj.states[k]) { // add node using Custom ID as key with a pathID property
        node = '#'+ obj.states[k].id;
        stateMap[node] = Object.assign({},{pathID: sofar +'.'+ k});
      } else {                    // add node using full state ID as key no pathID
        node = sofar +'.'+ k;
        stateMap[node]= {};
      }
      if ('states' in obj.states[k]) { //Compound state node - go down to substates
        stateMap[node].type = 'C';
        stateMap[node].initial = getInitial(sofar +'.'+ k,obj.states[k]);
        getStateMap(obj.states[k],sofar +'.'+ k,stateMap);
      }else {                         //Atomic state node 
        stateMap[node].type = 'A';
        return stateMap
      }
    });
  } 
  return stateMap;
}

/** fsmPlus - validates/converts and returns full state ID from a state reference
  * using lookups into stateMap. expects arg stateRef is in form of a full state id or a custom id 
  *  - in all cases returns null if resolved state does not exist in stateMap
  *  - returns stateRef as full ID if exists as key in stateMap
  *  - returns full ID lookup in stateMap if stateRef is a custom ID 
  *  - returns stateRef as full ID if stateRef is pathID of a custom ID
  *  - returns lookup of initial in stateMap when mapInitial is true (used validating target paths)
  */
function validateStateID(stateRef,stateMap,mapInitial) {
  if (!stateRef || !stateMap) return null;
  if (!(stateMap[stateRef])){ 
    /* stateRef not a full state ID - maybe a custom id */
    let id = '';
    if (id = Object.keys(stateMap).find( k => stateMap[k].pathID === stateRef)){
      /* return key or initial of a custom id */ 
      if (mapInitial && stateMap[id].initial) return stateMap[id].initial;
      return  stateMap[id].pathID;
    } 
    else return null ;
  }
  else if (mapInitial && stateMap[stateRef].initial) return stateMap[stateRef].initial;
  return (stateMap[stateRef].pathID) ? stateMap[stateRef].pathID : stateRef;
 }
 
/** fsmPlus issue #16- returns a full state ID (or null if error)
  * supporting xstate node referencing techniques,
  * arg: name - the name found in a config
  * arg: usedAt- the full state ID context from which name is used (logic assumes always begins with machineID)
  * returned value is NOT validated as existing in the config -see validateStateID() for this
  */
 function makeStateID(name,usedAt) {
   if(!name || !usedAt) return null;
   switch(name.substr(0, 1)) {
    case '#': /* full state or custom ID */
      return name
    case '.': /* relative id */
      return usedAt + name
    default: /* machine level or sibling state(strip off usedAt last state node) */
      let arr = usedAt.split('.');
      return arr.length==1? arr[0] +'.'+ name: arr.slice(0,arr.length-1).join('.') + '.' + name
  }
 }
 
function createMachine(fsmConfig, implementations ) {
  implementations = (typeof implementations !== 'undefined') ? implementations : {};
  /*  ref issue #13
    if (!IS_PRODUCTION) {
        Object.keys(fsmConfig.states).forEach((state) => {
            if (fsmConfig.states[state].states) {
                throw new Error(`Nested finite states not supported.
            Please check the configuration for the "${state}" state.`);
            }
        });
    }
  */
    const initialProps = handleActions(toArray(fsmConfig.states[fsmConfig.initial].entry).map((action) => toActionObject(action, implementations.actions)) , fsmConfig.context, INIT_EVENT);
    const initialActions = initialProps[0];
    const initialContext = initialProps[1];

    const machine = {
        config: fsmConfig,
        _options: implementations,
        initialState: {
            value: fsmConfig.initial, 
            actions: initialActions,
            context: initialContext,
            matches: createMatcher(fsmConfig.initial)
        },

        transition: (state, event) => {
            var _a, _b;
            var _obj = typeof state === 'string' 
              ? { value: state, context: fsmConfig.context }
              : state;
            const value = _obj.value;
            const context = _obj.context;

            const eventObject = toEventObject(event);
            const stateConfig = fsmConfig.states[value];
            if (!IS_PRODUCTION && !stateConfig) {
                throw new Error(`State '${value}' not found on machine ${(_a = fsmConfig.id) !== null && _a !== void 0 ? _a : ''}`);
            }
            if (stateConfig.on) {
                const transitions = toArray(stateConfig.on[eventObject.type]);
                for (const transition of transitions) {
                    if (transition === undefined) {
                        return createUnchangedState(value, context);
                    }

                    var _transitionObject = typeof transition === 'string' ? { target: transition } : transition;
                    const target = _transitionObject.target;
                    const actions = _transitionObject.actions === undefined ?  [] : _transitionObject.actions ;
                    const cond = _transitionObject.cond === undefined ? () => true : _transitionObject.cond ;

                    const isTargetless = target === undefined;
                    const nextStateValue = target !== null && target !== void 0 ? target : value;
                    const nextStateConfig = fsmConfig.states[nextStateValue];
                    if (!IS_PRODUCTION && !nextStateConfig) {
                        throw new Error(`State '${nextStateValue}' not found on machine ${(_b = fsmConfig.id) !== null && _b !== void 0 ? _b : ''}`);
                    }
                    if (cond(context, eventObject)) {
                        const allActions = (isTargetless
                            ? toArray(actions)
                            : []
                                .concat(stateConfig.exit? stateConfig.exit : [], actions? actions:[], nextStateConfig.entry?nextStateConfig.entry:[])
                                .filter((a) => a)).map((action) => toActionObject(action, machine._options.actions));
                        var _handleActions = handleActions(allActions, context, eventObject).slice(0,3);
                        var nonAssignActions = _handleActions[0];
                        var nextContext = _handleActions[1];
                        var assigned = _handleActions[2];

                        const resolvedTarget = target !== null && target !== void 0 ? target : value;
                        return {
                            value: resolvedTarget,
                            context: nextContext,
                            actions: nonAssignActions,
                            changed: target !== value || nonAssignActions.length > 0 || assigned,
                            matches: createMatcher(resolvedTarget)
                        };
                    }
                }
            }
            // No transitions match
            return createUnchangedState(value, context);
        }
    };
    return machine;
}

const executeStateActions = (state, event) => {
  state.actions.forEach((action) => {
      action && Object.assign({},action).exec(state.context, event);   
  });
};

function interpret(machine) {
    let state = machine.initialState;
    let status = InterpreterStatus.NotStarted; 

    var listeners = {};
    const service = {
        _machine: machine,
        send: (event) => {
            if (status !== InterpreterStatus.Running) {   
                return;
            }
            state = machine.transition(state, event);
            executeStateActions(state, toEventObject(event));
            const keys = Object.keys(listeners);
            for (const key of keys)  {
                listeners[key](state);
            };
        },
        subscribe: (listener) => {
            listeners[listener] = listener;
            listener(state);
            return {
                unsubscribe: () => delete listeners(listener)
            };
        },
        start: (initialState) => {
            if (initialState) {
                const resolved = typeof initialState === 'object'
                    ? initialState
                    : { context: machine.config.context, value: initialState };
                state = {
                    value: resolved.value,
                    actions: [],
                    context: resolved.context,
                    matches: createMatcher(resolved.value)
                };
                if (!IS_PRODUCTION) {
                    if (!(state.value in machine.config.states)) {
                        throw new Error(`Cannot start service in state '${state.value}'. The state is not found on machine${machine.config.id ? ` '${machine.config.id}'` : ''}.`);
                    }
                }
            }
            else {
                state = machine.initialState;
            }
            status = InterpreterStatus.Running; 
            executeStateActions(state, INIT_EVENT);
            return service;
        },
        stop: () => {
            status = InterpreterStatus.Stopped; 
            listeners = {};
            return service;
        },
        get state() {
            return state;
        },
        get status() {
            return status;
        }
    };
    return service;
}

Object.defineProperty(exports, 'InterpreterStatus', {
  enumerable: true,
  get: function () { return InterpreterStatus; }
});
exports.assign = assign;
exports.createMachine = createMachine;
exports.interpret = interpret;

/* Also export to enable unit testing */
exports.getInitial = getInitial;
exports.getStateFromID = getStateFromID;
exports.getStateFromID = getStateFromID;
exports.getStateMap = getStateMap;
exports.makeStateID = makeStateID;
exports.validateStateID = validateStateID;
