Changes
--------
#### 1.0.1

  * Testcase-fixes for iojs 1.2 and node 0.12
  * Changed some dependencies to stable versions of other packages

#### 1.0.0

  * There are no API changes in this version, but I have decided that the API should be stable now. Thus, version 1.0.0

#### 0.4.5

  * All testcases should now run after `npm install`. All test-data is provided in dependencies (even for testECONRESET.js).
    `package.json` is now complete, the README updated.

#### 0.4.4

  * Added license information to package.json

#### 0.4.3

  * Fixed error handling for `exec` and `execFile`
  * Callback for `exec` and `execFile` is now forwarded to `child_process`
    at the correct location, so that callbacks actually get called.

#### 0.4.2
  * When using no in-tempfile, it may happen that the command (e.g. 'head -2') close the input stream before it is
    completely read. This may result in a `EPIPE` or `ECONNRESET` but is not an actual error, since the output is
    still correct. This error does not cause an `error`-event anymore, but an `input-closed` event.

