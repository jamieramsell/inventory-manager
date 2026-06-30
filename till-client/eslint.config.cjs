const reactHooks = require('eslint-plugin-react-hooks');

// Google TypeScript Style, enforced via gts, with React's hook rules layered on
// top. gts owns the base TS/style rules and Prettier formatting; the extra block
// adds React hook rules and fixes type-aware parsing for Vite's project layout.
module.exports = [
  // gts's own ignores cover build/ and node_modules/ but not Vite's dist/
  // output — exclude it (and this CommonJS config file) from linting.
  {ignores: ['dist/**', 'eslint.config.cjs']},
  ...require('gts'),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        // gts points `project` at ./tsconfig.json, but Vite's tsconfig.json is a
        // solution file (no files, only references). Use the TypeScript project
        // service instead so each file resolves via tsconfig.app/node.json.
        project: false,
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {'react-hooks': reactHooks},
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
