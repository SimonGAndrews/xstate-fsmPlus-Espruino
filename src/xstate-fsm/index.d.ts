import { ContextFrom, EventFrom, EventObject, InterpreterStatus, MachineImplementationsFrom, ServiceFrom, StateFrom, StateMachine, Typestate } from './types';
export { StateMachine, EventObject, InterpreterStatus, Typestate, MachineImplementationsFrom, StateFrom, EventFrom, ContextFrom, ServiceFrom };
export declare function assign<TC extends object, TE extends EventObject = EventObject>(assignment: StateMachine.Assigner<TC, TE> | StateMachine.PropertyAssigner<TC, TE>): StateMachine.AssignActionObject<TC, TE>;
export declare function createMachine<TContext extends object, TEvent extends EventObject = EventObject, TState extends Typestate<TContext> = {
    value: any;
    context: TContext;
}>(fsmConfig: StateMachine.Config<TContext, TEvent, TState>, implementations?: {
    actions?: StateMachine.ActionMap<TContext, TEvent>;
}): StateMachine.Machine<TContext, TEvent, TState>;
export declare function interpret<TContext extends object, TEvent extends EventObject = EventObject, TState extends Typestate<TContext> = {
    value: any;
    context: TContext;
}>(machine: StateMachine.Machine<TContext, TEvent, TState>): StateMachine.Service<TContext, TEvent, TState>;
//# sourceMappingURL=index.d.ts.map