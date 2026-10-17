import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFormula, numericValues } from './formula.js';

const none = new Map<string, number>();

function value(formula: string, values = none) {
  const result = evaluateFormula(formula, values);
  assert.equal(result.ok, true, `expected "${formula}" to evaluate`);
  return result.ok ? result.value : NaN;
}

function fails(formula: string) {
  assert.equal(evaluateFormula(formula, none).ok, false, `expected "${formula}" to be rejected`);
}

test('follows operator precedence and brackets', () => {
  assert.equal(value('2 + 3 * 4'), 14);
  assert.equal(value('(2 + 3) * 4'), 20);
  assert.equal(value('10 - 4 - 3'), 3);
  assert.equal(value('7 % 4'), 3);
});

test('reads field references by label and treats missing ones as zero', () => {
  const values = new Map([['Quantity', 4], ['Unit price', 250]]);
  assert.equal(value('{{Quantity}} * {{Unit price}}', values), 1000);
  assert.equal(value('-{{Quantity}} + 10', values), 6);
  assert.equal(value('{{Not answered}} + 1', values), 1);
});

test('turns division by zero into zero', () => {
  assert.equal(value('10 / 0'), 0);
  assert.equal(value('7 % 0'), 0);
});

test('rejects anything outside the grammar', () => {
  fails('');
  fails('alert(1)');
  fails('2 + 3 4');
  fails('(1 + 2');
  fails('{{ }}');
  fails('{{Open');
  fails('1'.repeat(501));
});

test('extracts numbers from formatted answers', () => {
  const values = numericValues(
    [
      { id: 'price', label: 'Price', type: 'currency' },
      { id: 'blank', label: 'Blank', type: 'number' },
      { id: 'nolabel', label: ' ', type: 'number' },
    ],
    { price: '₹1,200.50', blank: '', nolabel: '5' }
  );
  assert.equal(values.get('Price'), 1200.5);
  assert.equal(values.has('Blank'), false);
  assert.equal(values.size, 1);
});

test('sums option values for choice answers', () => {
  const values = numericValues(
    [{ id: 'size', label: 'Size', type: 'checkbox' }],
    { size: 'Small, Large, Unknown' },
    { size: { Small: 10, Large: 500 } }
  );
  assert.equal(values.get('Size'), 510);
});
