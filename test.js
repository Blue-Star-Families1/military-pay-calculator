#!/usr/bin/env node
/*
 * Regression suite for the Military Take-Home Pay Estimator.
 *
 *   node test.js
 *
 * No dependencies. Loads bah-data.js + the inline script from index.html into a
 * stubbed DOM, then asserts behaviour. Run this after ANY change to index.html
 * or bah-data.js — especially the yearly rate update (see NOTES.md).
 *
 * Exit code 0 = all passed, 1 = failures.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const bahSrc = fs.readFileSync(path.join(DIR, 'bah-data.js'), 'utf8');

// ---------------------------------------------------------------- harness ---
const IDS = ['grade','yos','filing','tsp','tsptype','sgli','other','deps','combat',
  'bahA','bahB','stateA','stateB','labelA','labelB','compareOn','stationA','stationB',
  'exemptA','exemptB','stateNoteA','stateNoteB','results','diffBox','specials',
  'sources','printBtn','shareBtn','scnB','srStatus'];
const SPKEYS = ['seapay','flight','hfp','hdip','jump','halo','dive','sub','hardship',
  'sdap','fsa','custom'];
const CHECKBOXES = ['combat','compareOn','exemptA','exemptB'];

function appScript() {
  const start = html.indexOf('<script>', html.indexOf('bah-data.js')) + 8;
  return html.slice(start, html.lastIndexOf('</script>'));
}

/** Boot the app in a stubbed DOM. dataSrc defaults to the real bah-data.js. */
function boot(opts) {
  opts = opts || {};
  const dataSrc = opts.dataSrc !== undefined ? opts.dataSrc : bahSrc;
  const store = {}, writes = {}, opted = {}, handlers = {};
  let replaceThrew = false;

  function mk(id) {
    if (!store[id]) store[id] = {
      id, value: '', checked: false, disabled: false,
      type: (id.startsWith('sp_') || CHECKBOXES.includes(id)) ? 'checkbox' : 'text',
      options: [{ textContent: '— choose to auto-fill BAH —' }],
      style: {}, classList: { toggle() {} },
      addEventListener(ev, cb) { (handlers[id] = handlers[id] || []).push(cb); },
      appendChild(o) { (opted[id] = opted[id] || []).push(o.value); },
      setAttribute() {}, select() {}, setSelectionRange() {},
      set innerHTML(v) { writes[id] = v; }, get innerHTML() { return writes[id] || ''; },
      set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; }
    };
    return store[id];
  }

  global.location = opts.location ||
    { search: opts.query || '', protocol: 'https:', origin: 'https://x.io',
      pathname: '/p/', href: 'https://x.io/p/' };
  global.history = { replaceState() { if (opts.replaceThrows) { replaceThrew = true; throw new Error('SecurityError'); } } };
  // Node >= 21 exposes a getter-only global `navigator`; redefine it.
  Object.defineProperty(global, 'navigator',
    { value: opts.navigator || {}, configurable: true, writable: true });
  global.window = { isSecureContext: opts.secure !== false };
  global.setTimeout = (fn) => { try { fn(); } catch (e) {} return 1; };
  global.clearTimeout = () => {};
  const everything = () => {
    const l = IDS.map(mk);
    SPKEYS.forEach(k => { l.push(mk('sp_' + k)); l.push(mk('spamt_' + k)); });
    return l;
  };
  global.document = {
    getElementById: mk,
    createElement: () => ({ style: {}, value: '', setAttribute() {}, select() {},
      setSelectionRange() {}, set innerHTML(v) {}, appendChild() {} }),
    body: { appendChild() {}, removeChild() {} },
    execCommand: () => opts.execOk !== false,
    querySelectorAll: () => ({ forEach: f => everything().forEach(f) })
  };

  IDS.forEach(mk);
  SPKEYS.forEach(k => { mk('sp_' + k); mk('spamt_' + k).value = '0'; });
  // sensible defaults matching the HTML
  const d = { grade: 'E-5', yos: '4', filing: 'single', tsp: '5', tsptype: 'trad',
    sgli: '31', other: '0', deps: 'yes', bahA: '1800', bahB: '3300',
    stateA: 'NC', stateB: 'CA' };
  Object.keys(d).forEach(k => { mk(k).value = d[k]; });
  mk('compareOn').checked = true;

  let error = null, api = null;
  // Data globals may not exist at all when testing a missing/blank data file,
  // so export them defensively.
  const exports_ = '\n;return {calculate,calcScenario,basicPay,bahLookup,num,esc,' +
    'collectState,applyState,stateNote,stateTaxAnnual,fedTaxOnAnnual,money,' +
    'STATES,SPECIALS,PAY,BRACKETS,STD_DED,BAH_COL,' +
    'PAY_CAP,CZTE_CAP,BAS_ENL,BAS_OFF,SS_WAGE_BASE,YOS_LABELS,' +
    'BAH_W:(typeof BAH_W!=="undefined"?BAH_W:null),' +
    'BAH_WO:(typeof BAH_WO!=="undefined"?BAH_WO:null),' +
    'MHA_NAMES:(typeof MHA_NAMES!=="undefined"?MHA_NAMES:null)};';
  try { api = new Function(dataSrc + '\n' + appScript() + exports_)(); }
  catch (e) { error = e.message; }

  return { api, error, el: mk, store, writes, opted, handlers,
    fire: id => (handlers[id] || []).forEach(cb => cb()),
    replaceThrew: () => replaceThrew };
}

