const fs = require("fs");
const baretest = require("baretest");

fs.readdir(__dirname, async (err, files) => {
  if (err) throw err;
  for (let fileName of files.filter((_) => _.endsWith(".test.js"))) {
    const test = baretest(fileName);
    require(`./${fileName}`)(test);
    const success = await test.run();
    if (success === false) {
      process.exit(1);
    }
  }
});
