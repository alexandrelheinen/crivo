# Decisions

Records a decision that set, loosened, or changed a constraint, so that
"why is this weaker than the spec says" stays answerable. Entries are
append-only and each one carries the context that made it the right call,
since that context is what a later reader needs to judge whether the
decision still holds.

## Remove matched cards instead of hiding them

The extension deletes a matched card from the DOM rather than applying
`display: none` or a blur.

A hidden card still occupies the reader's attention when it leaves a gap,
a blurred card invites a second look, and both still register as rendered
content. Deletion also keeps the extension out of the business of
maintaining a parallel visual state.

The cost is that the removal is not reversible within the page, so a
reader who wants to see what was filtered has to disable the extension and
reload. Nothing records what was removed.

## Request no permissions

`manifest.json` declares no `permissions`.

A content script can already read and modify the page it is injected into,
and that is the whole surface the extension needs. Adding a permission
would widen what the extension can reach without widening what it does.

This rules out `chrome.storage`, which in turn rules out a settings page
and any configuration that survives outside the source file. A reader
configures the blocklist by editing the file and reloading, which is the
trade this decision accepts, and it is the constraint the open question
about per-category toggles in
[features/blocklist-filter.md](features/blocklist-filter.md) runs into.

## Split the matcher into its own file

`matcher.js` holds the pure matching functions and `content.js` holds
everything that touches the page.

The split exists to make the matcher loadable from Node, since a file that
calls `document.querySelectorAll` at load cannot be required by a test.
Keeping the two together would leave the matcher verifiable only through a
browser, which is the slowest and least repeatable way to check a string
comparison.

The cost is a second entry in the manifest `content_scripts` array, where
the order matters: `matcher.js` has to load first, because `content.js`
reads the global it defines.

## Test with node:test and Node's own coverage

`matcher.test.js` runs under `node:test` with
`--experimental-test-coverage`, gated at 90% of lines and branches in
`matcher.js`.

Choosing the runner built into Node keeps the repository free of
`node_modules`, a `package.json`, and a lockfile, which matters more here
than it would elsewhere: a reader installs this extension by cloning the
repository and pointing Chrome at the folder, so every file in it is
something they carry.

The cost is a rougher developer experience than Vitest offers, and a
coverage flag that Node still marks experimental. The gate covers
`matcher.js` only, since the rest of the extension has no automated test
by design.

## Keep the aerospace and staffing rows in the default blocklist

The default list keeps thales, safran, airbus, dassault, and ariane, and
it keeps capgemini, alten, and scalian.

Both rows remove roles that have nothing to do with defense, and they stay
because a job card does not say which part of the company it belongs to. A
reader who prefers a false positive over a false negative is the reader
this default is for, and deleting a row is one edit.

This closes the question of whether an employer whose defense work is a
minority of its business belongs on a list that removes all of its
listings. The answer is yes, for the default, and the reasons live in
[features/blocklist-filter.md](features/blocklist-filter.md).

## Match the promoted marker by text, not by class name

The promoted filter reads the visible label rather than the class name on
the element carrying it.

LinkedIn's class names are generated and change between deployments, while
the label is user-visible and changes only when the wording changes.

The cost is that the language list is incomplete by construction, so a
reader on an interface language the list does not cover sees promoted
cards. Adding a language means verifying the marker text in it.
