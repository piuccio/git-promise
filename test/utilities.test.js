const assert = require("assert");
const util = require("../util.js");

const message = [
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

const expected = {
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

module.exports = (test) => {
	test("git status - porcelain", () => {
		const result = util.extractStatus(message.join("\n"));
		assert.deepEqual(result, expected);
	});

	test("git status - porcelain z", () => {
		const result = util.extractStatus(message.join("\0"));
		assert.deepEqual(result, expected);
	});

	test("git status - specify separator", () => {
		const result = util.extractStatus(message.join("____"), "____");
		assert.deepEqual(result, expected);
	});

	test("git merge - no file overlap", () => {
		const output = [
			"removed in remote",
			"  base   100644 e4205621569964b7a09d9948d7109e12952d99ea another",
			"  our    100644 e4205621569964b7a09d9948d7109e12952d99ea another",
			"@@ -1 +0,0 @@",
			"-Just some more text",
			" No newline at end of file",
			"added in remote",
			"  their  100644 8c957964464e8a1ef05bde12ac30784875305e69 some_file",
			"@@ -0,0 +1,11 @@",
			"+Some text here for the diff"
		].join("\n");
		const result = util.hasConflict(output);
		assert.ok(!result, "No conflict");
	});

	test("git merge - overlap with trivial merge", () => {
		const output = [
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
		const result = util.hasConflict(output);
		assert.ok(!result, "No conflict");
	});

	test("git merge - merge conflict", () => {
		const output = [
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
		const result = util.hasConflict(output);
		assert.ok(result, "Conflict");
	});
};
