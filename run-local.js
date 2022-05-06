const process = require('process');
const path = require('path');
const fs = require('fs');

const dummy_readme = `# Readme local test
Some hexagons:
<!-- HEX-GRID:IMAGES [
    "cpp",
    "fabric",
    "node",
    "python",
    "react",
    {
        "url": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/qt/qt-original.svg",
        "hex": true,
        "bg_fill": "#ffffffcc"
    },
    {
        "url": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
        "hex": true,
        "bg_fill": "#ffffffaa"
    }
] -->
<!-- HEX-GRID:EFFECTS ["glitch"] -->
<!-- HEX-GRID:TRANSITIONS ["scale-in"] -->
<!-- HEX-GRID:START --><!-- HEX-GRID:END -->

# More content

lorem ipsum
`;

try {
    const filePath = path.join(__dirname, 'test', 'README.md');
    const dirname = path.dirname(filePath);

    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, {recursive: true});
    }
    fs.writeFileSync(filePath, dummy_readme);
    
    process.env.INPUT_README_PATH = path.join(__dirname, 'test', 'README.md');
    process.env.INPUT_GRID_FILE_PATH = path.join(__dirname, 'test', 'grid.svg');
    process.env.TEST_MODE = 'true';
    process.env.INPUT_AS_BASE64 = 'true';
    require("./src/index.js");
}
catch (err) {
    throw new Error(err);
}
