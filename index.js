var shell = require("shelljs");
var Q = require("q");

module.exports = function (command, callback) {
	var deferred = Q.defer();

	if (command.substring(0, 4) !== "git ") {
		command = "git " + command;
	}
	shell.exec(command, {silent: true}, function (code, output) {
		var args;
		if (!callback) {
			// If we completely ignore the command, resolve with the command output
			callback = function (stdout) {
				return stdout;
			};
		}

		if (callback.length === 1) {
			// Automatically handle non 0 exit codes
			if (code !== 0) {
				var error = new Error("'" + command + "' exited with error code " + code);
				error.stdout = output;
				return deferred.reject(error);
			}
			args = [output];
		} else {
			// This callback is interested in the exit code, don't handle exit code
			args = [output, code];
		}

		try {
			deferred.resolve(callback.apply(null, args));
		} catch (ex) {
			deferred.reject(ex);
		}
	});
	return deferred.promise;
};
