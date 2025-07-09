module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
         '\\.(css|less|scss)$': 'identity-obj-proxy'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['whatwg-fetch'],
    setupFilesAfterEnv: ['./tests/setupTests.js'],
}