# Contributing

Development lifecycle, engineering standards, and agent rules for this
repository. Human contributors and AI agents follow the same rules, and an
agent is not exempt from specs, tests, or review.

## Document map

| Document | Role |
|---|---|
| [README.md](README.md) | What the extension does, how to install it, how to edit the blocklist |
| **CONTRIBUTING.md** (this file) | How work gets done: workflow, standards, validation, merge policy |
| [docs/specification.md](docs/specification.md) | Functional spec and acceptance criteria |
| [docs/architecture.md](docs/architecture.md) | Manifest V3 structure, DOM observation, selector strategy |
| [docs/decisions.md](docs/decisions.md) | Log of decisions that changed or loosened a constraint |
| [CHANGELOG.md](CHANGELOG.md) | What each released version changed |
| [.guidelines/](.guidelines/) | Shared engineering guidelines, consumed as a submodule |

Do not duplicate a rule across these files. `CLAUDE.md` and `AGENTS.md` are
bridges that point here, and neither of them carries rules of its own.

## Specification-driven development

This project follows the shared
[SDD workflow](.guidelines/workflow/sdd.md). The project-level spec is
[docs/specification.md](docs/specification.md), and each filter has its own
spec under `docs/features/`. An issue links to the spec and copies its
acceptance criteria into the definition of done rather than restating them
in prose.

Acceptance criteria use the id scheme `AC-<AREA>-<NN>`, with areas `PROMO`,
`BLOCK`, `DOM`, and `EXT`. Ids are append-only, so a removed criterion
leaves its number retired rather than reused.

## Workflow

### Branches

Branch from the current tip of `main` using `<type>/<slug>`, matching the
commit type vocabulary. See
[.guidelines/workflow/branching.md](.guidelines/workflow/branching.md).

`main` is the published branch. A user installing the extension loads a
checkout of `main` directly through `chrome://extensions/`, so a broken
commit on `main` is a broken install for anyone who pulls, and there is no
build or release step standing between the two.

### Commits

Conventional Commits, as described in
[.guidelines/workflow/commits.md](.guidelines/workflow/commits.md). One
logical change per commit, traceable to a single acceptance criterion.

### Pull requests

The description links the issue and the spec, and its checklist mirrors the
acceptance criteria. Check an item only after verifying it, and attach the
evidence that backs it. Because the visible behavior of this extension is
the absence of an element, the evidence for a filter change is a before and
after capture of a real LinkedIn page, not a description of what should
have disappeared. See
[.guidelines/workflow/review.md](.guidelines/workflow/review.md).

Rebase and merge, keeping history linear. The owner approves and merges;
agents do not.

### Versioning

The `version` field in `manifest.json` is the release number, and
[CHANGELOG.md](CHANGELOG.md) records what each one changed. Chrome shows
that number on `chrome://extensions/`, which makes it the only version a
reader ever sees, so nothing else in the repository carries a second one.

Semantic versioning, read against what a reader installing the extension
would notice: a patch fixes a selector or a false positive, a minor adds a
filter or a term, and a major changes what the extension removes by
default. The number stays below `1.0.0` until the extension has filtered a
live page.

## Validation

Two layers, and neither substitutes for the other.

The automated layer is `scripts/validate.sh`, which the first
implementation pull request adds. It runs the matcher tests under
`node:test` with Node's own coverage flag, gated at 90% of lines and
branches in `matcher.js`, then checks `manifest.json` for the keys
Manifest V3 requires. It runs no browser and installs nothing, so the
repository carries no `package.json` and no lockfile.

```bash
./scripts/validate.sh
```

A GitHub Actions workflow runs that same script on every pull request.
Run it locally before pushing rather than discovering a failure in CI.

The manual layer is a real page. A green matcher test proves that a string
matches a pattern, and it says nothing about whether the selector still
finds the card that LinkedIn rendered this week. Any change touching a
selector, the observer, or the removal path has to be loaded through
`chrome://extensions/` and checked against a live job search and feed,
including one pass with the interface set to a second language.

Do not weaken a gate to get a green run. If a gate is wrong for a specific
case, propose the change in [docs/decisions.md](docs/decisions.md) and have
it reviewed like any other spec change.

## Engineering standards

### JavaScript

Vanilla JavaScript with no bundler, following the static-site half of
[.guidelines/languages/js.md](.guidelines/languages/js.md). A content
script that Chrome loads directly from disk is the deploy model, and adding
a build step changes how every contributor installs and debugs the
extension, so it needs a spec and the owner's sign-off first.

### Selectors are the fragile part

LinkedIn ships obfuscated class names that change without notice, so treat
every selector as a guess with a shelf life. Prefer a stable structural
hook or a visible text marker over a generated class name, match text case
insensitively across the interface languages the spec lists, and keep each
selector in one named constant rather than inline at the call site, so a
break is one edit rather than a search.

A selector that stops matching must fail visibly in the manual check. Do
not add a fallback that silently keeps the page untouched, because a filter
that quietly stops filtering looks identical to a clean page. See
[.guidelines/style/errors.md](.guidelines/style/errors.md).

### Removing a card

Removal is permanent within the page: the extension takes the card out of
the DOM instead of hiding it with CSS. It must also leave the page usable,
which means not breaking LinkedIn's own scroll and pagination bookkeeping.
[docs/architecture.md](docs/architecture.md) records how.

### Comments and naming

Follow [.guidelines/style/comments.md](.guidelines/style/comments.md) and
[.guidelines/style/naming.md](.guidelines/style/naming.md). The one place a
comment earns its keep here is a selector constant, where the reason a
particular hook was chosen over an obvious alternative is not visible from
the code.

## AI agents

Agents follow this file and the shared guidelines it points to. Three rules
matter more than the rest in this repository:

1. Do not merge a pull request.
2. Do not claim a filter works without a capture of it working on a real
   page, per
   [.guidelines/agents/claude.md](.guidelines/agents/claude.md).
3. Do not add a term to the blocklist without recording the reasoning in
   [docs/features/blocklist-filter.md](docs/features/blocklist-filter.md).
   The list encodes a judgment about employers, it hides jobs from a real
   person using the extension, and an unexplained entry cannot be reviewed
   later.

Output compressed into fragments, from caveman or any similar tool, does
not go into a commit message, a document, a spec, or a code comment. See
[.guidelines/agents/writing.md](.guidelines/agents/writing.md#compression-tools).
