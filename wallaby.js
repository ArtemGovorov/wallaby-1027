module.exports = () => ({
  files: [
    'server/**/*.js',
    'shared/**/*.js',
    { pattern: '**/*.test.js', ignore: true },
    'package.json',
    'config/**/*',
    'data/*.json',
    'server/marko/**/*.marko',
    'src/stylesheets/postcss/inc/brandvars.css',
    'test/fixtures/**',
    'marko.json',
    'src/marko/components',
    { pattern: '**/*.marko', instrument: false },
    { pattern: '**/*.marko.js', ignore: true },
  ],

  tests: [
    'test/*.js',
    'server/**/*.test.js',
    'shared/**/*.test.js',
    '!server/marko/emails/email-templates.test.js',
  ],

  debug: true,

  env: {
    type: 'node',
    runner: 'node',
    params: {
      runner: '--harmony --trace-warnings',
    },
  },

  testFramework: 'jest',
  setup(wallaby) {
    wallaby.testFramework.configure(require('./package.json').jest);
  },
});