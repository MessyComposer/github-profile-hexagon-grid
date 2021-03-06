const { spawn } = require("child_process");
const core = require("@actions/core");
const fs = require("fs");
var mime = require("mime");
const path = require('path');
const Mustache = require('mustache');
const axios = require('axios').default;

const GRID_FILE_PATH = core.getInput('grid_file_path');
const AS_BASE64 = core.getInput('as_base64') == 'true';

const hexagon_base_template = fs.readFileSync(path.join(__dirname,"templates/hexagon_base.mustache"), "utf8");


// Executes a CLI command as a child process
const exec = (cmd, args = [], options = {}) => new Promise((resolve, reject) => {
    let outputData = "";
    const optionsToCLI = {
      ...options,
    };
    if (!optionsToCLI.stdio) {
      Object.assign(optionsToCLI, { stdio: ["inherit", "inherit", "inherit"] });
    }
    const app = spawn(cmd, args, optionsToCLI);
    if (app.stdout) {
      // Only needed for pipes
      app.stdout.on("data", function (data) {
        outputData += data.toString();
      });
    }

    app.on("close", (code) => {
      if (code !== 0) {
        return reject({ code, outputData });
      }
      return resolve({ code, outputData });
    });
    app.on("error", () => reject({ code: 1, outputData }));
});

const build_grid_readme = () => {
    let file_path = GRID_FILE_PATH;
    if(AS_BASE64){
        file_path = (
            "data:" +
            mime.getType(GRID_FILE_PATH) +
            ";base64," +
            fs.readFileSync(GRID_FILE_PATH, "base64")
        );
    }
    return `<a href="https://github.com/MessyComposer/github-profile-hexagon-grid"><img src="${process.env.TEST_MODE ? './grid.svg' : file_path}" height="200px"/></a>`;
};

const insert_grid = (readme) => {
  const startTag = `<!-- HEX-GRID:START -->`;
  const endTag = `<!-- HEX-GRID:END -->`;
  const startIndex = readme.indexOf(startTag); // Get first grid start tag
  const endIndex = readme.indexOf(endTag, startIndex); // Get first end grid tag, starting from first start tag.

  if (startIndex === -1 || endIndex === -1) {
    core.error(`Could not find start/end tags`);
    process.exit(1);
  }
  return [
    readme.slice(0, startIndex + startTag.length),
    "\n",
    build_grid_readme(),
    "\n",
    readme.slice(endIndex),
  ].join("");
};

const load_settings = (readme) => {
    const imagesStartTag = `<!-- HEX-GRID:IMAGES`;
    const effectsStartTag = `<!-- HEX-GRID:EFFECTS`;
    const transitionsStartTag = `<!-- HEX-GRID:TRANSITIONS`;
    
    const parse_array_values = (start) => {
        const tagStartIndex = readme.indexOf(start);
        if(tagStartIndex == -1){
            return [];
        }
        const tagEndIndex = readme.indexOf("-->", tagStartIndex);
        const arrayStartIndex = readme.indexOf("[", tagStartIndex);
        const arrayEndIndex = readme.indexOf("]", tagStartIndex);
        if(arrayEndIndex > tagEndIndex){
            core.error("Array end index > tag end index");
        }
        [arrayStartIndex, arrayEndIndex]
        if(arrayStartIndex == -1 || arrayEndIndex == -1){
            return []
        }
        return JSON.parse(readme.slice(arrayStartIndex, arrayEndIndex + 1));
    }
    // Get indeces to array
    const images = parse_array_values(imagesStartTag);
    const effects = parse_array_values(effectsStartTag);
    const transitions = parse_array_values(transitionsStartTag);

    return {
        "images": images,
        "effects": effects,
        "transitions": transitions,
    };
};

const commit_files = async (githubToken, filePaths) => {
  // Load config
  const gitUsername = core.getInput("git_username");
  const gitEmail = core.getInput("git_email");
  const commitMessage = core.getInput("commit_message");

  // commit and push
  await exec("git", ["config", "--global", "user.email", gitEmail]);
  if (githubToken) {
    // git remote set-url origin
    await exec("git", [
      "remote",
      "set-url",
      "origin",
      `https://${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.git`,
    ]);
  }
  await exec("git", ["config", "--global", "user.name", gitUsername]);
  await exec("git", ["add", ...filePaths]);
  await exec("git", ["commit", "-m", commitMessage]);
  await exec("git", ["push"]);
  core.info("repository upstream updated");
};

const load_image = async (image) => {
    if (typeof(image) == "object") {
        const res = await axios.get(image.url, {
            responseType: 'arraybuffer'
        })
        let image_base64 = (
            "data:" + 
            res.headers["content-type"] +
            ";base64," +
            Buffer.from(res.data, 'binary').toString('base64')
        );
        if(image.hex){
            image_base64 = "data:image/svg+xml;base64,"+Buffer.from(Mustache.render(
                hexagon_base_template,
                {
                    embed: image_base64,
                    bg_fill: image.bg_fill || "rgba(215,255,212,0.5)"
                }
            )).toString('base64')
        }

        

        return image_base64;
    }
    else if (image.includes("base64")) {
        return image;
    }
    else {
        const file_path = path.join(__dirname, `images/${image.toLowerCase()}.svg`);
        return (
            "data:" +
            mime.getType(file_path) +
            ";base64," +
            fs.readFileSync(file_path, "base64")
        );
    }
}

module.exports = {
  insert_grid,
  exec,
  commit_files,
  load_settings,
  load_image,
};
