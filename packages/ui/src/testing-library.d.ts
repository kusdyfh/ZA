// Pulls in @testing-library/jest-dom's custom-matcher type augmentations
// for the whole program — jest.setup.js (plain JS, outside the tsconfig
// program) registers the matchers at runtime, but tsc never sees it.
import '@testing-library/jest-dom';
