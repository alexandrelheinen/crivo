# Spec for the promoted filter

Status: draft

Removes job cards that LinkedIn marks as a paid placement. See
[../specification.md](../specification.md) for the constraints and design
notes shared with the blocklist filter.

## Intent

A promoted card is an advertisement wearing the layout of a search result.
It ranks because an employer paid for the slot rather than because it
matches the query, so it costs the reader attention without earning it.
LinkedIn labels these cards, and the label is the hook the filter uses.

## Scope

**In scope:**

- Job cards in search results that carry a paid placement marker.
- Matching the marker across the interface languages listed under
  acceptance criteria.

**Out of scope:**

- Sponsored content that is not a job card, and anything rendered on the
  feed.
- Distinguishing a promoted listing from an organic one by any signal
  other than the marker LinkedIn renders.

## Acceptance criteria

- `AC-PROMO-01`: When a job card carries a paid placement marker, the
  extension shall remove the card.
- `AC-PROMO-02`: When the interface language is English, Portuguese, or
  French, the extension shall recognize that language's marker text.
- `AC-PROMO-03`: When a job card carries no paid placement marker, the
  extension shall leave the card in place.
- `AC-PROMO-04`: When a job description contains a word matching the
  marker text in its body copy rather than in the marker element, the
  extension shall leave the card in place.

`AC-PROMO-04` is the criterion that decides how the marker is read. A
substring search over the whole card text matches a description mentioning
a promotion or a promoted role, and removes a legitimate listing. The
check has to be scoped to the element carrying the label.

## Traceability

| ID | Test |
|---|---|
| `AC-PROMO-01` | `matcher.test.js`, `it("matches a card whose marker reads promoted")` |
| `AC-PROMO-02` | `matcher.test.js`, `it("matches the marker in Portuguese and French")` |
| `AC-PROMO-03` | `matcher.test.js`, `it("leaves a card with an empty marker alone")` |
| `AC-PROMO-04` | `matcher.test.js`, `it("ignores marker words appearing in the description")` |

## Design notes

The marker text is localized, so the match is a set of per-language
strings compared case insensitively: `promoted`, `promovida`, `promovido`,
`sponsorisée`, `sponsorisé`. Accents are stripped before comparison so
that a card rendered without them still matches.

Only `promoted` has been read off a real page. The Portuguese and French
strings ship unverified, and [../decisions.md](../decisions.md) records why
that beats holding them back.

Matching on text rather than on a class name is a deliberate trade. The
class name is obfuscated and changes between deployments, while the label
is user-visible and changes only when LinkedIn changes its wording, which
is rarer. The cost is that the language list is incomplete by
construction, and a reader using an unlisted interface language sees
promoted cards until that language is added.

## Open questions

- Which additional interface languages to cover. Adding a language is
  cheap, and verifying the marker text in that language requires actually
  switching the interface, which is the part that costs something.

LinkedIn exposes no attribute that would identify the marker element, so
the question of using one as a first check is closed. A capture of the
English interface shows the marker sitting in a `p` element whose class
list is identical to the paragraphs holding the location and the posting
age. See [../architecture.md](../architecture.md#selectors).
