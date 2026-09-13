# Spec for the blocklist filter

Status: draft

Removes job cards matching a configured set of terms. See
[../specification.md](../specification.md) for the constraints and design
notes shared with the promoted filter.

## Intent

A reader who will not work on weapons, surveillance, or fossil fuel
extraction still has to read every listing from those employers to skip
it. The filter encodes that decision once so the page arrives already
filtered.

The list is a judgment about employers rather than a fact about them, and
the extension does not pretend otherwise. Recording why a term is on the
list is what makes the list reviewable, which is why every entry carries a
category and a reason.

## Scope

**In scope:**

- Matching against the job title, the company name, and the card
  description that LinkedIn renders on the card.
- A default list covering arms manufacturers, military contractors,
  surveillance vendors, and fossil fuel extractors with a European
  presence.
- Editing the list by editing one file and reloading the extension.

**Out of scope:**

- Matching against the full job description, which the card does not
  carry and which would require opening every listing.
- Any per-category toggle, any settings page, and any synchronized
  configuration.
- Deciding whether a given employer belongs on the list. That decision is
  the reader's, and the default list is a starting point they own once
  they install the extension.

## Acceptance criteria

- `AC-BLOCK-01`: When a job card's company name matches a company term,
  the extension shall remove the card.
- `AC-BLOCK-02`: When a job card's title matches a domain term, the
  extension shall remove the card.
- `AC-BLOCK-03`: When a term appears inside a longer word, the extension
  shall not treat that as a match.
- `AC-BLOCK-04`: When a term or a card's text carries accents, the
  extension shall match regardless of the accents on either side.
- `AC-BLOCK-05`: When the reader edits the list and reloads the extension,
  the new list shall take effect with no other step.

`AC-BLOCK-03` is the criterion the naive implementation fails. A plain
substring search for `total` matches "total rewards" and "total
compensation", which appear in ordinary listings, and a search for `rtx`
matches any card mentioning an NVIDIA RTX card. Matching on word
boundaries is what separates the filter from a keyword sledgehammer.

## Traceability

| ID | Test |
|---|---|
| `AC-BLOCK-01` | `matcher.test.js`, `it("matches a blocked company name")` |
| `AC-BLOCK-02` | `matcher.test.js`, `it("matches a domain term in the title")` |
| `AC-BLOCK-03` | `matcher.test.js`, `it("leaves total compensation and NVIDIA RTX alone")` |
| `AC-BLOCK-04` | `matcher.test.js`, `it("matches regardless of accents on either side")` |
| `AC-BLOCK-05` | Manual: edit the list, reload from `chrome://extensions/`, reload a job search |

## The list

Two kinds of term, matched against different fields, because they fail
differently.

**Company terms** name an organization and match against the company
field only. Matching a company name against a description removes every
card that mentions the company, including a competitor's listing and a
recruiter's boilerplate.

**Domain terms** name the work rather than the employer and match against
the title. A defense role at an otherwise unlisted employer is what these
catch.

| Category | Terms | Reason |
|---|---|---|
| Arms and defense manufacturing | lockheed, raytheon, rtx, northrop grumman, general dynamics, l3harris, huntington ingalls, bae systems, rheinmetall, leonardo, mbda, kratos, elbit, rafael, baykar, general atomics, anduril, knds, nexter, naval group | Builds weapons systems as a primary line of business |
| Aerospace with a defense line | thales, safran, airbus, dassault, ariane | Builds both civil and military systems, and the card rarely says which |
| Defense software and surveillance | palantir, helsing | Sells targeting, intelligence, or surveillance software |
| Fossil fuel extraction | total, totalenergies | Extracts and sells fossil fuels as a primary line of business |
| Defense contracting and staffing | capgemini, alten, scalian | Staffs engineers into defense programs through service contracts |
| Domain terms | defense, defence, military, weapons, missile, munitions, ballistic, warfare, combat, tactical, surveillance, reconnaissance, armement, militaire, armee, guerre | Names the work directly in a job title |

Three entries carry a cost worth stating rather than burying.

The **aerospace** row removes civil aviation roles, because Airbus builds
airliners and Safran builds their engines, and a card reading "Structural
Engineer, Airbus" does not say which side of the company it belongs to.
Anyone who wants those roles removes the row.

The **contracting and staffing** row is the loosest of the list. Capgemini,
Alten, and Scalian each run large practices that have nothing to do with
defense, so blocking the name hides far more roles than it targets. The row
is on the list because a service contractor rarely names the end client on
the card, which makes the roles impossible to tell apart from the outside.

`total` as a **fossil fuel** term is the entry most likely to misfire,
since it is an ordinary English word that appears in compensation
boilerplate. `AC-BLOCK-03` exists for it.

## Design notes

Compile the terms into one pattern per field at load rather than testing
each term per card, since the filter runs on every mutation of a list that
grows as the reader scrolls.

Normalize both the term and the card text the same way before matching:
lowercase, then strip accents. Doing it on one side only is the bug this
note exists to prevent.

Word boundaries have to account for terms holding a space, where a plain
`\b` on each end is not enough for a two-word company name sitting next to
punctuation.

## Open questions

- Whether the list should split into categories a reader enables
  separately. It would make the aerospace and staffing rows opt-in instead
  of forcing a reader to delete them, and it needs somewhere to store the
  choice, which the extension currently has no permission to do.
- Whether matching domain terms against the description as well as the
  title is worth the false positives. A description mentioning defense
  once is weaker evidence than a title, and the card's description is
  truncated anyway.

Whether an employer whose defense work is a minority of its business
belongs on a list that removes all of its listings is settled for the
default, in [../decisions.md](../decisions.md). Reopening it means editing
that entry rather than this list.
