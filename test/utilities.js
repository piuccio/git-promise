'use strict';

var util = require("../util.js");

var message = [
	"## branch_name",
	" M work_mod_1",
	" D work_del_1",
	" M work_mod_2",
	"A  index_add_1",
	"M  index_mod_1",
	"D  index_mod_1",
	"R  index_rename",
	"C  index_copy",
	"AM index_add_work_mod",
	"AD index_add_work_del",
	"MM index_mod_work_mod",
	"MD index_mod_work_del",
	"RM index_rename_work_mod",
	"RD index_rename_work_del",
	"CM index_cop_work_mod",
	"CD index_cop_work_del",
	"?? untrack_1",
	"?? untrack_2",
	""
];

var expected = {
	branch: "branch_name",
	index: {
		modified : ["index_mod_1", "index_mod_work_mod", "index_mod_work_del"],
		added : ["index_add_1", "index_add_work_mod", "index_add_work_del"],
		deleted : ["index_mod_1"],
		renamed : ["index_rename", "index_rename_work_mod", "index_rename_work_del"],
		copied : ["index_copy", "index_cop_work_mod", "index_cop_work_del"]
	},
	workingTree: {
		modified : ["work_mod_1", "work_mod_2", "index_add_work_mod", "index_mod_work_mod", "index_rename_work_mod", "index_cop_work_mod"],
		added : ["untrack_1", "untrack_2"],
		deleted : ["work_del_1", "index_add_work_del", "index_mod_work_del", "index_rename_work_del", "index_cop_work_del"],
		renamed : [],
		copied : []
	}
};

exports["git status"] = {
	porcelain: function(test) {
		test.expect(1);
		var result = util.extractStatus(message.join("\n"));
		test.deepEqual(result, expected);
		test.done();
	},
	porcelain_z: function (test) {
		test.expect(1);
		var result = util.extractStatus(message.join("\0"));
		test.deepEqual(result, expected);
		test.done();
	},
	specify_separator: function(test) {
		test.expect(1);
		var result = util.extractStatus(message.join("____"), "____");
		test.deepEqual(result, expected);
		test.done();
	},
};


exports["git merge"] = {
	"no file overlap": function(test) {
		test.expect(1);
		var output = [
			"removed in remote",
			"  base   100644 e4205621569964b7a09d9948d7109e12952d99ea another",
			"  our    100644 e4205621569964b7a09d9948d7109e12952d99ea another",
			"@@ -1 +0,0 @@",
			"-Just some more text",
			"\ No newline at end of file",
			"added in remote",
			"  their  100644 8c957964464e8a1ef05bde12ac30784875305e69 some_file",
			"@@ -0,0 +1,11 @@",
			"+Some text here for the diff"
		].join("\n");
		var result = util.hasConflict(output);
		test.ok(!result, "No conflict");
		test.done();
	},
	"overlap with trivial merge": function (test) {
		test.expect(1);
		var output = [
			"added in both",
			"  our    100644 5aae37291277543a057e6b55aa505b8bea04985a some_file",
			"  their  100644 2f1f67c9946390e33c668b2631f03b8cb6cca8b2 some_file",
			"@@ -1,4 +1,8 @@",
			"+<<<<<<< .our",
			" Some text here got longer",
			"+=======",
			"+Some text here",
			"+>>>>>>> .their",
			" text here",
			" and some other here",
			" text here",
			"@@ -8,4 +12,8 @@",
			" text here",
			" another part of the file",
			" text here",
			"+<<<<<<< .our",
			" change it now",
			"+=======",
			"+change it now and here",
			"+>>>>>>> .their"
		].join("\n");
		var result = util.hasConflict(output);
		test.ok(!result, "No conflict");
		test.done();
	},
	"merge conflict": function(test) {
		test.expect(1);
		var output = [
			"changed in both",
			"  base   100644 8c957964464e8a1ef05bde12ac30784875305e69 some_file",
			"  our    100644 86975e50d423e88ed3c4dac48915b0fe40c81a36 some_file",
			"  their  100644 5aae37291277543a057e6b55aa505b8bea04985a some_file",
			"@@ -1,4 +1,8 @@",
			"+<<<<<<< .our",
			" Some text here got larger",
			"+=======",
			"+Some text here got longer",
			"+>>>>>>> .their",
			" text here",
			" and some other here"
		].join("\n");
		var result = util.hasConflict(output);
		test.ok(result, "Conflict");
		test.done();
	},
};