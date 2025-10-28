module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts', 'jest-canvas-mock'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};