import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attributionFrom } from './attribution.js';

const FORM = 'https://forms.example.com/form/abc/view';

function touch(value: Record<string, unknown>) {
  return attributionFrom(JSON.stringify(value));
}

test('uses UTM tags and marks paid mediums as ads', () => {
  const page = `${FORM}?utm_source=instagram&utm_medium=paid_social&utm_campaign=diwali`;
  const result = touch({ page, formUrl: page });
  assert.equal(result?.channel, 'Instagram Ads');
  assert.equal(result?.paid, true);
  assert.equal(result?.campaign, 'diwali');
  assert.equal(result?.landingUrl, page);
});

test('recognises ad click ids without tags', () => {
  const page = `${FORM}?gclid=abc123`;
  assert.equal(touch({ page, formUrl: page })?.channel, 'Google Ads');
});

test('falls back to the referring site', () => {
  assert.equal(touch({ page: FORM, formUrl: FORM, referrer: 'https://www.google.com/' })?.channel, 'Google');
  assert.equal(touch({ page: FORM, formUrl: FORM, referrer: 'https://mail.google.com/' })?.channel, 'Email');
  assert.equal(touch({ page: FORM, formUrl: FORM, referrer: 'https://blog.partner.io/post' })?.channel, 'blog.partner.io');
});

test('treats internal navigation and no referrer as direct', () => {
  assert.equal(touch({ page: FORM, formUrl: FORM, referrer: 'https://forms.example.com/other' })?.channel, 'Direct');
  assert.equal(touch({ page: FORM, formUrl: FORM })?.channel, 'Direct');
});

test('reads the host page for embedded forms', () => {
  const result = touch({
    page: 'https://shop.example.com/contact?utm_source=newsletter',
    referrer: 'https://shop.example.com/',
    formUrl: FORM,
  });
  assert.equal(result?.channel, 'Email');
  assert.equal(result?.referrer, undefined);
});

test('keeps unknown sources readable', () => {
  const page = `${FORM}?utm_source=partnerblog`;
  assert.equal(touch({ page, formUrl: page })?.channel, 'Partnerblog');
});

test('flags old embed codes', () => {
  assert.equal(touch({ page: 'https://shop.example.com/', formUrl: FORM, legacyEmbed: true })?.legacyEmbed, true);
  assert.equal(touch({ page: FORM, formUrl: FORM })?.legacyEmbed, undefined);
});

test('ignores malformed input', () => {
  assert.equal(attributionFrom('not json'), undefined);
  assert.equal(attributionFrom(42), undefined);
  assert.equal(touch({ page: 'javascript:alert(1)', formUrl: 'ftp://x' })?.landingUrl, undefined);
});
