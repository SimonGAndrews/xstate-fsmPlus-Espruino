# The Transition Function #
Working notes for xstate/fsm by Simon G Andrews Sept 2021

A step through of the code for the transition function:  (see Transition_org.png for line numbers).

### Transition Function

 • A pure transition function that returns the next state given the current state and event. see <https://xstate.js.org/docs/packages/xstate-fsm/#api>

### Summary

* Arguments - current state and event to be checked for any transition. (96)
* Returns a new state object describing the state the machine is transitioned to, including:
  * The value (name) of the transitioned to state.
  * The updated context in the state.
  * The (non assignment ) actions array*  that are to be executed in the transitioned to state (eg by the running interpreter)
  
 Note any assignment actions for the transitioned to state are executed within the transition function and effect the returned updated context.
  
### Steps within the transition function

 Note in addition  to parameters passed to the transition function, the json object **fsmConfig**  (the serialize machine definitions) is in scope and available to the transition function.

 1. Assign from parameters the current state **value** (name of current state) and **context** taking account that the passed state can be a string (state name) or state object (98).  Create object  **stateconfig** for the current state from fsmConfig for state (102).  Throw an Error if **value** is not found in the fsmConfig. (104)

 2. Using function **toEventObject** assign **eventObject** for the current event from parameter.  **eventObject** takes account that can be a string containing the event type.  (101)

 3. If the state has 'on' events configured (106) in **stateConfig** then create array **transitions** of target states for the current  eventObject.type (107).  

 4. If no transition found return  **createUnchangedState(value, context)**; (110)

 Note: In the case of multiple transitions being specified for a given event (eg with conditions) then **transations** array will contain one element for each transition and they will be looped thru to determine the first true condition.

 So looping thu **transitions** for each transition object element:

 5. Extract the: **target**,  **actions** (Array) and **cond** (a function) from the transition object (Destructuring assignment) or assign these defaults (eg for cond assign the default function  ( ) => true ) (112).  

 6. Assign the nextStateValue from the target considering target may be object or string (116)

 7. Get the nextStateConfig from fsmConfig.states using nextStateValue (117) and throw an error if the next state is not found in the config (118).

 8. (121) - Evaluate any cond (conditional transition) by executing the function defined within the cond key of the transition object.  Passing parameters context and eventobject.

 9. if condition is true: Process any actions:

* Start to process actions  by building an array **allActions** which is concatenated from  the **actions** from this transition with any exit actions of the current state and with any entry actions of the **nextStateConfig** (122). If the event is **targetless** then only the transition **actions** are included in **allActions**

* (126) Convert the **allActions** array to ActionObjects with function **toActionObject()**.  (TBD: Why use of .filter)

* Pass **allActions ActionObjects**  to the function  **handleActions** with additional parameters containing context and event triggering the actions (127).

* **handleActions** processes  **allActions** in sequence and returns an array containing:

* nonAssignActions - an array of action objects resulting from a filter of allActions that are not of type ASSIGN_ACTION
* nextContext - determined Within the  filter on allActions, in a way  that actions of type:

	* ASSIGN_ACTION are executed so that the context passed into handleActions is effected by the assignments and the resulting context is returned in in nextContext.

	* assigned - set to true if any action in allActions is of type ASSIGN_ACTION

10. If condition is true continue by assigning **resolvedTarget** to the target of the transition being processed and then Return from the transition function: a new state object of the state the machine is transitioned to (As described in summary above)

11. If no true condition is found on a transition (including the default condition of true where no cond is specified) then the above return would not have been executed and hence the final return createUnchangedState(value, context) is executed. 

12. And so the first true condition on a transition for the specified event type is used to determine the next state.
  