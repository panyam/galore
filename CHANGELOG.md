# Changelog

Notable changes to galore. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before v1.0.7 were tags without notes, and are not back-filled here.

## [1.0.7] - 2026-09-21

Full notes: `docs/releases/v1.0.7.md`.

### Fixed

- `parse()` starts from an empty token buffer, so a parse that throws no longer poisons every later parse on the same parser (issue 9, PR 10). Covers the LR, LL and GLR parsers.

### Changed

- Requires tlex `^1.1.0` for `TokenBuffer.reset()`, up from `*`.
- CI runs lint, build and tests on master and on every PR, across node 20 and 22. There was no CI before.

### Notes

- Consecutive `parse()` calls sharing one `Tape` no longer inherit an unconsumed peeked token, since a tape only moves forward.
