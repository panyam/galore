# Changelog

Notable changes to galore. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before v1.0.7 were tags without notes, and are not back-filled here.

## [1.1.0] - 2026-11-27

Full notes: `docs/releases/v1.1.0.md`.

### Added

- Parse tree nodes know where they came from in the input. A terminal keeps the token it was shifted from as `node.token`, and every node has `start` and `end`. A terminal takes its token's, and a non-terminal spans its first to its last child that covers any input. `end` is exclusive, like a token's, so a node's text is `input.substring(node.start, node.end)`. Both are null for a node that covers no input, such as an empty reduction. Rule handlers and `onReduction` see the spans of the children they reduce. Covers the LR, LL and GLR parsers.

## [1.0.7] - 2026-09-21

Full notes: `docs/releases/v1.0.7.md`.

### Fixed

- `parse()` starts from an empty token buffer, so a parse that throws no longer poisons every later parse on the same parser (issue 9, PR 10). Covers the LR, LL and GLR parsers.

### Changed

- Requires tlex `^1.1.0` for `TokenBuffer.reset()`, up from `*`.
- CI runs lint, build and tests on master and on every PR, across node 20 and 22. There was no CI before.

### Notes

- Consecutive `parse()` calls sharing one `Tape` no longer inherit an unconsumed peeked token, since a tape only moves forward.
