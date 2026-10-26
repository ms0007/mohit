const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const rootScript = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const publicScript = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function executeCalculator(calculator, values) {
  const outputs = new Map();
  const form = { dataset: { calculator }, addEventListener() {} };
  for (const [key, value] of Object.entries(values)) form[key] = { value: String(value) };
  const document = {
    querySelectorAll: () => [form],
    querySelector(selector) {
      const match = selector.match(/data-output='([^']+)'/);
      if (!match) throw new Error('Unexpected output selector: ' + selector);
      const key = match[1];
      if (!outputs.has(key)) outputs.set(key, { textContent: '' });
      return outputs.get(key);
    },
  };
  vm.runInNewContext(rootScript, { document, Intl, Math, Number }, { timeout: 1000 });
  return Object.fromEntries([...outputs].map(([key, element]) => [key, element.textContent]));
}

test('root and public calculator scripts stay in sync', () => {
  assert.equal(rootScript, publicScript);
});

test('zero-interest EMI returns principal divided evenly across the term', () => {
  const result = executeCalculator('emi', { principal: 12000, rate: 0, years: 1 });
  assert.match(result['emi-monthly'], /1,000/);
  assert.match(result['emi-total'], /12,000/);
  assert.match(result['emi-interest'], /0/);
});

test('compound interest uses the selected compounding frequency', () => {
  const result = executeCalculator('compound', { principal: 10000, rate: 10, years: 2, frequency: 4 });
  assert.match(result['compound-future'], /12,184/);
  assert.match(result['compound-interest'], /2,184/);
});

test('break-even calculator handles a positive contribution margin', () => {
  const result = executeCalculator('breakeven', { fixed: 1000, price: 120, variable: 70 });
  assert.equal(result['breakeven-units'], '20.0');
  assert.match(result['breakeven-revenue'], /2,400/);
});

test('ROI treats the return input as total proceeds and reports net profit', () => {
  const result = executeCalculator('roi', { cost: 1000, return: 1500 });
  assert.match(result['roi-percent'], /50/);
  assert.match(result['roi-profit'], /500/);
});

test('NPV discounts future cash flows and returns an investment decision', () => {
  const result = executeCalculator('npv', { investment: 1000, rate: 10, year1: 600, year2: 600, year3: 0 });
  assert.match(result['npv-value'], /41/);
  assert.equal(result['npv-decision'], 'Accept (value creating)');
});
