# Unit Tests for FSMPLUS enhancements
This folfer contains a number of unit tests for supporting functions added to xstate-fsm.js
during development of the fsmplus enhancements.

tests, named in the form xxx.test.js are written using the jest framework and can be run using 
``` javascript
> jest xxx.test.js
```
in a terminal window open to this directory.

The functions are cut and paste from the src files into these tests,
so take care to test the current versions in src and manually maintain config control of the tests.