module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!src/swagger.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  maxWorkers: 1,
  testTimeout: 30000,
};
