const reactLibraryConfig = require('@za/eslint-config/react-library');

module.exports = [...reactLibraryConfig, { ignores: ['jest.setup.js'] }];
