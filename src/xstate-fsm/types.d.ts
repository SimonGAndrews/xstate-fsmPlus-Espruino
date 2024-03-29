declare type AnyFunction = (...args: any[]) => any;
declare type ReturnTypeOrValue<T> = T extends AnyFunction ? ReturnType<T> : T;
export declare enum InterpreterStatus {
    NotStarted = 0,
    Running = 1,
    Stopped = 2
}
export declare type SingleOrArray<T> = T[] | T;
export interface EventObject {
    type: string;
}
export declare type InitEvent = {
    type: 'xstate.init';
};
export declare type ContextFrom<T> = ReturnTypeOrValue<T> extends infer R ? R extends StateMachine.Machine<infer TContext, any, any> ? TContext : R extends StateMachine.Service<infer TContext, any, any> ? TContext : never : never;
export declare type EventFrom<T> = ReturnTypeOrValue<T> extends infer R ? R extends StateMachine.Machine<any, infer TEvent, any> ? TEvent : R extends StateMachine.Service<any, infer TEvent, any> ? TEvent : never : never;
export declare type StateFrom<T> = ReturnTypeOrValue<T> extends infer R ? R extends StateMachine.Machine<infer TContext, infer TEvent, infer TState> ? StateMachine.State<TContext, TEvent, TState> : R extends StateMachine.Service<infer TContext, infer TEvent, infer TState> ? StateMachine.State<TContext, TEvent, TState> : never : never;
export declare type ServiceFrom<T> = ReturnTypeOrValue<T> extends infer R ? R extends StateMachine.Machine<infer TContext, infer TEvent, infer TState> ? StateMachine.Service<TContext, TEvent, TState> : never : never;
export declare type MachineImplementationsFrom<TMachine extends StateMachine.AnyMachine> = {
    actions?: StateMachine.ActionMap<ContextFrom<TMachine>, EventFrom<TMachine>>;
};
export declare namespace StateMachine {
    type Action<TContext extends object, TEvent extends EventObject> = string | AssignActionObject<TContext, TEvent> | ActionObject<TContext, TEvent> | ActionFunction<TContext, TEvent>;
    type ActionMap<TContext extends object, TEvent extends EventObject> = Record<string, Exclude<Action<TContext, TEvent>, string>>;
    interface ActionObject<TContext extends object, TEvent extends EventObject> {
        type: string;
        exec?: ActionFunction<TContext, TEvent>;
        [key: string]: any;
    }
    type ActionFunction<TContext extends object, TEvent extends EventObject> = (context: TContext, event: TEvent | InitEvent) => void;
    type AssignAction = 'xstate.assign';
    interface AssignActionObject<TContext extends object, TEvent extends EventObject> extends ActionObject<TContext, TEvent> {
        type: AssignAction;
        assignment: Assigner<TContext, TEvent> | PropertyAssigner<TContext, TEvent>;
    }
    type Transition<TContext extends object, TEvent extends EventObject> = string | {
        target?: string;
        actions?: SingleOrArray<Action<TContext, TEvent>>;
        cond?: (context: TContext, event: TEvent) => boolean;
    };
    interface State<TContext extends object, TEvent extends EventObject, TState extends Typestate<TContext>> {
        value: TState['value'];
        context: TContext;
        actions: Array<ActionObject<TContext, TEvent>>;
        changed?: boolean | undefined;
        matches: <TSV extends TState['value']>(value: TSV) => this is TState extends {
            value: TSV;
        } ? TState & {
            value: TSV;
        } : never;
    }
    type AnyMachine = StateMachine.Machine<any, any, any>;
    type AnyService = StateMachine.Service<any, any, any>;
    type AnyState = State<any, any, any>;
    interface Config<TContext extends object, TEvent extends EventObject, TState extends Typestate<TContext> = {
        value: any;
        context: TContext;
    }> {
        id?: string;
        initial: string;
        context?: TContext;
        states: {
            [key in TState['value']]: {
                on?: {
                    [K in TEvent['type']]?: SingleOrArray<Transition<TContext, TEvent extends {
                        type: K;
                    } ? TEvent : never>>;
                };
                exit?: SingleOrArray<Action<TContext, TEvent>>;
                entry?: SingleOrArray<Action<TContext, TEvent>>;
            };
        };
    }
    interface Machine<TContext extends object, TEvent extends EventObject, TState extends Typestate<TContext>> {
        config: StateMachine.Config<TContext, TEvent, TState>;
        initialState: State<TContext, TEvent, TState>;
        transition: (state: string | State<TContext, TEvent, TState>, event: TEvent['type'] | TEvent) => State<TContext, TEvent, TState>;
    }
    type StateListener<T extends AnyState> = (state: T) => void;
    interface Service<TContext extends object, TEvent extends EventObject, TState extends Typestate<TContext> = {
        value: any;
        context: TContext;
    }> {
        send: (event: TEvent | TEvent['type']) => void;
        subscribe: (listener: StateListener<State<TContext, TEvent, TState>>) => {
            unsubscribe: () => void;
        };
        start: (initialState?: TState['value'] | {
            context: TContext;
            value: TState['value'];
        }) => Service<TContext, TEvent, TState>;
        stop: () => Service<TContext, TEvent, TState>;
        readonly status: InterpreterStatus;
        readonly state: State<TContext, TEvent, TState>;
    }
    type Assigner<TContext extends object, TEvent extends EventObject> = (context: TContext, event: TEvent) => Partial<TContext>;
    type PropertyAssigner<TContext extends object, TEvent extends EventObject> = {
        [K in keyof TContext]?: ((context: TContext, event: TEvent) => TContext[K]) | TContext[K];
    };
}
export interface Typestate<TContext extends object> {
    value: string;
    context: TContext;
}
export declare type ExtractEvent<TEvent extends EventObject, TEventType extends TEvent['type']> = TEvent extends {
    type: TEventType;
} ? TEvent : never;
export {};
//# sourceMappingURL=types.d.ts.map