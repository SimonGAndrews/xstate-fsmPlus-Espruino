'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var types = require('./types.js');

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
function createMachine(fsmConfig, implementations = {}) {
    if (!IS_PRODUCTION) {
        Object.keys(fsmConfig.states).forEach((state) => {
            if (fsmConfig.states[state].states) {
                throw new Error(`Nested finite states not supported.
            Please check the configuration for the "${state}" state.`);
            }
        });
    }
    const [initialActions, initialContext] = handleActions(toArray(fsmConfig.states[fsmConfig.initial].entry).map((action) => toActionObject(action, implementations.actions)), fsmConfig.context, INIT_EVENT);
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
            const { value, context } = typeof state === 'string'
                ? { value: state, context: fsmConfig.context }
                : state;
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
                    const { target, actions = [], cond = () => true } = typeof transition === 'string'
                        ? { target: transition }
                        : transition;
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
                                .concat(stateConfig.exit, actions, nextStateConfig.entry)
                                .filter((a) => a)).map((action) => toActionObject(action, machine._options.actions));
                        const [nonAssignActions, nextContext, assigned] = handleActions(allActions, context, eventObject);
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
const executeStateActions = (state, event) => state.actions.forEach(({ exec }) => exec && exec(state.context, event));
function interpret(machine) {
    let state = machine.initialState;
    let status = types.InterpreterStatus.NotStarted;
    const listeners = new Set();
    const service = {
        _machine: machine,
        send: (event) => {
            if (status !== types.InterpreterStatus.Running) {
                return;
            }
            state = machine.transition(state, event);
            executeStateActions(state, toEventObject(event));
            listeners.forEach((listener) => listener(state));
        },
        subscribe: (listener) => {
            listeners.add(listener);
            listener(state);
            return {
                unsubscribe: () => listeners.delete(listener)
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
            status = types.InterpreterStatus.Running;
            executeStateActions(state, INIT_EVENT);
            return service;
        },
        stop: () => {
            status = types.InterpreterStatus.Stopped;
            listeners.clear();
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
  get: function () { return types.InterpreterStatus; }
});
exports.assign = assign;
exports.createMachine = createMachine;
exports.interpret = interpret;
