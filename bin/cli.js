#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');

// Set the version from package.json
program.version(packageJson.version);

// Register commands
program
  .command('new <project-name>')
  .description('Create a new project')
  .option('-t, --type <type>', 'Project type (node, react, vue, etc.)')
  .option('-T, --template <template>', 'Specific template to use')
  .option('-o, --output <directory>', 'Custom output directory')
  .option('-g, --git [boolean]', 'Initialize git repository', true)
  .option('-i, --install [boolean]', 'Install dependencies after creation', true)
  .action((projectName, options) => {
    console.log(`Creating new project: ${projectName}`);
    console.log('Options:', options);
    // TODO: Implement project creation logic
  });

program
  .command('list-templates')
  .description('List all available project templates')
  .option('-t, --type <type>', 'Filter templates by project type')
  .action((options) => {
    console.log('Available templates:');
    // TODO: Implement template listing logic
    if (options.type) {
      console.log(`Filtering by type: ${options.type}`);
    }
  });

program
  .command('add <component-type> <name>')
  .description('Add a new component to an existing project')
  .option('-p, --path <path>', 'Custom path for the new component')
  .option('-t, --test [boolean]', 'Generate test files', true)
  .action((componentType, name, options) => {
    console.log(`Adding ${componentType} named ${name}`);
    console.log('Options:', options);
    // TODO: Implement component addition logic
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
