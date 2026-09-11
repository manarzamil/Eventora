/**
 * Test stub for the `server-only` package.
 *
 * In the application, importing `server-only` makes the bundler fail the build
 * if a server module is ever pulled into a client bundle. Vitest runs those same
 * modules directly in Node, where the real package throws, so it is aliased to
 * this empty module in `vitest.config.ts`.
 */
export {};
