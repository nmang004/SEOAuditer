module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/backend/src/**/*.test.ts',
    '<rootDir>/backend/tests/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/backend/src', '<rootDir>/backend/tests'],
}; 