// ------------------------------------------------------------- assertions ---
let passed = 0, failed = 0, group = '';
const G = g => { group = g; console.log('\n' + g); };
function ok(name, cond) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL  ' + name); }
}
function eq(name, got, want, tol) {
  tol = tol === undefined ? 0.6 : tol;
  const good = Number.isFinite(got) && Math.abs(got - want) <= tol;
  if (good) { passed++; }
  else { failed++; console.log('  FAIL  ' + name + '  got ' + got + '  want ' + want); }
}

// ------------------------------------------------------------------ tests ---
const app = boot();
if (app.error) { console.error('FATAL: app failed to boot -> ' + app.error); process.exit(1); }
const A = app.api;
const { calcScenario, basicPay, bahLookup, STATES, SPECIALS, BAH_W, BAH_WO,
        BAH_COL, MHA_NAMES, PAY, BRACKETS, STD_DED, PAY_CAP, CZTE_CAP,
        BAS_ENL, BAS_OFF, SS_WAGE_BASE, YOS_LABELS } = A;

const set = (id, v) => { app.el(id).value = String(v); };
const chk = (id, b) => { app.el(id).checked = b; };
function baseline() {
  set('grade','E-5'); set('yos','4'); set('filing','single'); set('tsp','5');
  set('tsptype','trad'); set('sgli','31'); set('other','0'); set('deps','yes');
  chk('combat', false);
  SPECIALS.forEach(s => { chk('sp_' + s[0], false); set('spamt_' + s[0], '0'); });
}
const exemptDefault = c => !!(STATES[c].none || STATES[c].exemptDefault);

G('Golden case (E-5, 6yr, single, NC, BAH 1800, 5% traditional TSP, SGLI $31)');
baseline();
let r = calcScenario(1800, 'NC', false);
eq('gross', r.gross, 6386.95);
eq('federal tax', r.fedTax, 286.87);
eq('social security', r.ss, 254.82);
eq('medicare', r.medi, 59.60);
eq('NC state tax', r.stateTax, 113.40);
eq('TSP', r.tspAmt, 205.50);
eq('take-home', r.takeHome, 5435.76, 1);
ok('take-home identity', Math.abs(r.takeHome -
  (r.gross - (r.fedTax + r.ss + r.medi + r.stateTax + r.tspAmt + r.sgli + r.other))) < 0.01);
ok('effective-rate identity', Math.abs(r.effRate -
  (r.fedTax + r.ss + r.medi + r.stateTax) / r.gross) < 1e-9);

G('2026 constants');
eq('BAS enlisted', BAS_ENL, 476.95, 0);
eq('BAS officer', BAS_OFF, 328.48, 0);
eq('SS wage base', SS_WAGE_BASE, 184500, 0);
eq('standard deduction single', STD_DED.single, 16100, 0);
eq('standard deduction MFJ', STD_DED.mfj, 32200, 0);
eq('standard deduction HoH', STD_DED.hoh, 24150, 0);
eq('Exec Schedule Level II cap', PAY_CAP['O-10'], 18808.20, 0);
eq('Exec Schedule Level V cap', PAY_CAP['O-6'], 15258.30, 0);
eq('CZTE officer cap', CZTE_CAP, 10954, 0);
ok('7 federal brackets per status',
  ['single','mfj','hoh'].every(f => BRACKETS[f].length === 7));
