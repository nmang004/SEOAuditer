module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/backend/src/**/*.test.ts',
    '<rootDir>/backend/tests/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/backend/src', '<rootDir>/backend/tests'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        moduleResolution: 'node',
        resolveJsonModule: true
      }
    }
  },
  setupFilesAfterEnv: ['<rootDir>/backend/jest.setup.js'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/index.ts'
  ]
}; 