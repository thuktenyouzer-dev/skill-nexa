
module.exports = {
    testEnvironment: 'node',

    testMatch: ['**/tests/**/*.test.js'],

    setupFiles: ['<rootDir>/jest.setup.js'],

    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        '!**/node_modules/**'
    ],

    coverageDirectory: 'coverage',

    coverageReporters: ['text', 'lcov']
};
