/**
 * List available project templates
 * @param {Object} options - Listing options
 */
const listTemplates = async (options = {}) => {
  const { type } = options;

  // Mock data - replace with actual template discovery logic
  const templates = {
    node: ["basic", "api", "cli"],
    react: ["basic", "typescript", "next"],
    vue: ["basic", "typescript", "nuxt"],
  };

  if (type && templates[type]) {
    console.log(`Available ${type} templates:`);
    templates[type].forEach((template) => console.log(`- ${template}`));
  } else {
    console.log("Available templates:");
    Object.entries(templates).forEach(([templateType, templateList]) => {
      console.log(`\n${templateType}:`);
      templateList.forEach((template) => console.log(`- ${template}`));
    });
  }
};

module.exports = listTemplates;
