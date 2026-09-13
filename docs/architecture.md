# Architecture

Structural decisions for the extension. What each filter matches lives in
its own spec under `features/`; this file covers how the pieces fit
together.

## Files

```
manifest.json    Manifest V3 declaration
content.js       The whole extension: matcher, card reader, observer
scripts/         Validation entry point and matcher tests
docs/images/     Source of the icon, as SVG
```

Chrome loads the repository folder directly, so the checkout is the
artifact and there is nothing to compile.

## Manifest

Manifest V3, no `permissions` array, one content script matching
`https://www.linkedin.com/jobs/*` and `https://www.linkedin.com/feed/*`,
injected at `document_end`.

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

## Three parts, one file

The content script splits into three parts along the line that decides
what can be tested without a browser.

**The matcher** holds pure functions over strings. Given a card's title,
company, and marker text, it answers whether that card matches. It touches
no DOM API, which is what lets `scripts/validate.sh` run it under Node.
This is the seam the tests are written against.

**The card reader** finds job cards in the page and pulls out the text the
matcher needs. It is the only part that knows a selector, and it is the
part that breaks when LinkedIn ships a change.

**The observer** runs the reader and the matcher over the page at
`document_end`, then again over every batch of nodes a `MutationObserver`
reports.

Splitting a single file three ways is not a fully general structure, and
it is what the seam requires: a matcher that imports nothing and a reader
that owns every selector.

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
