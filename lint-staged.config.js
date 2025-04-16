module.exports = {
  "*.md": ["prettier --write"],
  "*.xml": [
    "prettier --write --plugin=@prettier/plugin-xml --print-width 120 --tab-width 2",
  ],
  "*.yml": ["prettier --write"],
  "*.js": ["prettier --write"],
  "*.json": ["prettier --write"],
  "*.php": [
    "vendor/bin/php-cs-fixer fix --quiet --config=.php-cs-fixer.dist.php src",
    "git add",
  ],
};
