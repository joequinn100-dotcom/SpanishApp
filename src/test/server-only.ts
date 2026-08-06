/**
 * Stand-in for the `server-only` package under vitest.
 *
 * The real package's default export throws to catch a server module being
 * pulled into a client bundle. Vitest is neither, so importing it would fail
 * every test of a server module — this empty module is aliased in its place by
 * vitest.config.mts. Nothing imports this directly.
 */
export {};
