module.exports = {
  "*.md": ["prettier --write"],
  "*.xml": ["prettier --write --plugin=@prettier/plugin-xml '**/*.xml'"],
  "*.yml": ["prettier --write"],
  "*.js": ["prettier --write"],
  "*.json": ["prettier --write"],
};
