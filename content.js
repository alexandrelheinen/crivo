'use strict';

// Every selector the extension knows lives here. LinkedIn ships generated
// class names that change between deployments, so these hang off attributes
// named after the components that render them. See
// docs/architecture.md#selectors for what was read off a real page.
const LIST_CONTAINER = 'div[data-testid="lazy-column"]';
const CARD = 'div[data-testid="lazy-column"] > div[data-display-contents="true"]';
const CARD_TEXT = 'p';
const CARD_TITLE = 'a[href*="/jobs/view/"] p';

const { matchesPromoted, matchesBlocklist } = globalThis.crivoMatcher;

const textOf = (element) => (element ? element.textContent.trim() : '');

// The title is the first paragraph inside the job link and the company is
// the one after it. Neither carries an attribute of its own, so position is
// all there is to go on, and the capture that produced these selectors had
// its text scrubbed, which leaves the order unconfirmed until someone reads
// a live page.
function readCard(card) {
  const paragraphs = [...card.querySelectorAll(CARD_TITLE)];
  return {
    title: textOf(paragraphs[0]),
    company: textOf(paragraphs[1]),
  };
}

function shouldRemove(card) {
  const paragraphTexts = [...card.querySelectorAll(CARD_TEXT)].map(textOf);
  return matchesPromoted(paragraphTexts) || matchesBlocklist(readCard(card));
}

function filter(root) {
  const cards = root.matches && root.matches(CARD) ? [root] : [...root.querySelectorAll(CARD)];
  for (const card of cards) {
    if (card.isConnected && shouldRemove(card)) card.remove();
  }
}

// Reading addedNodes only is what keeps the observer from reacting to its
// own removals. LinkedIn also re-renders cards already on the page, so the
// same card arrives more than once and the isConnected check above absorbs
// the repeat.
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const added of mutation.addedNodes) {
      if (added.nodeType === Node.ELEMENT_NODE) filter(added);
    }
  }
});

function start() {
  const container = document.querySelector(LIST_CONTAINER);
  if (!container) return false;
  filter(container);
  observer.observe(container, { childList: true, subtree: true });
  return true;
}

// The list is rendered client side, so it is usually absent at
// document_end. Watching the body until it appears costs one observer and
// avoids polling.
if (!start()) {
  const waiting = new MutationObserver(() => {
    if (start()) waiting.disconnect();
  });
  waiting.observe(document.body, { childList: true, subtree: true });
}