ok('brackets strictly increasing', Object.values(BRACKETS).every(br => {
  for (let i = 1; i < br.length; i++) if (br[i][0] <= br[i-1][0] || br[i][1] <= br[i-1][1]) return false;
  return true;
}));

G('Basic pay table');
eq('E-1 <2yr', basicPay('E-1', 0), 2407, 0);
eq('E-5 6yr', basicPay('E-5', 4), 4110, 0);
eq('O-3 6yr', basicPay('O-3', 4), 7737, 0);
eq('E-8 below minimum YOS falls back', basicPay('E-8', 0), 5657, 0);
eq('W-5 below minimum YOS falls back', basicPay('W-5', 0), 10170, 0);
eq('O-10 capped', basicPay('O-10', 10), 18808.20, 0);
eq('O-6 capped at high YOS', basicPay('O-6', 17), 15258.30, 0);
eq('O-6 uncapped at low YOS', basicPay('O-6', 0), 8751, 0);
ok('27 pay grades', Object.keys(PAY).length === 27);
ok('all rows have 18 YOS columns', Object.values(PAY).every(a => a.length === 18));
ok('YOS labels match columns', YOS_LABELS.length === 18);
(() => {
  let zero = 0, backwards = 0;
  Object.keys(PAY).forEach(g => {
    let prev = 0;
    for (let i = 0; i < 18; i++) { const p = basicPay(g, i);
      if (!(p > 0)) zero++; if (p < prev - 0.001) backwards++; prev = p; }
  });
  ok('no zero/negative pay cells', zero === 0);
  ok('pay never decreases with service', backwards === 0);
})();

G('BAH data integrity and lookup');
ok('MHA names present', Object.keys(MHA_NAMES).length > 300);
ok('with-dependent table present', Object.keys(BAH_W).length > 300);
ok('rate tables same size', Object.keys(BAH_W).length === Object.keys(BAH_WO).length);
ok('every row has 27 grade columns',
  Object.values(BAH_W).every(a => Array.isArray(a) && a.length === 27) &&
  Object.values(BAH_WO).every(a => Array.isArray(a) && a.length === 27));
ok('all rates positive and finite',
  Object.values(BAH_W).every(a => a.every(v => Number.isFinite(v) && v > 0)));
ok('with-dependents >= without-dependents everywhere',
  Object.keys(BAH_W).every(m => !BAH_WO[m] || BAH_W[m].every((v, i) => v >= BAH_WO[m][i])));
(() => {
  let wrong = 0;
  Object.keys(BAH_W).forEach(m => {
    Object.keys(BAH_COL).forEach(g => {
      set('grade', g);
      set('deps', 'yes'); if (bahLookup(m) !== BAH_W[m][BAH_COL[g]]) wrong++;
      set('deps', 'no');  if (bahLookup(m) !== BAH_WO[m][BAH_COL[g]]) wrong++;
    });
  });
  ok('lookup exact for every area x grade x dependent state', wrong === 0);
})();
ok('unknown area returns null', bahLookup('ZZZZZ') === null);
ok('empty area returns null', bahLookup('') === null);
ok('unmapped placeholder excluded from dropdown', !(app.opted['stationA'] || []).includes('XX499'));

G('Taxes: FICA, combat zone, TSP');
baseline(); set('grade','O-10'); set('yos','20'); set('filing','single');
ok('social security capped at wage base',
  calcScenario(3000,'TX',true).ss <= (SS_WAGE_BASE/12)*0.062 + 0.01);
ok('Additional Medicare applies over threshold (single)',
  calcScenario(3000,'TX',true).medi > basicPay('O-10',20)*0.0145 + 0.01);
baseline(); set('grade','O-10'); set('yos','20'); set('filing','mfj');
ok('Additional Medicare not applied below MFJ threshold',
  Math.abs(calcScenario(3000,'TX',true).medi - basicPay('O-10',20)*0.0145) < 0.01);
