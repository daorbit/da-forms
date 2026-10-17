import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FormField, OwnerRoute } from '../models/form.model.js';
import { evaluateCondition, matchesRule, routedOwnerEmails, shownFieldIds } from './conditions.js';

function fields(list: Partial<FormField>[]): FormField[] {
  return list.map((field) => ({ label: field.id, type: 'text', required: false, ...field })) as FormField[];
}

test('compares text answers after trimming', () => {
  assert.equal(matchesRule({ fieldId: 'q', operator: 'equals', value: 'Yes' }, ' Yes '), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'notEquals', value: 'Yes' }, 'No'), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'contains', value: 'ACME' }, 'Works at Acme Ltd'), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'notContains', value: 'acme' }, 'Globex'), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'isEmpty' }, '   '), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'isNotEmpty' }, undefined), false);
});

test('compares numbers inside formatted answers', () => {
  assert.equal(matchesRule({ fieldId: 'q', operator: 'greaterThan', value: '1000' }, '₹1,500'), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'lessThan', value: '10' }, '12'), false);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'greaterOrEqual', value: '5' }, '5'), true);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'lessOrEqual', value: '5' }, '6'), false);
  assert.equal(matchesRule({ fieldId: 'q', operator: 'greaterThan', value: '1' }, 'not a number'), false);
});

test('evaluates single rules and AND/OR groups', () => {
  const values = { plan: 'Pro', seats: '12' };
  assert.equal(evaluateCondition(undefined, values), true);
  assert.equal(evaluateCondition({ fieldId: 'plan', operator: 'equals', value: 'Pro' }, values), true);

  const rules = [
    { fieldId: 'plan', operator: 'equals' as const, value: 'Free' },
    { fieldId: 'seats', operator: 'greaterThan' as const, value: '10' },
  ];
  assert.equal(evaluateCondition({ match: 'all', rules }, values), false);
  assert.equal(evaluateCondition({ match: 'any', rules }, values), true);
  assert.equal(evaluateCondition({ match: 'all', rules: [] }, values), true);
});

test('hides fields whose condition depends on a hidden field', () => {
  const form = fields([
    { id: 'q1' },
    { id: 'q2', showIf: { fieldId: 'q1', operator: 'equals', value: 'yes' } },
    { id: 'q3', showIf: { fieldId: 'q2', operator: 'isNotEmpty' } },
  ]);
  assert.deepEqual([...shownFieldIds(form, { q1: 'no', q2: 'stale answer' })].sort(), ['q1']);
  assert.deepEqual([...shownFieldIds(form, { q1: 'yes', q2: 'answer' })].sort(), ['q1', 'q2', 'q3']);
});

test('a condition on a page break controls the step after it', () => {
  const form = fields([
    { id: 'a' },
    { id: 'break', type: 'pageBreak', showIf: { fieldId: 'a', operator: 'equals', value: 'go' } },
    { id: 'b' },
  ]);
  assert.equal(shownFieldIds(form, { a: 'go' }).has('b'), true);
  assert.equal(shownFieldIds(form, { a: 'stop' }).has('b'), false);
});

test('routes owner emails by answer', () => {
  const routes: OwnerRoute[] = [
    { id: 'r1', when: { match: 'all', rules: [{ fieldId: 'team', operator: 'equals', value: 'Sales' }] }, emails: ['sales@x.com'] },
    { id: 'r2', when: { match: 'all', rules: [{ fieldId: 'team', operator: 'equals', value: 'Support' }] }, emails: ['help@x.com'] },
    { id: 'r3', when: { match: 'all', rules: [] }, emails: ['never@x.com'] },
  ];
  assert.deepEqual(routedOwnerEmails(routes, { team: 'Sales' }), ['sales@x.com']);
  assert.deepEqual(routedOwnerEmails(undefined, { team: 'Sales' }), []);
});
