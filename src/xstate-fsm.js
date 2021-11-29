var InterpreterStatus;
(function (InterpreterStatus) {
    InterpreterStatus[InterpreterStatus["NotStarted"] = 0] = "NotStarted";
    InterpreterStatus[InterpreterStatus["Running"] = 1] = "Running";
    InterpreterStatus[InterpreterStatus["Stopped"] = 2] = "Stopped";
})(InterpreterStatus || (InterpreterStatus = {}));

exports.InterpreterStatus = InterpreterStatus;

// import { InterpreterStatus } from './types';
// export { InterpreterStatus };
const INIT_EVENT = { type: 'xstate.init' };
const ASSIGN_ACTION = 'xstate.assign';
function toArray(item) {
    return item === undefined ? [] : [].concat(item);
}
// export function assign(assignment) {
exports.assign = function assign(assignment) {
    return {
        type: ASSIGN_ACTION,
        assignment: assignment
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
// export function createMachine(fsmConfig, options = {}) {
exports.createMachine = function createMachine(fsmConfig, options) {
    options = (typeof options !== 'undefined') ? options : {};
    if (!IS_PRODUCTION) {
        Object.keys(fsmConfig.states).forEach((state) => {
            if (fsmConfig.states[state].states) {
                throw new Error(`Nested finite states not supported.
            Please check the configuration for the "${state}" state.`);
            }
        });
    }
// const [initialActions, initialContext] = handleActions(toArray(fsmConfig.states[fsmConfig.initial].entry).map((action) => toActionObject(action, options.actions)), fsmConfig.context, INIT_EVENT);
    const initialProps = handleActions(toArray(fsmConfig.states[fsmConfig.initial].entry).map((action) => toActionObject(action, options.actions)) , fsmConfig.context, INIT_EVENT);
    const initialActions = initialProps[0];
    const initialContext = initialProps[1];
    
    const machine = {
        config: fsmConfig,
        _options: options,
        initialState: {
            value: fsmConfig.initial,
            actions: initialActions,
            context: initialContext,
            matches: createMatcher(fsmConfig.initial)
        },
        transition: (state, event) => {
             var _a, _b;
        //  const { value, context } = typeof state === 'string'
        //        ? { value: state, context: fsmConfig.context }
        //  : state;
            var _obj = typeof state === 'string' 
                ? { value: state, context: fsmConfig.context }
                : state;
                value = _obj.value;
                context = _obj.context;
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
                 
                    // const { target, actions = [], cond = () => true } = typeof transition === 'string'         
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
                        
                         //const [nonAssignActions, nextContext, assigned] = handleActions(allActions, context, eventObject);
                        var _handleActions = handleActions(allActions, context, eventObject).slice(0,3);
                        nonAssignActions = _handleActions[0],
                        nextContext = _handleActions[1],
                        assigned = _handleActions[2];   

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
// const executeStateActions = (state, event) => state.actions.forEach(({ exec }) => exec && exec(state.context, event));
   const executeStateActions = (state, event) => {
       state.actions.forEach(( exec ) => {
           exec && Object.assign({},exec).exec(state.context, event);   
    });
    };
// export function interpret(machine) {
exports.interpret = function interpret(machine) {
    let state = machine.initialState;
    let status = InterpreterStatus.NotStarted;
    // const listeners = new Set();
    listeners = {};
    const service = {
        _machine: machine,
        send: (event) => {
            if (status !== InterpreterStatus.Running) {
                return;
            }
            state = machine.transition(state, event);
            executeStateActions(state, toEventObject(event));
        //  listeners.forEach((listener) => listener(state));
            const keys = Object.keys(listeners);
            for (const key of keys)  {
                listeners[key](state);
            };
        },
        subscribe: (listener) => {
        // listeners.add(listener);
            listeners[listener] = listener
            listener(state);
            return {
               // unsubscribe: () => listeners.delete(listener)
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
            status = InterpreterStatus.Running;
            executeStateActions(state, INIT_EVENT);
            return service;
        },
        stop: () => {
            status = InterpreterStatus.Stopped;
            // listeners.clear();
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