baseline(); chk('combat', true);
ok('combat zone: enlisted federal tax = 0', calcScenario(1800,'VA',false).fedTax === 0);
ok('combat zone: FICA still charged', calcScenario(1800,'VA',false).ss > 0);
baseline(); set('grade','W-4'); set('yos','12'); chk('combat', true);
ok('combat zone: warrant officer federal tax = 0', calcScenario(1800,'VA',false).fedTax === 0);
(() => {
  baseline(); set('grade','O-8'); set('yos','17'); chk('combat', true);
  const inZone = calcScenario(2000,'VA',false).fedTax;
  baseline(); set('grade','O-8'); set('yos','17');
  const home = calcScenario(2000,'VA',false).fedTax;
  ok('combat zone: senior officer capped, still owes some', inZone > 0);
  ok('combat zone: senior officer pays less than at home', inZone < home);
})();
(() => {
  baseline(); set('tsptype','trad'); const trad = calcScenario(2000,'VA',false);
  baseline(); set('tsptype','roth'); const roth = calcScenario(2000,'VA',false);
  ok('traditional TSP lowers taxable income', trad.fedTax < roth.fedTax);
  ok('both TSP types deduct from take-home', Math.abs(trad.tspAmt - roth.tspAmt) < 0.01);
})();

G('State tax engine (all 51 jurisdictions)');
(() => {
  const issues = [];
  Object.keys(STATES).forEach(c => {
    const s = STATES[c];
    if (!s.name) issues.push(c + ' has no name');
    if (s.none) { if (s.b || s.flat != null) issues.push(c + ' no-tax state has rates'); return; }
    if (!s.b && s.flat == null) issues.push(c + ' has neither brackets nor a flat rate');
    if (s.b) ['single','mfj'].forEach(f => {
      const br = s.b[f];
      if (!br || !br.length) return issues.push(c + ' missing ' + f + ' brackets');
      if (br[0][0] !== 0) issues.push(c + ' ' + f + ' first threshold is not 0');
      for (let i = 1; i < br.length; i++) {
        if (br[i][0] <= br[i-1][0]) issues.push(c + ' ' + f + ' thresholds not increasing');
        if (br[i][1] < br[i-1][1]) issues.push(c + ' ' + f + ' rates decrease');
      }
      br.forEach(b => { if (b[1] < 0 || b[1] > 0.15) issues.push(c + ' implausible rate ' + b[1]); });
    });
    if (s.flat != null && (s.flat <= 0 || s.flat > 0.15)) issues.push(c + ' implausible flat rate');
  });
  ok('state table structurally sound', issues.length === 0);
  if (issues.length) issues.slice(0, 8).forEach(i => console.log('        - ' + i));
})();
(() => {
  let bad = 0;
  Object.keys(STATES).forEach(c => ['single','mfj'].forEach(f => {
    let prev = -1;
    for (let inc = 0; inc <= 400000; inc += 5000) {
      const t = A.stateTaxAnnual(c, inc, f, 0);
      if (!Number.isFinite(t) || t < 0 || t < prev - 0.01) { bad++; break; }
      prev = t;
    }
  }));
  ok('state tax never decreases as income rises', bad === 0);
})();
ok('zero income -> zero state tax',
  Object.keys(STATES).every(c => A.stateTaxAnnual(c, 0, 'single', 0) === 0));
['AZ','AR','IL','IN','IA','KY','MI','MN','MO','MT','NM','ND','OK'].forEach(c => {
  baseline(); ok('exempt state ' + c + ' -> $0', calcScenario(2000, c, exemptDefault(c)).stateTax === 0);
});
['AK','FL','NV','NH','SD','TN','TX','WA','WY'].forEach(c => {
  baseline(); ok('no-income-tax state ' + c + ' -> $0', calcScenario(2000, c, exemptDefault(c)).stateTax === 0);
});
['AL','KS','LA','NE','NJ','WV','WI','CA','CT','ID','ME','NY','OH','OR','PA','VT','VA','MD','DC'].forEach(c => {
  baseline(); set('grade','O-3'); set('yos','6');
  ok('taxing state ' + c + ' -> > $0', calcScenario(2500, c, false).stateTax > 0);
});
baseline(); ok('exempt checkbox overrides to $0', calcScenario(2500,'CA',true).stateTax === 0);

G('Special and incentive pays');
(() => {
  let bad = 0;
  SPECIALS.forEach(s => {
    const key = s[0], taxable = s[3];
    baseline(); const before = calcScenario(1800,'TX',true);
    baseline(); chk('sp_' + key, true); set('spamt_' + key, '500');
    const after = calcScenario(1800,'TX',true);
    if (Math.abs((after.gross - before.gross) - 500) > 0.01) bad++;
    if (taxable && !(after.fedTax > before.fedTax)) bad++;
    if (!taxable && Math.abs(after.fedTax - before.fedTax) > 0.01) bad++;
  });
  ok('all ' + SPECIALS.length + ' special pays behave correctly', bad === 0);
})();

