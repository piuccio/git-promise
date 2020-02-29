# git-promise

Simple wrapper that allows you to run any `git` command using a more intuitive syntax.

## Getting Started

```shell
npm install git-promise --save
```

Once installed, you can use it in your JavaScript files like so:

```js
const git = require("git-promise");

const branch = await git("rev-parse --abbrev-ref HEAD");
console.log(branch); // This is your current branch
```

The module will handle git exit code automatically, so

```js
const git = require("git-promise");

try {
  await git("merge origin/master");
  // Everything was fine
} catch (err) {
  // Something went bad, maybe merge conflict?
  console.error(err);
}
```

`err` is an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object augmented with `code` property. The following code:

```js
try {
  await git('clone http://example.org/notExistingExample.git');
} catch (err) {
  console.log("MESSAGE");
  console.log(err.message);
  console.log("ERROR CODE");
  console.log(err.code);
}
```

will log:

```
MESSAGE
Cloning into 'notExistingExample'...
fatal: remote error: Repository does not exist
The requested repository does not exist, or you do not have permission to
access it.
}
ERROR CODE
128
```

## Advanced usage

The `git` command accepts a second parameter that can be used to parse the output or to deal with non 0 exit code.

```js
const git = require("git-promise");

const branch = await git("status -sb",
  (stdout) => stdout.match(/## (.*)/)[1]);
console.log(branch); // This is your current branch
```

The callback accepts 2 parameters, `(stdout, error)`, where `stdout` is the output of the git command and `error` is either `null` or an `Error` in case the git command fails.

The return value of this function will be the resolved value of the promise.

If the `error` parameter is not specified, it'll be handled automatically and the promise will be rejected in case of non 0 error codes.

```js
const git = require("git-promise");

git("merge-base --is-ancestor master HEAD", function (stdout, error) {
  if (!error) {
    // the branch we are on is fast forward to master
    return true;
  } else if (error.code === 1) {
    // no, it's not
    return false;
  } else {
    // some other error happened
    throw error;
  }
}).then(function (isFastForward) {
  console.log(isFastForward);
}).catch(function (err) {
  // deal with the error
});
```

### Argument parsing

Version 1.0 changes the way the input command is parsed, so instead of executing anything that gets passed as the first parameter, it makes sure that `git` is the only executable used.

`git("status | grep hello")` won't be executed as a shell command, but everything will be passed as arguments to `git`, likely resulting in an error in this specific case.

If your `git` command stops working after upgrading to version 1.0
1. Make sure you're only executing git commands.
1. Try passing an array of arguments instead of a string. For instance: `git(["merge-base", "--is-ancestor", "master", "HEAD"]);`.

### Chaining commands

Imagine to be on a local branch which is not fast forward with master and you want to know which commit were pushed on master after the forking point:

```js
const git = require("git-promise");

function findForkCommit () {
  return git("merge-base master HEAD", output => output.trim());
}

function findChanges (forkCommit) {
  return git("log " + forkCommit + "..master --format=oneline",
    output => output.trim().split("\n"));
}

const forkCommit = await findForkCommit();
const commits = await findChanges(forkCommit);
```

### Working directory

By default all git commands run in the current working directory (i.e. `process.cwd()`).

You can use the following syntax to run a git command in different folder

```js
const git = require("git-promise");

await git("blame file1.js", {cwd: "src/"});
```

### Custom git executable

By default any command tries to use `git` in `$PATH`, if you have installed `git` in a funky location you can override this value using `gitExec`.

```js
const git = require("git-promise");

await git("status", {gitExec: "/usr/local/sbin/git"});
```

## Utility methods

This module comes with some utility methods to parse the output of some git commands

```js
const util = require("git-promise/util");
```

* `util.extractStatus(output [, lineSeparator])`

Parse the output of `git status --porcelain` and returns an object with

```
{
  branch: "current branch name, only if git status -b is used",
  index: {
    modified: ["list of files modified in the index"],
    added: ["list of files added in the index"],
    deleted: ["list of files deleted in the index"],
    renamed: ["list of files renamed in the index"],
    copied: ["list of files copied in the index"]
  },
  workingTree: {
    modified: ["list of files modified in the local working tree"],
    added: ["list of files added / renamed / copied in the local working tree"],
    deleted: ["list of files deleted in the local working tree"]
  }
}
```

The method works both with or without option `-z`.

* `util.hasConflict(output)`

Try to determine if there's a merge conflict from the output of `git merge-tree`

```js
const git = require("git-promise");
const util = require("git-promise/util");

git("merge-tree <root-commit> <branch1> <branch2>").then(function (stdout) {
  console.log(util.hasConflict(stdout));
});
```

## Release History

* 1.0.0
  BREAKING CHANGE: The returned value is now a standard JavaScript `Promise`, not anymore a `Q` promise.
  BREAKING CHANGE: Internally the library switches from `shell` to `execFile` to avoid problems with non sanitized input commands.
  BREAKING CHANGE: Callbacks using 2 parameters now receive an error as second parameter instead of an error code.
* 0.3.1 Fix current working directory not switching back when command exits with error
* 0.3.0 Custom git executable with `gitExec` option
* 0.2.0 Change current working directory
* 0.1.0 Just started
