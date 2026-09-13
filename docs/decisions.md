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

## Match the promoted marker by text, not by class name

The promoted filter reads the visible label rather than the class name on
the element carrying it.

LinkedIn's class names are generated and change between deployments, while
the label is user-visible and changes only when the wording changes.

The cost is that the language list is incomplete by construction, so a
reader on an interface language the list does not cover sees promoted
cards. Adding a language means verifying the marker text in it.
