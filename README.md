# crivo

Chrome Remover of Industry and Vendor Offers. A Chrome extension that
strips paid placements and unwanted employers out of LinkedIn job search
and feed pages.

*Crivo* is Portuguese for a sieve, and *crivar* means to examine something
closely enough to catch what should not pass. The extension does both: it
reads every job card the page renders and drops the ones that match a
rule, so the listing that reaches the reader is the one they would have
been left with after filtering by hand.

No extension code has landed yet. This repository currently holds the
specification, the architecture notes, and the project conventions that
the implementation will follow. What the sections below describe is the
agreed target, not shipped behavior.

## What it removes

Two independent filters, each specified separately:

| Filter | Removes | Spec |
|---|---|---|
| Promoted | Job cards LinkedIn marks as a paid placement, in any interface language | [docs/features/promoted-filter.md](docs/features/promoted-filter.md) |
| Blocklist | Job cards whose title, company, or description matches a configured pattern, covering arms manufacturers, military contractors, surveillance vendors, and fossil fuel extractors | [docs/features/blocklist-filter.md](docs/features/blocklist-filter.md) |

A matched card is removed from the DOM rather than blurred or collapsed,
because a masked card still occupies the reader's attention and still
counts as an impression.

## Install

Chrome loads an unpacked extension straight from a checkout, so there is
no build step and nothing to compile:

1. Clone this repository.
2. Open `chrome://extensions/`.
3. Enable **Developer mode** with the toggle at the top right.
4. Click **Load unpacked** and select the repository folder.

The extension requests no permissions. It runs a single content script on
LinkedIn job and feed pages and touches nothing else, which is what keeps
the permission list empty.

## Configure

The blocklist lives in the extension source rather than in a settings
page, so editing it means editing one file and reloading the extension
from `chrome://extensions/`. The blocklist has a real cost attached: a
company that builds weapons also runs payroll and internal tooling, and
blocking the name hides those roles too. Read
[docs/features/blocklist-filter.md](docs/features/blocklist-filter.md)
before adding a term, since it records why each category is on the list
and which kinds of false positive the current list accepts.

## Documentation

| Document | Role |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development lifecycle, standards, validation, merge policy |
| [docs/specification.md](docs/specification.md) | Functional spec and acceptance criteria |
| [docs/architecture.md](docs/architecture.md) | Manifest V3 structure, DOM observation, selector strategy |
| [docs/decisions.md](docs/decisions.md) | Log of decisions that changed a constraint |
| [.guidelines/](.guidelines/) | Shared engineering guidelines, consumed as a submodule |

Clone with the submodule, or fetch it afterward:

```bash
git clone --recurse-submodules git@github.com:alexandrelheinen/crivo.git
```

```bash
git submodule update --init --recursive
```

## License

MIT. See [LICENSE](LICENSE).
