# CLAUDE.md

Quick reference for working in this repo. Galore is a parser generator library (SLR, LALR, LR(1)) in TypeScript, published to npm as `galore`.

Where to look for detail:

- `README.md` for what the library does and the public entry points.
- `docs/Classes.md` for the class dependency diagram, `docs/History.md` for why the project exists.
- `NEXTSTEPS.md` for the todo list and known issues.
- `CHANGELOG.md` and `docs/releases/<tag>.md` for what shipped when.
- The docs site under `docs/` is a separate s3gen (Go) project with its own `package.json` and `Makefile`.

## Commands

```bash
pnpm install              # also runs `prepare`, which is a full build
pnpm run build            # tsc twice: tsconfig.json -> lib/esm, tsconfig-cjs.json -> lib/cjs
pnpm test src/tests       # scope matters, see gotchas
pnpm run lint             # eslint 9 flat config in eslint.config.mjs
pnpm run lintfix

cd docs && pnpm build     # webpack bundles for the docs site
cd docs && make run       # dev server on :8085
cd docs && make gh-pages  # deploy
```

CI is `.github/workflows/tests.yml`: lint, build and `pnpm test src/tests` on node 20 and 22, with `pnpm install --frozen-lockfile`.

## Gotchas

- **Scope the test command.** Plain `pnpm test` fails on the two suites under `samples/`, which import `galore` as an external package and cannot resolve it (issue 12). CI scopes to `src/tests` for that reason. A failure there is not your change.
- **`prepare` builds on every install.** A type error shows up as an install failure rather than a build failure, which is confusing the first time.
- **pnpm settings live in `pnpm-workspace.yaml`.** pnpm 10 and later refuse a non-interactive install when a dependency has an unapproved build script, so `pre-commit` and `spawn-sync` are listed under `allowBuilds`. pnpm 12 no longer reads these from the package.json `pnpm` field and warns if you put them there.
- **A just-published dependency can be blocked.** pnpm 12 enforces a minimum release age, so installing a version published minutes ago needs a `minimumReleaseAgeExclude` entry in the same file. The `tlex@1.1.0` entry there is spent and can come out.
- **Two places hold the version.** `package.json` and `docs/content/SiteMetadata.json`, the second of which the docs footer renders. Bump both or the site advertises a version that never shipped.
- **Do not use `*` for a dependency whose new API we call.** `tlex` is pinned to a range because a consumer resolving `*` from a stale lockfile lands on an older tlex and gets a `TypeError` at parse time rather than at install time.
- **npm registry lag is real.** A fresh publish can take several minutes to show up through `npm view`, and npm's local metadata cache lags further. Check `registry.npmjs.org/<pkg>` directly before concluding a publish failed.

## Parser reuse contract

Since 1.0.7, `parse()` empties the token buffer before it starts, so a parser is safe to reuse after a parse that threw. Before that, the token that caused a failure stayed in the buffer and every later parse reported the first failure's error (issue 9).

Two consequences worth remembering:

- A caller passing the same `Tape` to consecutive `parse()` calls loses a token that the previous call peeked at but never consumed, because a tape only moves forward.
- The reset lives in `SimpleParser.parse` and `ParallelParser.parse` in `src/parser.ts`, not in any one `parseInput`, so it covers the LR, LL and GLR parsers together. Put anything else that must happen once per parse in the same place.

## Working with tlex

Tokenizer and token buffer contracts belong to tlex (`../tlex`), not here. Prefer fixing them upstream over working around them in this repo, then depend on the released version. Release order is tlex tag and publish, then the range bump here, then a galore release. A galore change that calls unreleased tlex API cannot go green in CI and breaks fresh clones.

## Release checklist

1. Bump `package.json` and `docs/content/SiteMetadata.json`.
2. Write `docs/releases/v<X.Y.Z>.md` and add the matching `CHANGELOG.md` entry, newest on top, Keep a Changelog headings.
3. `pnpm run lint`, `pnpm run build`, `pnpm test src/tests`.
4. Commit as `Release v<X.Y.Z>`, tag `v<X.Y.Z>`, push master and the tag.
5. `gh release create v<X.Y.Z> --notes-file docs/releases/v<X.Y.Z>.md`.
6. `npm publish` is the maintainer's step. Verify afterwards from a clean directory outside the repo, installing the published version and running the behavior the release claims to fix.

Tags before v1.0.7 carry no notes and are deliberately not back-filled.
