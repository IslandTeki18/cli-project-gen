// This file exports the main functionality of the CLI tool
// for programmatic usage

const generateProject = require('./src/generateProject');
const listTemplates = require('./src/listTemplates');
const addComponent = require('./src/addComponent');

module.exports = {
  generateProject,
  listTemplates,
  addComponent
};
