const process = require('process');
const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');

const {
  exec,
  insert_grid,
  load_settings,
  load_image,
  commit_files
} = require('./utils');

const GITHUB_TOKEN = core.getInput('gh_token');
const README_FILE_PATH = core.getInput('readme_path');
const GRID_FILE_PATH = core.getInput('grid_file_path');
const AS_BASE64 = core.getInput('as_base64') == 'true';

core.setSecret(GITHUB_TOKEN); // ensure token is masked in logs

// Load templates
const grid_template = fs.readFileSync(path.join(__dirname,"templates/grid.mustache"), "utf8");
const hexagon_template = fs.readFileSync(path.join(__dirname,"templates/hexagon.mustache"), "utf8");
const effect_templates = {
    "glitch": fs.readFileSync(path.join(__dirname,"templates/effects/glitch.mustache"), "utf8"),
};
const transition_templates = {
    "scale-in": fs.readFileSync(path.join(__dirname,"templates/transitions/scale-in.mustache"), "utf8"),
};

const generate_grid = (settings) => {
    // Render hexagon svg's
    const hexagons = settings.images.map((image, i) => {
        // Render effect templates
        effects = settings.effects.map(effect => {
            if(!effect_templates[effect]){
                core.error("No effect called " + effect);
                process.exit(1);
            }    
            return Mustache.render(
                effect_templates[effect],
                {
                    nth: i,
                    start_after: Math.random() * 2 + (i * 4),
                    repeat_after: 12,
                }
            )
        });

        // Render transition templates
        transitions = settings.transitions.map(transition => {
            if(!transition_templates[transition]){
                core.error("No transition called " + transition);
                process.exit(1);
            }    
            return Mustache.render(
                transition_templates[transition]
            )
        });

        // Render hexagon
        return Mustache.render(
            hexagon_template,
            {
                nth: i,
                effect_names: settings.effects,
                effects,
                image_source: load_image(image),
            }
        );
    });

    // Render Grid
    const output = Mustache.render(grid_template, { hexagons, transitions });
    
    // Save grid svg file for later use
    fs.writeFileSync(GRID_FILE_PATH, output);
}

(async () => {
    try {
        if (!process.env.TEST_MODE) {
            await exec('git', ['config', 'pull.rebase', 'true'], {stdio: ['pipe', 'pipe', 'pipe']});
            await exec('git', ['pull'], {stdio: ['pipe', 'pipe', 'pipe']});
        }
        
        const readme = fs.readFileSync(README_FILE_PATH, 'utf8');
        
        core.info('Generating grid SVG');
        const settings = load_settings(readme);
        generate_grid(settings);
        
        const newReadme = insert_grid(readme);
        
        core.info('Writing to ' + README_FILE_PATH);
        fs.writeFileSync(README_FILE_PATH, newReadme);

        if (!process.env.TEST_MODE) {
            // Commit to readme
            let file_paths = [README_FILE_PATH]
            if(!AS_BASE64){
                file_paths.push(GRID_FILE_PATH)
            }
            console.log("Commit changes", file_paths);
            await commit_files(GITHUB_TOKEN, file_paths).then(() => {
                process.exit(0);
            });
            process.exit(0);
        }
    } catch (e) {
        core.error(e);
        process.exit(1);
    }
})();

