const { tr } = require("date-fns/locale");
const { resolve, join } = require("path");

module.exports = (params = {}) => {
  // Provide a fallback for basePath if it's not defined
  const basePath = params.basePath || resolve(__dirname, "..", "..", "..");

  return {
    mode: "production",
    entry: "./src/main.js",
    output: {
      path: resolve(__dirname, "dist"),
      filename: "makaira-shopware6-storefront.js",
    },
    resolve: {
      modules: [
        // Add the local node_modules directory
        resolve(__dirname, "node_modules"),
        resolve(
          __dirname,
          "vendor/shopware/storefront/Resources/app/storefront"
        ),
        // Include the Shopware storefront node_modules if basePath is provided
        `${basePath}/Resources/app/storefront/node_modules`,
        // Include standard node_modules lookup
        "node_modules",
      ],
      extensions: [
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".json",
        ".less",
        ".sass",
        ".scss",
        ".twig",
      ],
    },
  };
};
