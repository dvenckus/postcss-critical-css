#!/usr/bin/env node
const fs = require("fs");
const { bold } = require("chalk");
const postcss = require("postcss");
const criticalCSS = require("..");
const cliArgs = require("minimist")(process.argv.slice(2), {
  boolean: ["minify", "preserve"],
  default: { minify: true, preserve: true },
});
const fixturesDir = cliArgs["fixtures-dir"] || "fixtures";
const testOutput = "test/output";
const testOutputPath = `${process.cwd()}/${testOutput}`;
let basePath = cliArgs.outputPath || `${process.cwd()}/test/${fixturesDir}`;
let pluginOpts = Object.assign(
  {},
  {
    minify: cliArgs.minify,
    outputDest: cliArgs.outputDest,
    outputPath: testOutput,
    preserve: typeof cliArgs.preserve !== "undefined" ? cliArgs.preserve : true,
  }
);
if (cliArgs.noArgs) {
  basePath = testOutputPath;
  pluginOpts = {
    outputPath: testOutput,
  };
}

// console.log("pluginOpts: ", pluginOpts);

function useFileData(data, file) {
  postcss([criticalCSS(pluginOpts)])
    .process(data)
    .catch((err) => {
      console.error(bold.red("Error: "), err);
      process.exit(1);
    })
    .then((result) => {
      const filename = `${testOutputPath}/${
        file.split(".")[0]
      }.non-critical.actual.css`;
      // console.log(`Pretest creating: ${filename}`);
      fs.writeFile(filename, result.css, "utf8", (err) => {
        if (err) {
          throw new Error(err);
        }
      });
    });
}

function deleteOldFixtures(files) {
  let totalProcessed = 0;
  files.forEach((file) => {
    if (file.indexOf(".actual") !== -1 || file === "critical.css") {
      const filePath = `${testOutputPath}/${file}`;
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            throw new Error(err);
          }
        });
      }
    }
    totalProcessed++;
    writeNewFixtures(totalProcessed, files);
  });
}

function writeNewFixtures(totalProcessed, files) {
  if (totalProcessed !== files.length) {
    return;
  }
  files.forEach((file) => {
    if (
      file.indexOf(".css") !== -1 &&
      file.indexOf(".expected") === -1 &&
      file.indexOf(".actual") === -1 &&
      file !== "critical.css"
    ) {
      fs.readFile(`${basePath}/${file}`, "utf8", (err, data) => {
        if (err) {
          throw new Error(err);
        }
        useFileData(data, file);
      });
    }
  });
}

fs.readdir(basePath, "utf8", (err, files) => {
  // console.log("files: ", files);
  if (err) {
    throw new Error(err);
  }
  deleteOldFixtures(files);
});
