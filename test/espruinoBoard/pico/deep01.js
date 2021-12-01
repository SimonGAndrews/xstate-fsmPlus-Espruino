const createMachine = require('xstate').createMachine;
const interpret = require('xstate').interpret;
const assign = require('xstate').assign;

var deepMachineConfig = {
  id: 'deep',
  initial: 'A',
  on: {
      MACHINE_EVENT: '#deep.DONE'
  },
  states: {
      DONE: {},
      FAIL: {},
      A: {
          on: {
              A_EVENT: '#deep.DONE',
              B_EVENT: 'FAIL',
              A_S: '#deep.P.Q.R.S',
              A_P: '#deep.P'
          },
          onEntry: 'ENTER_A',
          onExit: 'EXIT_A',
          initial: 'B',
          states: {
              B: {
                  on: {
                      B_EVENT: '#deep.DONE'
                  },
                  onEntry: 'ENTER_B',
                  onExit: 'EXIT_B',
                  initial: 'C',
                  states: {
                      C: {
                          on: {
                              C_EVENT: '#deep.DONE'
                          },
                          onEntry: 'ENTER_C',
                          onExit: 'EXIT_C',
                          initial: 'D',
                          states: {
                              D: {
                                  on: {
                                      D_EVENT: '#deep.DONE',
                                      D_S: '#deep.P.Q.R.S',
                                      D_P: '#deep.P'
                                  },
                                  onEntry: 'ENTER_D',
                                  onExit: 'EXIT_D'
                              }
                          }
                      }
                  }
              }
          }
      },
      P: {
          on: {
              P_EVENT: '#deep.DONE',
              Q_EVENT: 'FAIL' // shielded by Q's Q_EVENT
          },
          onEntry: 'ENTER_P',
          onExit: 'EXIT_P',
          initial: 'Q',
          states: {
              Q: {
                  on: {
                      Q_EVENT: '#deep.DONE'
                  },
                  onEntry: 'ENTER_Q',
                  onExit: 'EXIT_Q',
                  initial: 'R',
                  states: {
                      R: {
                          on: {
                              R_EVENT: '#deep.DONE'
                          },
                          onEntry: 'ENTER_R',
                          onExit: 'EXIT_R',
                          initial: 'S',
                          states: {
                              S: {
                                  on: {
                                      S_EVENT: '#deep.DONE'
                                  },
                                  onEntry: 'ENTER_S',
                                  onExit: 'EXIT_S'
                              }
                          }
                      }
                  }
              }
          }
      }
  }
};

const deepMachine = createMachine(deepMachineConfig);

console.log ('** machine created ');
console.log(deepMachine);

var nextState = deepMachine.transition(deepMachine.initialState, 'D_S');
console.log(nextState);

var nextState = deepMachine.transition(nextState, 'S_EVENT');
console.log(nextState);
