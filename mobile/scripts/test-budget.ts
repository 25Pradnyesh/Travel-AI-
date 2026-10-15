import { formatBudget, getCurrencySymbol } from '../lib/format/budget';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

console.log('Testing VAMO Budget Formatting Cases...\n');

// 1. Range test
const rangeEUR = formatBudget('$280 - $420', 'EUR');
assert(rangeEUR === '€280 \u2013 €420 / day', `Expected "€280 \u2013 €420 / day", got "${rangeEUR}"`);

const rangeEnDash = formatBudget('€280 \u2013 €420', 'EUR');
assert(rangeEnDash === '€280 \u2013 €420 / day', `Expected "€280 \u2013 €420 / day", got "${rangeEnDash}"`);

const rangeUSD = formatBudget('150 - 220', 'USD');
assert(rangeUSD === '$150 \u2013 $220 / day', `Expected "$150 \u2013 $220 / day", got "${rangeUSD}"`);

// 2. Equal values test
const equalValues = formatBudget('250 - 250', 'EUR');
assert(equalValues === '€250 / day', `Expected "€250 / day", got "${equalValues}"`);

const equalSingle = formatBudget(280, 'EUR');
assert(equalSingle === '€280 / day', `Expected "€280 / day", got "${equalSingle}"`);

// 3. Min-only test
const minOnlyFrom = formatBudget('from €150', 'EUR');
assert(minOnlyFrom === 'from €150 / day', `Expected "from €150 / day", got "${minOnlyFrom}"`);

const minOnlyPlus = formatBudget('200+', 'EUR');
assert(minOnlyPlus === 'from €200 / day', `Expected "from €200 / day", got "${minOnlyPlus}"`);

const minOnlyMin = formatBudget('min $180', 'USD');
assert(minOnlyMin === 'from $180 / day', `Expected "from $180 / day", got "${minOnlyMin}"`);

// 4. Max-only test
const maxOnlyUpTo = formatBudget('up to €350', 'EUR');
assert(maxOnlyUpTo === 'up to €350 / day', `Expected "up to €350 / day", got "${maxOnlyUpTo}"`);

const maxOnlyMax = formatBudget('max 400', 'EUR');
assert(maxOnlyMax === 'up to €400 / day', `Expected "up to €400 / day", got "${maxOnlyMax}"`);

// 5. Free admission test
const freeAdmission = formatBudget('Free admission ($0)', 'EUR');
assert(freeAdmission === 'Free admission', `Expected "Free admission", got "${freeAdmission}"`);

console.log('\nAll budget formatting tests passed successfully!');
