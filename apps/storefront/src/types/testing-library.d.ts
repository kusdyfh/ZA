// Pulls in @testing-library/jest-dom's custom-matcher type augmentations
// (toBeInTheDocument, toBeDisabled, etc.) for the whole program — the
// runtime setup (jest.setup.js) registers the matchers, but it's a .js
// file so tsc never sees its import of this same package.
import '@testing-library/jest-dom';
