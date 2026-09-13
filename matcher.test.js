'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { matchesPromoted, matchesBlocklist } = require('./matcher.js');

describe('matchesPromoted', () => {
  it('matches a card whose marker reads promoted [AC-PROMO-01]', () => {
    assert.equal(matchesPromoted(['Sao Paulo, Brazil', '2 weeks ago', 'Promoted']), true);
  });

  it('matches the marker in Portuguese and French [AC-PROMO-02]', () => {
    assert.equal(matchesPromoted(['Promovida']), true);
    assert.equal(matchesPromoted(['Promovido']), true);
    assert.equal(matchesPromoted(['Sponsorisee']), true);
  });

  it('matches the marker whatever its casing or surrounding space [AC-PROMO-02]', () => {
    assert.equal(matchesPromoted(['  PROMOTED  ']), true);
  });

  it('leaves a card with no marker paragraph alone [AC-PROMO-03]', () => {
    assert.equal(matchesPromoted(['Sao Paulo, Brazil', '2 weeks ago']), false);
    assert.equal(matchesPromoted([]), false);
  });

  it('ignores marker words appearing inside a longer paragraph [AC-PROMO-04]', () => {
    assert.equal(matchesPromoted(['Promoted role at a growing team']), false);
    assert.equal(matchesPromoted(['Promotion Manager']), false);
  });
});

describe('matchesBlocklist', () => {
  it('matches a blocked company name [AC-BLOCK-01]', () => {
    assert.equal(matchesBlocklist({ title: 'Payroll Analyst', company: 'Rheinmetall' }), true);
  });

  it('matches a blocked company name sitting in a longer company field [AC-BLOCK-01]', () => {
    assert.equal(matchesBlocklist({ title: 'Accountant', company: 'BAE Systems plc' }), true);
  });

  it('matches a multiple word company name [AC-BLOCK-01]', () => {
    assert.equal(matchesBlocklist({ title: 'Welder', company: 'Naval Group' }), true);
  });

  it('matches a domain term in the title [AC-BLOCK-02]', () => {
    assert.equal(matchesBlocklist({ title: 'Defense Systems Engineer', company: 'ACME' }), true);
    assert.equal(matchesBlocklist({ title: 'Surveillance Analyst', company: 'ACME' }), true);
  });

  it('leaves an unrelated card alone [AC-BLOCK-02]', () => {
    assert.equal(matchesBlocklist({ title: 'Frontend Developer', company: 'ACME' }), false);
  });

  it('leaves total compensation and NVIDIA RTX alone [AC-BLOCK-03]', () => {
    assert.equal(
      matchesBlocklist({ title: 'Engineer, total compensation up to 90k', company: 'ACME' }),
      false,
    );
    assert.equal(
      matchesBlocklist({ title: 'ML Engineer, NVIDIA RTX cluster', company: 'ACME' }),
      false,
    );
  });

  it('leaves a term embedded in a longer word alone [AC-BLOCK-03]', () => {
    assert.equal(matchesBlocklist({ title: 'Subtotal Reconciliation Clerk', company: 'ACME' }), false);
    assert.equal(matchesBlocklist({ title: 'Combatting Fraud Lead', company: 'ACME' }), false);
  });

  it('does not match a company term found only in the title [AC-BLOCK-03]', () => {
    assert.equal(
      matchesBlocklist({ title: 'Consultant, ex Capgemini welcome', company: 'ACME' }),
      false,
    );
  });

  it('does not match a domain term found only in the company [AC-BLOCK-03]', () => {
    assert.equal(matchesBlocklist({ title: 'Recruiter', company: 'Combat Sports Gym' }), false);
  });

  it('matches regardless of accents on either side [AC-BLOCK-04]', () => {
    assert.equal(matchesBlocklist({ title: 'Ingenieur', company: 'Thalès' }), true);
    assert.equal(matchesBlocklist({ title: 'Ingenieur défense', company: 'ACME' }), true);
    assert.equal(matchesBlocklist({ title: 'Ingenieur armee', company: 'ACME' }), true);
  });

  it('tolerates a card with a missing field [AC-BLOCK-02]', () => {
    assert.equal(matchesBlocklist({ title: '', company: '' }), false);
    assert.equal(matchesBlocklist({}), false);
  });
});
