# Specification

Status: draft

Project-level functional spec. Each filter has its own document under
`docs/features/`, and this file holds what is true of the extension as a
whole. See [.guidelines/workflow/sdd.md](../.guidelines/workflow/sdd.md)
for how a spec feeds the rest of the cycle.

## Intent

A LinkedIn job search mixes three kinds of result: listings the reader
searched for, listings an employer paid to place there, and listings from
employers the reader will never apply to. Only the first kind is worth the
reader's attention, and LinkedIn offers no way to suppress the other two.
The extension removes them in the browser, so the page the reader scrolls
holds results they might act on.

The second category is a judgment, and the extension makes it explicitly
rather than pretending to be neutral: the default blocklist targets arms
manufacturers, military contractors, surveillance vendors, and fossil fuel
extractors operating in Europe. A reader who disagrees edits the list,
which is why the list is a readable file rather than a compiled artifact.

## Scope

**In scope:**

- LinkedIn job search pages and the feed, in the browser, for a reader who
  installed the extension themselves.
- Removing job cards that carry a paid placement marker.
- Removing job cards matching a configured set of terms.
- A blocklist that a reader can edit without a build step.

**Out of scope:**

- Any browser other than Chrome. The extension targets Manifest V3 and
  nothing depends on a Chrome-only API, so another Chromium browser will
  probably work, and that is an observation rather than a supported
  configuration.
- A settings page, synchronized settings, or any use of `chrome.storage`.
  The extension requests no permissions, and
  [decisions.md](decisions.md) records why.
- Sending anything anywhere. The extension makes no network request and
  collects no data.
- Filtering anywhere other than job cards, including messages, search
  results for people, and company pages.
- Undoing a removal, or showing the reader what was removed.

## Acceptance criteria

Criteria specific to one filter live in that filter's spec. The ids below
cover the extension as a whole.

- `AC-EXT-01`: When Chrome loads the unpacked extension, the extension
  shall install without requesting any permission.
- `AC-EXT-02`: When the reader opens any page outside
  `https://www.linkedin.com/jobs/*` and `https://www.linkedin.com/feed/*`,
  the extension shall not run.
- `AC-EXT-03`: When the content script runs, the extension shall make no
  network request.
- `AC-DOM-01`: When LinkedIn inserts job cards after the initial render,
  whether through infinite scroll or an asynchronous update, the extension
  shall evaluate the new cards against every filter.
- `AC-DOM-02`: When a card matches any filter, the extension shall remove
  the card from the DOM rather than hiding, blurring, or collapsing it.
- `AC-DOM-03`: When the extension removes a card, the surrounding list
  shall keep working, meaning that scrolling continues to load further
  results and the page throws no error.
- `AC-DOM-04`: When no card matches any filter, the extension shall leave
  the page unmodified.

## Traceability

| ID | Test |
|---|---|
| `AC-EXT-01` | |
| `AC-EXT-02` | |
| `AC-EXT-03` | |
| `AC-DOM-01` | |
| `AC-DOM-02` | |
| `AC-DOM-03` | |
| `AC-DOM-04` | |

Filling this table is part of the implementation work, not a separate
task. A criterion with no test against it is unverified regardless of how
obvious it looks.

## Constraints

- **Manifest V3**, with no permissions declared and a single content
  script injected at `document_end`.
- **No bundler and no build step.** The repository checkout is what Chrome
  loads.
- **The page belongs to LinkedIn.** The extension reads and removes; it
  does not rewrite layout, inject UI, or replace a removed card with a
  notice.
- **Selectors are unstable.** LinkedIn changes class names without notice,
  and the extension has to degrade into doing nothing visible rather than
  throwing on a page it no longer recognizes.
- **Performance budget.** Filtering runs on every DOM mutation in a long,
  continuously growing list, so the per-card check has to stay cheap
  enough that scrolling does not stutter. Compile each pattern once at
  load rather than per card.

## Design notes

The content script holds three parts, and the split is what makes the
matcher testable without a browser:

1. A **matcher**, meaning pure functions over strings that answer whether
   a given text matches the promoted marker or the blocklist. These are
   the seam under test.
2. A **card reader** that locates job cards and extracts the text the
   matcher needs. This is the part that breaks when LinkedIn changes, and
   it is verified by hand on a live page.
3. An **observer** that runs the other two over the initial page and over
   every subsequent mutation.

Keeping the matcher free of DOM access is what lets `scripts/validate.sh`
cover it under Node with no browser.

## Open questions

- Which interface languages the promoted marker has to cover beyond
  English, Portuguese, and French, and whether matching the marker text is
  sustainable at all. See
  [features/promoted-filter.md](features/promoted-filter.md).
- Whether the blocklist stays a single flat list or splits into categories
  a reader can enable separately. See
  [features/blocklist-filter.md](features/blocklist-filter.md).