G('Input hardening');
baseline(); set('other','1,500');   eq('"1,500" parses to 1500', calcScenario(1800,'NC',false).other, 1500);
baseline(); set('other','$200');    eq('"$200" parses to 200',   calcScenario(1800,'NC',false).other, 200);
baseline(); set('other','1,234,567'); eq('"1,234,567" parses',   calcScenario(1800,'NC',false).other, 1234567);
baseline(); set('other','1500,50'); eq('European "1500,50"',     calcScenario(1800,'NC',false).other, 1500.5);
baseline(); set('other','abc');     eq('junk text -> 0',         calcScenario(1800,'NC',false).other, 0);
baseline(); set('other','-999');    eq('negative deduction clamped to 0', calcScenario(1800,'NC',false).other, 0);
baseline(); set('tsp','-50');       eq('negative TSP clamped',   calcScenario(1800,'NC',false).tspAmt, 0);
baseline(); set('tsp','99999');
(() => { const x = calcScenario(1800,'NC',false); eq('TSP clamped to 100%', x.tspAmt, x.base); })();
baseline(); ok('negative BAH clamped', calcScenario(-5000,'NC',false).bah === 0);
baseline(); ok('NaN BAH clamped', calcScenario(NaN,'NC',false).bah === 0);
baseline(); set('filing','bogus');
ok('unknown filing status does not crash', Number.isFinite(calcScenario(1800,'NC',false).takeHome));
baseline(); set('yos','999');
ok('out-of-range YOS does not crash', Number.isFinite(calcScenario(1800,'NC',false).takeHome));
baseline(); set('grade','ZZ-9');
ok('unknown grade does not crash', Number.isFinite(calcScenario(1800,'NC',false).takeHome));

G('Cross-product sweep');
(() => {
  let invalid = 0, n = 0;
  ['E-1','E-5','E-9','W-5','O-1','O-6','O-10'].forEach(g =>
    Object.keys(STATES).forEach(c =>
      ['single','mfj','hoh'].forEach(f => {
        baseline(); set('grade', g); set('yos','12'); set('filing', f);
        const x = calcScenario(2200, c, exemptDefault(c)); n++;
        if (!Number.isFinite(x.takeHome) || x.stateTax < 0 || x.fedTax < 0 ||
            x.medi < 0 || x.ss < 0 || x.effRate < 0 || x.effRate >= 1) invalid++;
      })));
  ok(n + ' grade x state x filing combinations all valid', invalid === 0);
})();

G('Security: output escaping');
ok('esc neutralises angle brackets', A.esc('<b>') === '&lt;b&gt;');
ok('esc neutralises quotes', !/["']/.test(A.esc('"\'')));
(() => {
  const b = boot();
  b.el('labelA').value = '<img src=x onerror=alert(1)>';
  b.api.calculate();
  const out = b.writes['results'] || '';
  ok('injected tag not rendered raw', out.indexOf('<img') === -1);
  ok('injected payload is escaped', out.indexOf('&lt;img') !== -1);
})();
(() => {
  const b = boot();
  b.el('labelB').value = '"><script>alert(1)</script>';
  b.api.calculate();
  const out = b.writes['results'] || '';
  ok('no script tag injected', out.indexOf('<script>') === -1);
})();

G('Share link');
(() => {
  const a = boot();
  a.el('stationA').value = 'CA038'; a.el('bahA').value = '3975';
  a.el('grade').value = 'O-3'; a.el('deps').value = 'no';
  a.el('tsp').value = '12'; a.el('labelA').value = 'San Diego';
  const qs = a.api.collectState();
  const b = boot({ query: '?' + qs });
  ok('station restored', b.el('stationA').value === 'CA038');
  ok('BAH restored', b.el('bahA').value === '3975');
  ok('grade restored', b.el('grade').value === 'O-3');
  ok('dependents restored', b.el('deps').value === 'no');
  ok('TSP restored', b.el('tsp').value === '12');
  ok('label restored', b.el('labelA').value === 'San Diego');
  ok('results render from a shared link', (b.writes['results'] || '').length > 200);
})();
(() => {
  const b = boot({ query: '?filing=evil&tsp=-99&yos=abc&grade=ZZ&other=-500&bahA=-1' });
  ok('tampered link does not crash', !b.error);
  ok('tampered link still renders', (b.writes['results'] || '').length > 150);
})();
(() => {
  const good = boot({ navigator: { clipboard: { writeText: () => Promise.resolve() } } });
  good.fire('shareBtn');
  const bad = boot({ navigator: {}, secure: false, execOk: false,
    location: { protocol: 'file:', origin: 'null', pathname: '/a/index.html',
                href: 'file:///a/index.html', search: '' }, replaceThrows: true });
  bad.fire('shareBtn');
  ok('file:// share does not crash', !bad.error);
  ok('file:// skips history.replaceState', bad.replaceThrew() === false);
  ok('file:// gives guidance, not a false success', bad.el('shareBtn').textContent !== 'Link copied!');
})();

