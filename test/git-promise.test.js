const assert = require("assert");
const git = require("../index.js");

module.exports = (test) => {
	test("ignore callback - error", async () => {
		await assert.rejects(
			() => git("please fail"),
			/git please fail.*exited with error code \d+/i,
		);
	});

	test("ignore callback - works", async () => {
		const output = await git("init");
		assert.ok(/Reinitialized existing Git repository/i.test(output), output);
	});

	test("ignore callback - git prefix", async () => {
		const output = await git("git init");
		assert.ok(/Reinitialized existing Git repository/i.test(output), output);
	});

	test("callback with only one parameter - error", async () => {
		const callback = (output) =>
			assert.fail(`Callback shouldn't be called, got: ${output}`);
		await assert.rejects(
			() => git("please fail again", callback),
			/git please fail.*exited with error code \d+/i,
		);
	});

	test("callback with only one parameter - works", async () => {
		const resolveTo = {
			resolve: "this"
		};
		let called = false;

		const result = await git("status", (output) => {
			called = true;
			if (process.env.TRAVIS === "true") {
				assert.ok(/HEAD detached/i.test(output));
			} else {
				assert.ok(/On branch \w+/i.test(output));
			}

			// This is what we resolve, allows to parse the output
			return resolveTo;
		});
		assert.deepEqual(result, resolveTo);
		assert.ok(called, "Callback was not called");
	});

	test("callback with two parameters - error", async () => {
		const resolveTo = {
			resolve: "two parameters"
		};
		let called = false;

		const result = await git("please fail one more time", (output, code) => {
			called = true;
			// Because we show interest in the error code, this will be resolved
			assert.ok(/.please.\sis not a git command/i.test(output), output);
			assert.equal(code, 1, "Failing code");

			return resolveTo;
		});
		assert.deepEqual(result, resolveTo);
		assert.ok(called, "Callback was not called");
	});

	test("callback with two parameters - works", async () => {
		const callback = (output, code) => {
			if (process.env.TRAVIS === "true") {
				assert.ok(/HEAD detached/i.test(output));
			} else {
				assert.ok(/On branch \w+/i.test(output));
			}
			assert.equal(code, 0, "Working code");

			// Throw an exception here to make it fail
			throw new Error("at least the command was fine");
		};
		await assert.rejects(
			() => git("status", callback),
			/at least the command was fine/i,
		);
	});

	test("options - cwd with valid command", async () => {
		const thisFolder = process.cwd();
		const options = {
			cwd: "test/blame"
		};

		let called = false;
		const callback = (output, code) => {
			assert.ok(/blame me/i.test(output));
			assert.equal(code, 0, "Working code");
			called = true;
		};

		await git("blame me", options, callback);
		assert.equal(process.cwd(), thisFolder, "Should go back to the previous path");
		assert.ok(called, "Callback was not called");
	});

	test("options - cwd with invalid command", async () => {
		const thisFolder = process.cwd();
		const options = {
			cwd: "test/blame"
		};

		await assert.rejects(
			() => git("banana", options),
			/git banana.*exited with error code \d+/i,
		);
		assert.equal(process.cwd(), thisFolder, "Should go back to the previous path on failure");
	});

	test("options - gitExec", async () => {
		const options = {
			gitExec: "echo",
		};
		const output = await git("banana", options);
		assert.equal(output.trim(), "banana");
	});
};
