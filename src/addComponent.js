const fs = require('fs-extra');
const path = require('path');

/**
 * Add a new component to an existing project
 * @param {string} componentType - Type of component
 * @param {string} name - Name of the component
 * @param {Object} options - Component options
 */
const addComponent = async (componentType, name, options = {}) => {
  const {
    path: componentPath = `src/${componentType}s`,
    test = true
  } = options;
  
  console.log(`Adding ${componentType} named ${name} at ${componentPath}`);
  
  // Ensure the directory exists
  const fullPath = path.join(process.cwd(), componentPath);
  
  try {
    await fs.ensureDir(fullPath);
    
    // Create component file
    const componentFile = path.join(fullPath, `${name}.js`);
    
    // Simple template - replace with more sophisticated templates
    const componentContent = `// ${componentType}: ${name}\n\nfunction ${name}() {\n  // TODO: Implement\n}\n\nmodule.exports = ${name};\n`;
    
    await fs.writeFile(componentFile, componentContent);
    console.log(`Created component at ${componentFile}`);
    
    // Create test file if needed
    if (test) {
      const testDir = path.join(process.cwd(), 'tests', componentPath);
      await fs.ensureDir(testDir);
      
      const testFile = path.join(testDir, `${name}.test.js`);
      const testContent = `// Test for ${componentType}: ${name}\n\nconst ${name} = require('../../${componentPath}/${name}');\n\ndescribe('${name}', () => {\n  test('should be defined', () => {\n    expect(${name}).toBeDefined();\n  });\n});\n`;
      
      await fs.writeFile(testFile, testContent);
      console.log(`Created test at ${testFile}`);
    }
    
  } catch (error) {
    console.error(`Error adding ${componentType}:`, error);
  }
};

module.exports = addComponent;
