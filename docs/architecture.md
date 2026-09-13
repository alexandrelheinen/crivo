# Architecture

Structural decisions for the extension. What each filter matches lives in
its own spec under `features/`; this file covers how the pieces fit
together.

## Files

```
manifest.json    Manifest V3 declaration
matcher.js       Pure string matching, no DOM access
matcher.test.js  Tests for the matcher, run under Node
content.js       Card reader and mutation observer
scripts/         Validation entry point
docs/images/     Source of the icon, as SVG
```

Chrome loads the repository folder directly, so the checkout is the
artifact and there is nothing to compile.

## Manifest

Manifest V3, no `permissions` array, one content script matching
`https://www.linkedin.com/jobs/*`, injected at `document_end`.

The empty permission list is deliberate. A content script already reads
and modifies the page it runs on, and everything the extension does fits
inside that, so any entry in
`permissions` would widen what the extension can reach without widening
what it does. It also keeps the install prompt empty, which matters for
software a reader is asked to load unpacked from a stranger's repository.

The manifest also carries an `icons` map, which Chrome reads as raster
images at 16, 32, 48, and 128 pixels. The source of truth for the mark is
[images/crivo.svg](images/crivo.svg), the Material Symbols glyph
`no_adult_content` filled with the project color `#AB1F3C`, so the PNG
sizes are generated from that file rather than drawn separately. Anything
that renders the mark uses the same color, since the project has only one.

## Three parts, two files

The extension splits into three parts along the line that decides what can
be tested without a browser.

**The matcher** holds pure functions over strings. Given a card's title,
company, and marker text, it answers whether that card matches. It touches
no DOM API, and it lives in `matcher.js` so that Node can load it without
loading anything that expects a page. This is the seam the tests are
written against.

**The card reader** finds job cards in the page and pulls out the text the
matcher needs. It is the only part that knows a selector, and it is the
part that breaks when LinkedIn ships a change.

**The observer** runs the reader and the matcher over the page at
`document_end`, then again over every batch of nodes a `MutationObserver`
reports.

The reader and the observer share `content.js`, because neither is useful
without the other and neither can run outside a browser.

## Loading the same file in Chrome and in Node

Manifest V3 loads a content script as a classic script rather than as a
module, so `matcher.js` cannot use `export`. It assigns its functions to a
global that `content.js` reads, and it ends with a guard that hands the
same functions to Node:

```js
if (typeof module !== 'undefined') {
  module.exports = { matchesPromoted, matchesBlocklist };
}
```

`module` is undefined in a content script, so Chrome skips the block, and
`require` in a test picks it up. Listing `matcher.js` before `content.js`
in the manifest `content_scripts` array is what guarantees the global
exists by the time the reader runs.

This is the whole reason the extension is two files rather than one. A
single file holding both the matcher and a `document.querySelectorAll`
call cannot be required from Node, which would leave the matcher testable
only through a browser.

## Observing the page

LinkedIn renders the job list client side and appends to it as the reader
scrolls, so the initial pass over the document catches only the first
batch. A `MutationObserver` on the list container handles the rest.

Two properties of the observer matter enough to state.

It has to be idempotent, because LinkedIn re-renders cards that are already
on the page and the observer will see the same card more than once.
Evaluating a card twice is fine; removing a card twice is not, and the
reader has to tolerate a node that is already detached.

It also has to avoid observing its own removals. Removing a node is a
mutation, and an observer that reacts to it without a guard re-enters
itself on every card it removes.

## Verification plan

Written before the implementation, so that it describes what the code has
to do rather than what the code turned out to do.

**The matcher is covered by tests.** `matcher.test.js` runs under
`node:test`, the runner built into Node, which keeps the repository free
of `node_modules` and of a lockfile. Coverage comes from Node's own
`--experimental-test-coverage`, and the gate is 90% of lines and branches
in `matcher.js`. A pure function over strings has no excuse for less.

`scripts/validate.sh` runs those tests with the coverage gate, then checks
`manifest.json` for the keys Manifest V3 requires. A GitHub Actions
workflow runs the same script on every pull request, so a green run
locally and a green run in CI mean the same thing.

**The reader and the observer are covered by hand.** They are verified by
loading the extension through `chrome://extensions/` and opening a job
search known to contain promoted cards. Nothing automated touches them,
because a test that stubs LinkedIn's DOM proves only that the stub matches
the selector, which is the assumption most likely to be wrong in the first
place.

Each acceptance criterion names its test in the traceability table of its
spec. A criterion covering the reader or the observer names the manual
check instead, and says so.

## Selectors

LinkedIn serves job search from `/jobs/search-results/` and renders it with
generated class names, so a card carries classes like `_4ad3fe9f` and
`bde1bb6e` that change between deployments. None of them is a usable hook.
The cards are not list items either, which rules out the obvious structural
guess.

Three hooks carry the reader, and they differ in how much weight they hold:

| Target | Selector | Why it holds |
|---|---|---|
| List container | `div[data-testid="lazy-column"]` | Named after the component that renders it, `LazyColumn`, so it survives a restyle |
| Card root | `div[data-testid="lazy-column"] > div[data-display-contents="true"]` | The attribute alone is generic and appears at several depths, and scoping it to a direct child of the container is what makes it a card |
| Promoted marker | A `p` element inside the card whose own text is the marker word | Nothing else distinguishes it |

The marker paragraph shares its entire class list with the sibling
paragraphs that carry the location and the posting age, so no class,
attribute, or position tells them apart. Reading the text of each paragraph
is the only thing left, which is the observation
[features/promoted-filter.md](features/promoted-filter.md) turned into
`AC-PROMO-04`.

Removing the card root removes the whole card, since the anchor wrapping
the card content sits inside it.

## Failing visibly

A selector that no longer matches produces an empty result rather than an
error, so the extension keeps running and silently stops filtering. That
failure is indistinguishable from a clean page, which is why the manual
check in [../CONTRIBUTING.md](../CONTRIBUTING.md) reads a page that is
known to contain promoted cards rather than any page at all.

Do not add a fallback that keeps the extension quiet when a selector
breaks. There is nothing useful to fall back to, and a quiet failure is
the failure mode that goes unnoticed longest. See
[.guidelines/style/errors.md](../.guidelines/style/errors.md).

## Performance

The per-card check runs on every mutation of a list that grows without
bound while the reader scrolls, so the patterns compile once at load and
the matcher does string work only. Anything heavier than a compiled
regular expression test per field belongs somewhere other than this path.
