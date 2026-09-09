// @ts-check
const path = require('node:path');

/**
 * Root `lint-staged` config (moved out of `package.json`'s JSON `lint-staged`
 * key, which can't express this).
 *
 * ESLint v9's flat config has no per-directory cascade — a single config
 * resolves from the invoking CWD. The previous setup ran a bare
 * `eslint --fix` from the repo root, where no `eslint.config.js` exists (each
 * workspace has its own), so the pre-commit hook failed before even looking
 * at a file's content, for ANY change touching ANY package. A repo-root
 * config composing every workspace's own config was tried and reverted: it
 * hits a hard, unrelated compatibility break in `eslint-config-next`'s
 * legacy `@rushstack/eslint-patch` bridge, which refuses to run when
 * required from outside its owning Next.js app's own directory/CWD.
 *
 * The fix: run each staged file's lint through its *own* workspace's
 * already-correct `eslint.config.js`, with ESLint's CWD set to that
 * workspace — exactly how `pnpm --filter <pkg> lint` already works today.
 */
const WORKSPACES = [
  { dir: 'apps/admin', name: '@za/admin' },
  { dir: 'apps/api', name: '@za/api' },
  { dir: 'apps/storefront', name: '@za/storefront' },
  { dir: 'packages/shared', name: '@za/shared' },
  { dir: 'packages/types', name: '@za/types' },
  { dir: 'packages/ui', name: '@za/ui' },
];

/** @param {string[]} stagedFiles */
function eslintPerWorkspace(stagedFiles) {
  const commands = [];
  for (const { dir, name } of WORKSPACES) {
    const absoluteDir = path.join(__dirname, dir);
    const relativeFiles = stagedFiles
      .filter((file) => file.startsWith(absoluteDir + path.sep))
      .map((file) => path.relative(absoluteDir, file));
    if (relativeFiles.length > 0) {
      commands.push(
        `pnpm --filter ${name} exec eslint --fix -- ${relativeFiles.map((f) => JSON.stringify(f)).join(' ')}`,
      );
    }
  }
  return commands;
}

module.exports = {
  '*.{ts,tsx,js,jsx}': eslintPerWorkspace,
  '*.{ts,tsx,js,jsx,md,json,yml,yaml}': ['prettier --write'],
};
