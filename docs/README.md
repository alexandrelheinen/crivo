# Docs

| Document | Contents |
|---|---|
| [specification.md](specification.md) | Intent, scope, and the acceptance criteria that cover the extension as a whole |
| [architecture.md](architecture.md) | Manifest V3 structure, the matcher and reader split, DOM observation, failure modes |
| [decisions.md](decisions.md) | Decisions that set or changed a constraint, with the cost each one accepts |
| [features/promoted-filter.md](features/promoted-filter.md) | Removing paid placements, and how the marker is matched across languages |
| [features/blocklist-filter.md](features/blocklist-filter.md) | The term list, what each category costs in false positives, and how matching works |

A new feature gets a `features/<feature>.md` with intent, scope, and
numbered acceptance criteria before implementation starts, following
[.guidelines/workflow/sdd.md](../.guidelines/workflow/sdd.md).
