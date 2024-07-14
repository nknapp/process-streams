# process-streams

[![NPM version](https://img.shields.io/npm/v/process-streams.svg)](https://npmjs.com/package/process-streams)
[![ci-badge](https://github.com/nknapp/process-streams/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/nknapp/process-streams/actions)
> Wrapper for piping data into and out of child processes

Motivation
----------

The goal of this small package is to provide a interface for streaming data to
and from child-processes. It may be possible to stream data to a process via stdout
and read the result from stdin, but it may also be necessary to store the data in a
temporary file and provide the filename to the process as argument.

A concrete example is ffmpeg: It is possible to encode webm-videos to a stream,
but h264 must always be stored in a temporary file first. On the other hand in some cases
[it is not possible to stream data into ffmpeg](http://superuser.com/questions/822500/pipe-issue-with-ffmpeg),
so data must be stored in a temporary file prior to calling ffmpeg.



Overview
--------

ProcessStreams provides the methods `exec`, `execFile` and `spawn` from the `child_process` with the same arguments.
The return value however is always a through-stream. The command line arguments are examined for occurences of
the strings `<INPUT>` and `<OUTPUT>`.

 * If `<INPUT>` is present, the stream input is piped into a temporary file and `<INPUT>` is replaced by its filename.
 * If `<OUTPUT>` is present, it is replaced by the name of a temporary file and the contents of this file is
 used as stream output for the resulting stream.
 * If `<INPUT>` or `<OUTPUT>` are not present, the stream input is directly piped to the child processes stdin
 (or the child processes stdout is piped to the stream output).

Temporary files are always deleted when no longer needed.

# Installation

```
npm install process-streams
```

Simple Examples
--------

The following examples actually only pipes data to stdout, but via child processes with different temp-file options.

```js
const stringToStream = require('string-to-stream')

const ProcessStream = require('process-streams')
const ps = new ProcessStream()

// This basically pipes the stream as-is to stdout
// through multiple variations of process-streams

// Temporary files for input and output
stringToStream('hello\n')
  .pipe(ps.exec('cp <INPUT> <OUTPUT>'))
  .pipe(ps.spawn('cp', ['<INPUT>', '<OUTPUT>']))
  .pipe(ps.execFile('cp', ['<INPUT>', '<OUTPUT>']))

  // Stream input, use temp-file for output
  .pipe(ps.spawn('tee', ['<OUTPUT>']))

  // Temp-file for input, Stream for output
  .pipe(ps.spawn('cat', ['<INPUT>']))

  // Pipe both sides
  .pipe(ps.spawn('cat'))

  // Result to stdout
  .pipe(process.stdout)
```

Output:

```
hello
```



Functions
---------

#### `ps.spawn(command, [args], [options])`

For details about function arguments please refer to the api documentation of
[child_process.spawn(command, [args], [options])](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)


#### `ps.exec(command, [options], callback)`

For details about function arguments please refer to the api documentation of
[child_process.exec(command, [options], callback)](http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)


#### `ps.execFile(file, [args], [options], [callback])`

For details about function arguments please refer to the api documentation of
[child_process.execFile(file, [args], [options], [callback])](http://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback)

#### `ps.factory(useTmpIn, useTmpOut, callback)`

This function uses the provided callback to connect input and output of the resulting stream. `useTmpIn` and `useTmpOut` are booleans that define which
parts of the stream temp should use temp files.
`callback` has the signature `function(input, output, callback)`. "input" and "output" are either streams of paths of temporary files. The callback must
be called when data is available for output. If "tmpUseOut" is `false`, this can be called immediately. It "tmpUseOut" is `true` it must be called, when the
output tempfile has completely been written to.


Changing the placeholder tokens
-------------------------------
The tokens `<INPUT>` and `<OUTPUT>` can be changed:

```js
const stringToStream = require('string-to-stream')

const ProcessStream = require('process-streams')
const ps = new ProcessStream('[IN]', '[OUT]')
stringToStream('hello\n')
  .pipe(ps.exec('cp [IN] [OUT]'))
  .pipe(process.stdout)
```

Events
------
Process errors (such as not finding the executable file) are emitted on the resulting stream as `'error'` event.
The `'started'` event is emitted when the is started. Its first argument is the child-process object, second and
third arguments are the `command` and `args` passed to `ps.exec`, `ps.spawn` or `ps.execFile`), but with the
placeholders resolved to the their actual temporary files.

```js
const stringToStream = require('string-to-stream')

const ProcessStream = require('process-streams')
const ps = new ProcessStream()

stringToStream('hello\n')
  .pipe(ps.spawn('cat'))
  .on('error', function (err) {
    // Handle errors
    console.log('error', err)
  })
  .on('input-closed', function (err) {
    // Handle ECONNRESET and EPIPE processe's stdin
    console.log('input-closed', err)
  })
  .on('started', function (process, command, args) {
    // If "ps.exec" is called, 'command' contains the whole
    // resolved command and 'args' is undefined.
  })
  .on('exit', function (code, signal) {
    // see the 'child_process' documentation for the 'exit'-event.
  })
  .pipe(process.stdout)
```



# License

`process-streams` is published under the MIT-license.

See [LICENSE](LICENSE) for details.


# Release-Notes
 
For release notes, see [CHANGELOG.md](CHANGELOG.md)
 
# Contributing guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Funding :coffee:

You can send me money, if you like my work:

- [Liberapay](https://de.liberapay.com/nils.knappmeier/)
- [Paypal](https://www.paypal.com/donate/?hosted_button_id=GB656ZSAEQEXN)
- [Github Sponsors](https://github.com/sponsors/nknapp/)