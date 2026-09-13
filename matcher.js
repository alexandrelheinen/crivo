'use strict';

// Edit these three lists to change what the extension removes. See
// docs/features/blocklist-filter.md for what each category costs, and add
// a reason there alongside any term added here.

const PROMOTED_MARKERS = ['promoted', 'promovida', 'promovido', 'sponsorisee', 'sponsorise'];

const BLOCKED_COMPANIES = [
  'lockheed',
  'raytheon',
  'rtx',
  'northrop grumman',
  'general dynamics',
  'l3harris',
  'huntington ingalls',
  'bae systems',
  'rheinmetall',
  'leonardo',
  'mbda',
  'kratos',
  'elbit',
  'rafael',
  'baykar',
  'general atomics',
  'anduril',
  'knds',
  'nexter',
  'naval group',
  'thales',
  'safran',
  'airbus',
  'dassault',
  'ariane',
  'palantir',
  'helsing',
  'total',
  'totalenergies',
  'capgemini',
  'alten',
  'scalian',
];

const BLOCKED_DOMAIN_TERMS = [
  'defense',
  'defence',
  'military',
  'weapons',
  'missile',
  'munitions',
  'ballistic',
  'warfare',
  'combat',
  'tactical',
  'surveillance',
  'reconnaissance',
  'armement',
  'militaire',
  'armee',
  'guerre',
];

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const escapeForPattern = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lookarounds rather than \b, because a term can hold a space and \b would
// then anchor on the wrong side of it.
const buildPattern = (terms) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${terms.map(escapeForPattern).join('|')})(?![\\p{L}\\p{N}])`,
    'u',
  );

const COMPANY_PATTERN = buildPattern(BLOCKED_COMPANIES);
const DOMAIN_PATTERN = buildPattern(BLOCKED_DOMAIN_TERMS);
const PROMOTED_SET = new Set(PROMOTED_MARKERS);

// Takes the text of each paragraph on the card rather than the card's whole
// text, and demands that a paragraph be the marker rather than contain it.
// A description mentioning a promoted role would otherwise remove a
// legitimate listing (AC-PROMO-04).
function matchesPromoted(paragraphTexts) {
  return paragraphTexts.some((text) => PROMOTED_SET.has(normalize(text)));
}

// Company terms read the company field and domain terms read the title,
// because a company name found in a description usually belongs to a
// competitor or to recruiter boilerplate (AC-BLOCK-03).
function matchesBlocklist(card) {
  return (
    COMPANY_PATTERN.test(normalize(card.company)) || DOMAIN_PATTERN.test(normalize(card.title))
  );
}

const crivoMatcher = { matchesPromoted, matchesBlocklist };

globalThis.crivoMatcher = crivoMatcher;

// Chrome loads this as a classic content script, where module is undefined,
// so it skips the assignment. Node picks it up when a test requires it.
if (typeof module !== 'undefined') {
  module.exports = crivoMatcher;
}
