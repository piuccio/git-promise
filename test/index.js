const fs = require("fs");
const baretest = require("baretest");

fs.readdir(__dirname, async (err, files) => {
  if (err) throw err;
  for (fileName of files.filter((_) => _.endsWith(".test.js"))) {
    const test = baretest(fileName);
    require(`./${fileName}`)(test);
    await test.run();
  }
});
