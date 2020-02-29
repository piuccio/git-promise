const assert = require("assert");
const git = require("../index.js");

module.exports = (test) => {
	test("ignore callback - error", async () => {
		await assert.rejects(
			() => git("please fail"),
			/please.*is not a git command/i,
		);
	});

	test("ignore callback - works", async () => {
		const output = await git("init");
		assert.ok(/Reinitialized existing Git repository/i.test(output), output);
	});

	test("ignore callback - array input", async () => {
		const output = await git(["init"]);
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
			/please.*is not a git command/i,
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

		const result = await git("please fail one more time", (output, error) => {
			called = true;
			assert.ok(error instanceof Error, "Expecting an error");
			// Because we show interest in the error, this will be resolved
			assert.equal(error.code, 1, "Failing code");
			assert.ok(/please.*is not a git command/i.test(error.message), error.message);

			return resolveTo;
		});
		assert.deepEqual(result, resolveTo);
		assert.ok(called, "Callback was not called");
	});

	test("callback with two parameters - works", async () => {
		const callback = (output, error) => {
			if (process.env.TRAVIS === "true") {
				assert.ok(/HEAD detached/i.test(output));
			} else {
				assert.ok(/On branch \w+/i.test(output));
			}
			assert.equal(error, null, "Working code");

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
		const callback = (output, error) => {
			assert.ok(/blame me/i.test(output));
			assert.equal(error, null, "Working code");
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
			/banana.*is not a git command+/i,
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
