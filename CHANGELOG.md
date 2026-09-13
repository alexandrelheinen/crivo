# Changelog

All notable changes to this repository are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows the scheme in
[CONTRIBUTING.md](CONTRIBUTING.md#versioning).

## [Unreleased]

### Added

- The promoted filter and the blocklist filter, covering LinkedIn job
  search. Both run off `matcher.js`, which is covered by tests, and
  `content.js`, which is verified by loading the extension.
- `scripts/validate.sh`, running the matcher tests under a 90% coverage
  gate and asserting the manifest claims, on GitHub Actions and locally.

Nothing has been released yet, so the manifest carries `0.1.0` and no
version below has a heading.