G('Resilience: missing or corrupted bah-data.js');
// `usable` = whether at least one area still has a valid rate row. When none do,
// the dropdown must disable itself rather than sit there empty.
[['no data file', '', false],
 ['null tables', 'const MHA_NAMES={"CA038":"SAN DIEGO, CA"};const BAH_W=null;const BAH_WO=null;', false],
 ['wrong types', 'const MHA_NAMES="oops";const BAH_W={};const BAH_WO={};', false],
 ['empty tables', 'const MHA_NAMES={};const BAH_W={};const BAH_WO={};', false],
 ['rows not arrays', 'const MHA_NAMES={"CA038":"X"};const BAH_W={"CA038":"nope"};const BAH_WO={};', false],
 ['truncated rows', 'const MHA_NAMES={"CA038":"X"};const BAH_W={"CA038":[3975,3975]};const BAH_WO={};', true]
].forEach(([label, src, usable]) => {
  const b = boot({ dataSrc: src });
  ok('boots with ' + label, !b.error);
  if (b.error) { console.log('        -> ' + b.error); return; }
  let threw = null; try { b.api.calculate(); } catch (e) { threw = e.message; }
  ok('calculates with ' + label, !threw);
  ok('renders with ' + label, (b.writes['results'] || '').length > 150);
  let lv = null, le = null;
  try { lv = b.api.bahLookup('CA038'); } catch (e) { le = e.message; }
  ok('lookup safe with ' + label, !le && (lv === null || Number.isFinite(lv)));
  if (usable) {
    ok('dropdown usable with ' + label, b.el('stationA').disabled === false);
  } else {
    ok('dropdown disabled (not silently empty) with ' + label, b.el('stationA').disabled === true);
    ok('placeholder explains why with ' + label,
       /unavailable/i.test(b.el('stationA').options[0].textContent));
  }
});

G('Accessibility');
(() => {
  const b = boot(); b.api.calculate();
  ok('screen-reader status is populated', (b.el('srStatus').textContent || '').length > 10);
  ok('status names both scenarios', /Scenario A[\s\S]*Scenario B[\s\S]*Difference/.test(b.el('srStatus').textContent));
  const c = boot(); c.el('compareOn').checked = false; c.api.calculate();
  ok('single-scenario status', /Estimated take-home/.test(c.el('srStatus').textContent));
})();
(() => {
  const head = html.slice(0, html.indexOf('<script src'));
  const inputs = [...head.matchAll(/<(?:input|select)[^>]*id="([^"]+)"/g)].map(m => m[1]);
  const labels = new Set([...head.matchAll(/for="([^"]+)"/g)].map(m => m[1]));
  ok('every static control has a label', inputs.every(i => labels.has(i)));
  ok('generated amount inputs have aria-label', /aria-label="'\+esc\(label\)/.test(html));
  ok('live region present', /aria-live="polite"/.test(html));
  ok('page declares a language', /<html[^>]*lang=/.test(html));
  ok('viewport meta present', /name="viewport"/.test(html));
})();

G('Deployment metadata');
ok('social preview tags present', /og:image/.test(html) && /twitter:card/.test(html));
ok('canonical URL present', /rel="canonical"/.test(html));
ok('favicon present', /rel="icon"/.test(html));
ok('print stylesheet present', /@media print/.test(html));

// ----------------------------------------------------------------- report ---
const total = passed + failed;
console.log('\n' + '-'.repeat(52));
console.log(failed === 0
  ? 'PASS  ' + passed + '/' + total + ' checks'
  : 'FAIL  ' + failed + ' of ' + total + ' checks failed');
process.exit(failed === 0 ? 0 : 1);
