"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../src/xstate-fsm"); // SGA Modified
describe('@xstate/fsm', function () {
    var lightConfig = {
        id: 'light',
        initial: 'green',
        context: { count: 0, foo: 'bar', go: true },
        states: {
            green: {
                entry: 'enterGreen',
                exit: [
                    'exitGreen',
                    src_1.assign({ count: function (ctx) { return ctx.count + 1; } }),
                    src_1.assign({ count: function (ctx) { return ctx.count + 1; } }),
                    src_1.assign({ foo: 'static' }),
                    src_1.assign({ foo: function (ctx) { return ctx.foo + '++'; } })
                ],
                on: {
                    TIMER: {
                        target: 'yellow',
                        actions: ['g-y 1', 'g-y 2']
                    }
                }
            },
            yellow: {
                entry: src_1.assign({ go: false }),
                on: {
                    INC: { actions: src_1.assign({ count: function (ctx) { return ctx.count + 1; } }) },
                    EMERGENCY: {
                        target: 'red',
                        cond: function (ctx, e) { return ctx.count + e.value === 2; }
                    }
                }
            },
            red: {}
        }
    };
    var lightFSM = src_1.createMachine(lightConfig);
    it('should return back the config object', function () {
        expect(lightFSM.config).toBe(lightConfig);
    });
    it('should have the correct initial state', function () {
        var initialState = lightFSM.initialState;
        expect(initialState.value).toEqual('green');
        expect(initialState.actions).toEqual([{ type: 'enterGreen' }]);
    });
    it('should have initial context updated by initial assign actions', function () {
        var initialState = src_1.createMachine({
            initial: 'init',
            context: {
                count: 0
            },
            states: {
                init: {
                    entry: src_1.assign({
                        count: function () { return 1; }
                    })
                }
            }
        }).initialState;
        expect(initialState.context).toEqual({ count: 1 });
    });
    it('should have initial actions computed without assign actions', function () {
        var initialState = src_1.createMachine({
            initial: 'init',
            context: {
                count: 0
            },
            states: {
                init: {
                    entry: [
                        { type: 'foo' },
                        src_1.assign({
                            count: function () { return 1; }
                        })
                    ]
                }
            }
        }).initialState;
        expect(initialState.actions).toEqual([{ type: 'foo' }]);
    });
    it('should transition correctly', function () {
        var nextState = lightFSM.transition('green', 'TIMER');
        expect(nextState.value).toEqual('yellow');
        expect(nextState.actions.map(function (action) { return action.type; })).toEqual([
            'exitGreen',
            'g-y 1',
            'g-y 2'
        ]);
        expect(nextState.context).toEqual({
            count: 2,
            foo: 'static++',
            go: false
        });
    });
    it('should stay on the same state for undefined transitions', function () {
        var nextState = lightFSM.transition('green', 'FAKE');
        expect(nextState.value).toBe('green');
        expect(nextState.actions).toEqual([]);
    });
    it('should throw an error for undefined states', function () {
        expect(function () {
            lightFSM.transition('unknown', 'TIMER');
        }).toThrow();
    });
    it('should throw an error for undefined next state config', function () {
        var _a;
        var invalidState = 'blue';
        var testConfig = {
            id: 'test',
            initial: 'green',
            states: {
                green: {
                    on: {
                        TARGET_INVALID: invalidState
                    }
                },
                yellow: {}
            }
        };
        var testMachine = src_1.createMachine(testConfig);
        expect(function () {
            testMachine.transition('green', 'TARGET_INVALID');
        }).toThrow("State '" + invalidState + "' not found on machine " + ((_a = testConfig.id) !== null && _a !== void 0 ? _a : ''));
    });
    it('should work with guards', function () {
        var yellowState = lightFSM.transition('yellow', 'EMERGENCY');
        expect(yellowState.value).toEqual('yellow');
        var redState = lightFSM.transition('yellow', {
            type: 'EMERGENCY',
            value: 2
        });
        expect(redState.value).toEqual('red');
        expect(redState.context.count).toBe(0);
        var yellowOneState = lightFSM.transition('yellow', 'INC');
        var redOneState = lightFSM.transition(yellowOneState, {
            type: 'EMERGENCY',
            value: 1
        });
        expect(redOneState.value).toBe('red');
        expect(redOneState.context.count).toBe(1);
    });
    it('should be changed if state changes', function () {
        expect(lightFSM.transition('green', 'TIMER').changed).toBe(true);
    });
    it('should be changed if any actions occur', function () {
        expect(lightFSM.transition('yellow', 'INC').changed).toBe(true);
    });
    it('should not be changed on unknown transitions', function () {
        expect(lightFSM.transition('yellow', 'UNKNOWN').changed).toBe(false);
    });
    it('should match initialState', function () {
        var initialState = lightFSM.initialState;
        expect(initialState.matches('green')).toBeTruthy();
        if (initialState.matches('green')) {
            expect(initialState.context.go).toBeTruthy();
        }
    });
    it('should match transition states', function () {
        var initialState = lightFSM.initialState;
        var nextState = lightFSM.transition(initialState, 'TIMER');
        expect(nextState.matches('yellow')).toBeTruthy();
        if (nextState.matches('yellow')) {
            expect(nextState.context.go).toBeFalsy();
        }
    });
});
describe('interpreter', function () {
    var toggleMachine = src_1.createMachine({
        initial: 'active',
        states: {
            active: {
                on: { TOGGLE: 'inactive' }
            },
            inactive: {}
        }
    });
    it('listeners should immediately get the initial state', function (done) {
        var toggleService = src_1.interpret(toggleMachine).start();
        toggleService.subscribe(function (state) {
            if (state.matches('active')) {
                done();
            }
        });
    });
    it('listeners should subscribe to state changes', function (done) {
        var toggleService = src_1.interpret(toggleMachine).start();
        toggleService.subscribe(function (state) {
            if (state.matches('inactive')) {
                done();
            }
        });
        toggleService.send('TOGGLE');
    });
    it('should execute actions', function (done) {
        var executed = false;
        var actionMachine = src_1.createMachine({
            initial: 'active',
            states: {
                active: {
                    on: {
                        TOGGLE: {
                            target: 'inactive',
                            actions: function () {
                                executed = true;
                            }
                        }
                    }
                },
                inactive: {}
            }
        });
        var actionService = src_1.interpret(actionMachine).start();
        actionService.subscribe(function () {
            if (executed) {
                done();
            }
        });
        actionService.send('TOGGLE');
    });
    it('should execute initial entry action', function () {
        var executed = false;
        var machine = src_1.createMachine({
            initial: 'foo',
            states: {
                foo: {
                    entry: function () {
                        executed = true;
                    }
                }
            }
        });
        src_1.interpret(machine).start();
        expect(executed).toBe(true);
    });
    it('should lookup string actions in options', function () {
        var executed = false;
        var machine = src_1.createMachine({
            initial: 'foo',
            states: {
                foo: {
                    entry: 'testAction'
                }
            }
        }, {
            actions: {
                testAction: function () {
                    executed = true;
                }
            }
        });
        src_1.interpret(machine).start();
        expect(executed).toBe(true);
    });
    it('should reveal the current state', function () {
        var machine = src_1.createMachine({
            initial: 'test',
            context: { foo: 'bar' },
            states: {
                test: {}
            }
        });
        var service = src_1.interpret(machine);
        service.start();
        expect(service.state.value).toEqual('test');
        expect(service.state.context).toEqual({ foo: 'bar' });
    });
    it('should reveal the current state after transition', function (done) {
        var machine = src_1.createMachine({
            initial: 'test',
            context: { foo: 'bar' },
            states: {
                test: {
                    on: { CHANGE: 'success' }
                },
                success: {}
            }
        });
        var service = src_1.interpret(machine);
        service.start();
        service.subscribe(function () {
            if (service.state.value === 'success') {
                done();
            }
        });
        service.send('CHANGE');
    });
    it('should not re-execute exit/entry actions for transitions with undefined targets', function () {
        var machine = src_1.createMachine({
            initial: 'test',
            states: {
                test: {
                    entry: ['entry'],
                    exit: ['exit'],
                    on: {
                        EVENT: {
                            // undefined target
                            actions: ['action']
                        }
                    }
                }
            }
        });
        var initialState = machine.initialState;
        expect(initialState.actions.map(function (a) { return a.type; })).toEqual(['entry']);
        var nextState = machine.transition(initialState, 'EVENT');
        expect(nextState.actions.map(function (a) { return a.type; })).toEqual(['action']);
    });
    describe('`start` method', function () {
        it('should start the service with initial state by default', function () {
            var machine = src_1.createMachine({
                initial: 'foo',
                states: {
                    foo: {
                        on: {
                            NEXT: 'bar'
                        }
                    },
                    bar: {}
                }
            });
            var service = src_1.interpret(machine).start();
            expect(service.state.value).toBe('foo');
        });
        it('should rehydrate the state if the state if provided', function () {
            var machine = src_1.createMachine({
                initial: 'foo',
                states: {
                    foo: {
                        on: {
                            NEXT: 'bar'
                        }
                    },
                    bar: {
                        on: {
                            NEXT: 'baz'
                        }
                    },
                    baz: {}
                }
            });
            var service = src_1.interpret(machine).start('bar');
            expect(service.state.value).toBe('bar');
            service.send('NEXT');
            expect(service.state.matches('baz')).toBe(true);
        });
        it('should rehydrate the state and the context if both are provided', function () {
            var machine = src_1.createMachine({
                initial: 'foo',
                states: {
                    foo: {
                        on: {
                            NEXT: 'bar'
                        }
                    },
                    bar: {
                        on: {
                            NEXT: 'baz'
                        }
                    },
                    baz: {}
                }
            });
            var context = { hello: 'world' };
            var service = src_1.interpret(machine).start({ value: 'bar', context: context });
            expect(service.state.value).toBe('bar');
            expect(service.state.context).toBe(context);
            service.send('NEXT');
            expect(service.state.matches('baz')).toBe(true);
        });
        it('should execute initial actions when re-starting a service', function () {
            var entryActionCalled = false;
            var machine = src_1.createMachine({
                initial: 'test',
                states: {
                    test: {
                        entry: function () { return (entryActionCalled = true); }
                    }
                }
            });
            var service = src_1.interpret(machine).start();
            service.stop();
            entryActionCalled = false;
            service.start();
            expect(entryActionCalled).toBe(true);
        });
        it('should execute initial actions when re-starting a service that transitioned to a different state', function () {
            var entryActionCalled = false;
            var machine = src_1.createMachine({
                initial: 'a',
                states: {
                    a: {
                        entry: function () { return (entryActionCalled = true); },
                        on: {
                            NEXT: 'b'
                        }
                    },
                    b: {}
                }
            });
            var service = src_1.interpret(machine).start();
            service.send({ type: 'NEXT' });
            service.stop();
            entryActionCalled = false;
            service.start();
            expect(entryActionCalled).toBe(true);
        });
        it('should not execute actions of the last known non-initial state when re-starting a service', function () {
            var entryActionCalled = false;
            var machine = src_1.createMachine({
                initial: 'a',
                states: {
                    a: {
                        on: {
                            NEXT: 'b'
                        }
                    },
                    b: {
                        entry: function () { return (entryActionCalled = true); }
                    }
                }
            });
            var service = src_1.interpret(machine).start();
            service.send({ type: 'NEXT' });
            service.stop();
            entryActionCalled = false;
            service.start();
            expect(entryActionCalled).toBe(false);
        });
    });
});
