'use strict';

var git = require("../index.js");

exports["ignore callback"] = {
	error: function(test) {
		test.expect(2);

		git("please fail").then(function (out) {
			test.ok(false, "Promise shouldn't be resolved");
		}).fail(function (err) {
			test.ok(err instanceof Error, "error must be an Error");
			test.ok(/git please fail.*exited with error code \d+/i.test(err.message), err.message);
		}).fin(function () {
			test.done();
		});
	},
	works: function (test) {
		test.expect(1);

		git("init").then(function (output) {
			test.ok(/Reinitialized existing Git repository/i.test(output), output);
		}).fail(function (err) {
			test.ok(false, "Git init shouldn't be a problem");
		}).fin(function () {
			test.done();
		});
	},
	"git prefix": function (test) {
		test.expect(1);

		git("git init").then(function (output) {
			test.ok(/Reinitialized existing Git repository/i.test(output), output);
		}).fail(function (err) {
			test.ok(false, "Git init shouldn't be a problem");
		}).fin(function () {
			test.done();
		});
	}
};

exports["callback with only one parameter"] = {
	error: function(test) {
		test.expect(2);

		var resolveTo = {
			resolve: "this"
		};

		git("please fail again", function (output) {
			test.ok(false, "Callback shouldn't be called");
		}).then(function (what) {
			test.deepEqual(what, resolveTo);
		}).fail(function (err) {
			test.ok(err instanceof Error, "error must be an Error");
			test.ok(/git please fail again.*exited with error code \d+/i.test(err.message), err.message);
		}).fin(function () {
			test.done();
		});
	},
	works: function (test) {
		test.expect(2);

		var resolveTo = {
			resolve: "this"
		};

		git("status", function (output) {
			test.ok(/On branch \w+/i.test(output));

			// This is what we resolve, allows to parse the output
			return resolveTo;
		}).then(function (what) {
			test.deepEqual(what, resolveTo);
		}).fail(function (err) {
			test.ok(false, "Git status shouldn't be a problem");
		}).fin(function () {
			test.done();
		});
	}
};

exports["callback with two parameters"] = {
	error: function(test) {
		test.expect(3);

		var resolveTo = {
			resolve: "two parameters"
		};

		git("please fail one more time", function (output, code) {
			// Because we show interest in the error code, this will be resolved
			test.ok(/.please.\sis not a git command/i.test(output), output);
			test.equal(code, 1, "Failing code");

			return resolveTo;
		}).then(function (what) {
			test.deepEqual(what, resolveTo);
		}).fail(function (err) {
			test.ok(false, "Because we control the output this should not fail");
		}).fin(function () {
			test.done();
		});
	},
	works: function (test) {
		test.expect(4);

		git("status", function (output, code) {
			test.ok(/On branch \w+/i.test(output));
			test.equal(code, 0, "Working code");

			// Throw an exception here to make it fail
			throw new Error("at least the command was fine");
		}).then(function (what) {
			test.ok(false, "Promise shouldn't be resolved");
		}).fail(function (err) {
			test.ok(err instanceof Error, "error must be an Error");
			test.ok(/at least the command was fine/i.test(err.message), err.message);
		}).fin(function () {
			test.done();
		});
	}
};

exports["options"] = {
	cwd: function(test) {
		test.expect(3);

		var thisFolder = process.cwd();

		git("blame me", {
			cwd: "test/blame"
		}, function (output, code) {
			test.ok(/blame me/i.test(output));
			test.equal(code, 0, "Working code");
		}).then(function (what) {
			test.equal(process.cwd(), thisFolder, "Should go back to the previous path");
		}).fail(function (err) {
			test.ok(false, "Because we change working directory");
		}).fin(function () {
			test.done();
		});
	}
};
