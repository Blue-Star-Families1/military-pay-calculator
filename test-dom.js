#!/usr/bin/env node
/*
 * Browser-DOM integration tests for the Military Take-Home Pay Estimator.
 *
 *   npm ci                 (one time)
 *   npm test
 *
 * test.js exercises the calculation engine against a stubbed DOM. This file is
 * the complement: it parses the real index.html in a real DOM implementation,
 * executes the real scripts, and drives the UI with real dispatched events.
 * That catches anything a hand-written stub could paper over — option elements
 * that never get created, listeners that never fire, escaping that only looks
 * safe as a string.
 *
 * Not covered: visual layout. jsdom has no renderer, so how the page *looks*
 * still needs a human with a browser.
 *
 * Exit code 0 = all passed, 1 = failures, 2 = jsdom not installed.
 */
'use strict';
const fs = require('fs');
const path = require('path');

let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) {
  console.error('jsdom is not installed — DOM integration tests cannot run.');
  console.log('Install project dependencies with:  npm ci');
  process.exit(2);
}

const DIR = __dirname;
const URL_ = 'https://blue-star-families1.github.io/military-pay-calculator/';

// Inline bah-data.js so script execution order matches a real browser.
let html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const bahSrc = fs.readFileSync(path.join(DIR, 'bah-data.js'), 'utf8');
html = html.replace('<script src="bah-data.js"></script>', '<script>' + bahSrc + '</script>');
const zipSrcInline = fs.readFileSync(path.join(DIR, 'zip-data.js'), 'utf8');
html = html.replace('<script src="zip-data.js"></script>', '<script>' + zipSrcInline + '</script>');

// Rate tables, read independently, so expectations come from the data itself
// rather than from hardcoded numbers that could drift after a yearly update.
const data = {};
new Function('g', bahSrc + ';g.BAH_W=BAH_W;g.BAH_WO=BAH_WO;g.MHA_NAMES=MHA_NAMES;')(data);
const COL_ = { 'E-5': 4, 'O-3': 19 };
const COL = { 'E-5': 4, 'O-3': 19 };
const SD = 'CA038';   // San Diego — present in every published rate table

const runtimeErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/fonts\.googleapis|Could not load link/.test(e.message)) runtimeErrors.push(e.message); });
vc.on('error', (...a) => runtimeErrors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: URL_, virtualConsole: vc
});
const w = dom.window, d = w.document;

let passed = 0, failed = 0;
const G = g => console.log('\n' + g);
const ok = (name, cond) => { if (cond) passed++; else { failed++; console.log('  FAIL  ' + name); } };
const eq = (name, got, want) => {
  if (String(got) === String(want)) passed++;
  else { failed++; console.log('  FAIL  ' + name + '  got ' + got + '  want ' + want); }
};
const $ = id => d.getElementById(id);
const fire = (el, ev) => el.dispatchEvent(new w.Event(ev, { bubbles: true }));
const cards = () => $('results').querySelectorAll('.res-card');
const takeHome = i => { const c = cards()[i]; return c ? c.querySelector('.line.total .v').textContent : null; };
const money = n => '$' + Math.round(n).toLocaleString('en-US');

setTimeout(() => {
  G('Page load');
  ok('no runtime errors', runtimeErrors.length === 0);
  if (runtimeErrors.length) runtimeErrors.slice(0, 3).forEach(e => console.log('        ' + e));

  G('Controls are really populated');
  ok('pay grades listed', $('grade').options.length >= 28);
  ok('under-4-months E-1 offered first', $('grade').options[0].textContent === 'E-1 <4mo');
  // "COUNTY COST GROUP nnn" areas are deliberately excluded — a member cannot
  // know their cost group, so they are reached by ZIP instead.
  (() => {
    const all = Object.keys(data.MHA_NAMES);
    const ccg = all.filter(c => /^COUNTY COST GROUP\b/i.test(data.MHA_NAMES[c]));
    // mirror the app's filter: must have a rate row, and must not be a cost group
    const listable = all.filter(c => Array.isArray(data.BAH_W[c]) &&
                                     !/^COUNTY COST GROUP\b/i.test(data.MHA_NAMES[c]));
    ok('some cost-group areas exist in the source data', ccg.length > 0);
    ok('every named duty station is listed',
       $('stationA').options.length === listable.length + 1); // +1 placeholder
    const labels = [...$('stationA').options].map(o => o.textContent);
    ok('no DFAS cost-group labels in the dropdown',
       !labels.some(t => /COUNTY COST GROUP/i.test(t)));
  })();
  ok('station dropdown enabled when data loads', $('stationA').disabled === false);
  ok('unmapped placeholder area excluded',
     ![...$('stationA').options].some(o => /UNKNOWN/i.test(o.textContent)));
  eq('all states and DC listed', $('stateA').options.length, 51);
  // count comes from the data, so adding a pay does not break the test
  (() => {
    const declared = (html.match(/const SPECIALS\s*=\s*\[([\s\S]*?)\n\];/) || [])[1] || '';
    const n = (declared.match(/^\s*\["/gm) || []).length;
    ok('special pays are declared', n > 0);
    eq('a row per declared special pay',
       $('specials').querySelectorAll('input[type=checkbox]').length, n);
    eq('every amount box carries an aria-label',
       $('specials').querySelectorAll('input[type=number][aria-label]').length, n);
  })();

  G('Years of service read as ranges, not gaps');
  (() => {
    // Pay only changes at the DFAS breakpoints, so the raw list skips 17, 27…
    // Shown bare that looks like missing years; each option states its range.
    const labels = [...$('yos').options].map(o => o.textContent);
    ok('first option covers under two years', /under 2/i.test(labels[0]));
    ok('last option is open-ended', /over \d+/i.test(labels[labels.length - 1]));
    ok('no bare numbers left', !labels.some(t => /^\d+$/.test(t.trim())));
    ok('every option names years', labels.every(t => /year/i.test(t)));
    // the 16 -> 18 jump she noticed must now be explicit
    ok('the 16 to 18 jump is spelled out', labels.some(t => /16.?17 years/i.test(t)));
    ok('ranges are contiguous', !labels.some((t, i) => {
      if (i === 0 || i === labels.length - 1) return false;
      const start = parseInt(t, 10);
      const prev = labels[i - 1];
      const prevEnd = /[–-](\d+)/.test(prev) ? +RegExp.$1 : parseInt(prev, 10);
      return Number.isFinite(prevEnd) && Number.isFinite(start) && start !== prevEnd + 1;
    }));
  })();

  G('Initial render');
  ok('results render on load', $('results').innerHTML.length > 300);
  eq('two comparison cards', cards().length, 2);
  ok('take-home shown as a dollar figure', /^\$[\d,]+$/.test(takeHome(0)));
  ok('difference summary populated', $('diffBox').textContent.includes('mo'));

  // The feedback card has two modes, set by constants in index.html:
  //   link-only  — a Google Form URL and no POST endpoint: the in-page fields
  //                cannot submit anywhere, so they hide and the button opens
  //                the form.
  //   in-page    — a POST endpoint is configured: the fields submit directly.
  // Read the configured values so this suite verifies whichever is deployed.
  const cfg = (name) => {
    const m = html.match(new RegExp('const\\s+' + name + '\\s*=\\s*"([^"]*)"'));
    return m ? m[1].trim() : '';
  };
  const FORM_URL = cfg('FEEDBACK_FORM_URL'), ENDPOINT = cfg('FEEDBACK_ENDPOINT');
  const linkOnly = !ENDPOINT && /^https:\/\//i.test(FORM_URL);

  G('Feedback card (' + (linkOnly ? 'link-only mode' : 'in-page mode') + ')');
  ok('feedback toggle exists', !!$('feedbackToggle'));
  ok('feedback form exists', !!$('feedbackForm'));
  ok('GitHub fallback link exists', !!$('feedbackGithubLink'));
  ok('a destination is configured', linkOnly || !!ENDPOINT ||
     /^https:\/\//i.test($('feedbackGithubLink').href));

  if (linkOnly) {
    ok('form points at Google Forms', /docs\.google\.com\/forms|forms\.gle/i.test(FORM_URL));
    ok('form URL is https', /^https:\/\//i.test(FORM_URL));
    // Fields that cannot submit must not be shown as though they could.
    ok('in-page fields are hidden', $('feedbackForm').style.display === 'none');
    // Must be a real link: window.open() is silently refused by popup blockers,
    // which would leave the button doing nothing at all.
    const t = $('feedbackToggle');
    eq('the control is an anchor, not a popup button', t.tagName, 'A');
    // href carries prefill parameters, so compare the base rather than the whole
    ok('it points at the configured form',
       (t.getAttribute('href') || '').indexOf(FORM_URL) === 0);
    ok('it opens in a new tab safely', t.target === '_blank' && /noopener/.test(t.rel));
    ok('it keeps the button styling', /feedback-toggle/.test(t.className));
    // As an <a> it inherits link defaults; it must still read as a button.
    ok('link underline is cleared for the button',
       /a\.feedback-toggle[^}]*text-decoration:\s*none/.test(html.replace(/\s*,\s*/g, ',')) ||
       /\.feedback-toggle\{[^}]*text-decoration:\s*none/.test(html));
    ok('it drops the disclosure semantics', !t.hasAttribute('aria-expanded') && !t.hasAttribute('aria-controls'));
  } else {
    ok('feedback form hidden by default', $('feedbackForm').classList.contains('hidden'));
    $('feedbackToggle').click();
    ok('feedback form is visible after toggle', !$('feedbackForm').classList.contains('hidden'));
    eq('grade prefilled in feedback form', $('feedbackGrade').value, $('grade').value);
    eq('years prefilled in feedback form', $('feedbackYears').value, $('yos').value);
    eq('state prefilled in feedback form', $('feedbackState').value, $('stateA').value);
    ok('feedback submit button is labeled clearly', /report|send/i.test($('feedbackSubmit').textContent));
  }

  G('Feedback asks the two questions and identifies the reporter');
  (() => {
    const acc = $('feedbackAccuracy'), imp = $('feedbackImprove');
    const nm = $('feedbackName'), em = $('feedbackEmail');
    ok('accuracy question present', !!acc);
    ok('improvement question present', !!imp);
    ok('both questions are required', acc.hasAttribute('required') && imp.hasAttribute('required'));
    const lbl = id => d.querySelector('label[for="' + id + '"]').textContent;
    ok('accuracy question asks accurate vs inaccurate', /accurate or inaccurate/i.test(lbl('feedbackAccuracy')));
    ok('improvement question asks about missing fields', /fields or situations missing/i.test(lbl('feedbackImprove')));
    ok('name field present and required', nm && nm.hasAttribute('required'));
    ok('email field present, required, typed', em && em.hasAttribute('required') && em.type === 'email');
    // Free-text answers must not be forced out by the optional dollar amounts.
    ok('dollar amounts are optional',
       !$('feedbackCalculatorEstimate').hasAttribute('required') &&
       !$('feedbackLesEstimate').hasAttribute('required'));
    const priv = $('feedbackPrivacy').textContent;
    ok('privacy note explains why name and email are asked for', /follow up/i.test(priv));
    ok('privacy note promises the details stay private', /never shown publicly/i.test(priv));
    ok('privacy note still warns off sensitive data', /account numbers|SSN/i.test(priv));

    if (linkOnly) return;   // no in-page submit handler to exercise

    // Submitting incomplete answers must be refused before anything is sent.
    const submit = () => $('feedbackForm').dispatchEvent(
      new w.Event('submit', { bubbles: true, cancelable: true }));
    const status = () => $('feedbackStatus').textContent;
    acc.value = ''; imp.value = ''; nm.value = ''; em.value = '';
    submit();
    ok('blank answers are rejected', /answer both questions/i.test(status()));
    acc.value = 'Close, but BAH was off.'; imp.value = 'Add drill pay.';
    submit();
    ok('missing name and email are rejected', /name and email/i.test(status()));
    nm.value = 'Test User'; em.value = 'not-an-email';
    submit();
    ok('malformed email is rejected', /email address/i.test(status()));
    nm.value = ''; em.value = ''; acc.value = ''; imp.value = '';
    $('feedbackStatus').textContent = '';
  })();

  G('BAH auto-fill driven by real events');
  $('grade').value = 'E-5'; fire($('grade'), 'change');
  $('deps').value = 'yes'; fire($('deps'), 'change');
  $('stationA').value = SD; fire($('stationA'), 'change');
  eq('selecting a station fills BAH', $('bahA').value, String(data.BAH_W[SD][COL['E-5']]));
  const afterStation = takeHome(0);
  $('grade').value = 'O-3'; fire($('grade'), 'change');
  eq('changing rank refills BAH', $('bahA').value, String(data.BAH_W[SD][COL['O-3']]));
  ok('take-home responds to rank change', takeHome(0) !== afterStation);
  $('deps').value = 'no'; fire($('deps'), 'change');
  eq('dependents toggle switches rate table', $('bahA').value, String(data.BAH_WO[SD][COL['O-3']]));
  $('deps').value = 'yes'; fire($('deps'), 'change');

  G('Typed input recalculates');
  $('tsp').value = '0'; fire($('tsp'), 'input');
  const tsp0 = parseInt(takeHome(0).replace(/\D/g, ''), 10);
  $('tsp').value = '15'; fire($('tsp'), 'input');
  const tsp15 = parseInt(takeHome(0).replace(/\D/g, ''), 10);
  ok('higher TSP reduces take-home', tsp15 < tsp0);
  $('tsp').value = '5'; fire($('tsp'), 'input');

  G('Combat zone');
  $('combat').checked = true; fire($('combat'), 'input');
  ok('combat exclusion labelled in the breakdown', /combat-excluded/.test(cards()[0].textContent));
  $('combat').checked = false; fire($('combat'), 'input');

  G('State selection updates guidance and exemption');
  $('stateA').value = 'TX'; fire($('stateA'), 'change');
  ok('no-tax state auto-exempts', $('exemptA').checked === true);
  ok('no-tax state explained', /No state income tax/i.test($('stateNoteA').textContent));
  $('stateA').value = 'VA'; fire($('stateA'), 'change');
  ok('taxing state is not auto-exempt', $('exemptA').checked === false);
  $('stateA').value = 'CA'; fire($('stateA'), 'change');
  ok('conditional state explains the stationed-elsewhere rule',
     /stationed/i.test($('stateNoteA').textContent));
  $('stateA').value = 'NC'; fire($('stateA'), 'change');

  G('Cross-site scripting, executed for real');
  $('labelA').value = '<img src=x onerror="window.__pwned=1">'; fire($('labelA'), 'input');
  ok('no element injected into the DOM', $('results').querySelectorAll('img').length === 0);
  ok('payload did not execute', w.__pwned === undefined);
  $('labelA').value = '"><script>window.__pwned2=1</' + 'script>'; fire($('labelA'), 'input');
  ok('script tag not injected', $('results').querySelectorAll('script').length === 0);
  ok('second payload did not execute', w.__pwned2 === undefined);
  $('labelA').value = ''; fire($('labelA'), 'input');

  G('Single-scenario mode');
  $('compareOn').checked = false; fire($('compareOn'), 'change');
  eq('one card when comparison is off', cards().length, 1);
  ok('single mode uses a class', $('results').classList.contains('single'));
  $('compareOn').checked = true; fire($('compareOn'), 'change');
  eq('two cards when comparison is on', cards().length, 2);
  ok('compare mode drops the class', !$('results').classList.contains('single'));

  G('Shared links must not carry feedback details');
  (() => {
    // A share link is handed to other people. Personal details typed into the
    // feedback form must never ride along, and a crafted link must not be able
    // to pre-fill someone else's name and email into that form.
    const nm = $('feedbackName'), em = $('feedbackEmail');
    nm.value = 'Jane Doe'; em.value = 'jane@example.mil';
    $('feedbackAccuracy').value = 'private note';
    const qs = w.collectState ? w.collectState() : null;
    ok('collectState is reachable for testing', typeof qs === 'string');
    if (typeof qs === 'string') {
      ok('name is not in the share link', !/Jane\+?%?2?0?Doe|Jane/i.test(qs));
      ok('email is not in the share link', !/jane%40example|jane@example/i.test(qs));
      ok('no feedback fields at all in the share link', !/[?&]?feedback/i.test(qs));
      ok('calculator fields are still in the share link', /grade=/.test(qs) && /stateA=/.test(qs));
    }
    nm.value = ''; em.value = ''; $('feedbackAccuracy').value = '';
  })();

  G('ZIP code lookup');
  (() => {
    const zipSrc = fs.readFileSync(path.join(DIR, 'zip-data.js'), 'utf8');
    const zd = {};
    new Function('g', zipSrc + ';g.ZIP_DICT=ZIP_DICT;g.ZIP_PACK=ZIP_PACK;')(zd);
    ok('zip table ships', typeof zd.ZIP_PACK === 'string' && zd.ZIP_PACK.length > 1000);
    ok('zip dictionary covers the housing areas', zd.ZIP_DICT.length > 300);

    const sw = d.querySelector('.lookup-switch');
    ok('a duty-station / ZIP switch is offered', !!sw && !sw.hidden);
    ok('station is the default view', $('stationWrapA').hidden === false && $('zipWrapA').hidden === true);

    // Switching reveals the ZIP field and updates the pressed state.
    $('byZipA').click();
    ok('choosing ZIP reveals the field', $('zipWrapA').hidden === false && $('stationWrapA').hidden === true);
    eq('ZIP button reports pressed', $('byZipA').getAttribute('aria-pressed'), 'true');
    eq('station button reports unpressed', $('byStationA').getAttribute('aria-pressed'), 'false');

    // A real ZIP must fill BAH with the same figure the station lookup gives.
    $('grade').value = 'E-5'; fire($('grade'), 'change');
    $('deps').value = 'yes'; fire($('deps'), 'change');
    $('zipA').value = '92134'; fire($('zipA'), 'input');          // San Diego
    const viaZip = $('bahA').value;
    ok('a valid ZIP fills the BAH field', Number(viaZip) > 0);
    ok('it reports which area matched', /Matched/i.test($('zipNoteA').textContent));
    $('stationA').value = 'CA038'; fire($('stationA'), 'change');
    eq('ZIP and duty station agree for the same area', viaZip, $('bahA').value);

    // Bad input must say so rather than silently leaving a stale rate.
    $('byZipA').click();
    $('zipA').value = '123'; fire($('zipA'), 'input');
    ok('a short ZIP is rejected', /5-digit/i.test($('zipNoteA').textContent));
    $('zipA').value = '00000'; fire($('zipA'), 'input');
    ok('an unassigned ZIP is reported', /No BAH area|outside the published/i.test($('zipNoteA').textContent));
    // A stale rate from the previous ZIP must not survive a failed lookup —
    // it would look plausible and silently price the wrong location.
    $('zipA').value = '92134'; fire($('zipA'), 'input');
    ok('valid ZIP sets a rate', Number($('bahA').value) > 0);
    $('zipA').value = '00601'; fire($('zipA'), 'input');   // Puerto Rico: OHA, not BAH
    eq('a failed lookup clears the stale rate', $('bahA').value, '0');
    ok('and explains why', /OHA|outside the published/i.test($('zipNoteA').textContent));

    // Cost-group areas are unreachable by name but must resolve by ZIP.
    const ccgCodes = Object.keys(data.MHA_NAMES)
      .filter(c => /^COUNTY COST GROUP\b/i.test(data.MHA_NAMES[c]));
    const packed = zd.ZIP_PACK.split(' ');
    const dictIdx = new Map(zd.ZIP_DICT.map((m, i) => [m, i]));
    const reachable = ccgCodes.filter(c => {
      const i = dictIdx.get(c);
      return i !== undefined && packed.some(r => parseInt(r.split('.').pop(), 36) === i);
    });
    ok('cost-group areas are still reachable by ZIP (' + reachable.length + '/' + ccgCodes.length + ')',
       reachable.length === ccgCodes.length);

    // ...but their DFAS label must never be shown. Removing it from the
    // dropdown and then echoing it in the ZIP confirmation would undo the fix.
    (() => {
      // find a ZIP that resolves to a cost-group area
      const packed = zd.ZIP_PACK.split(' ');
      const ccgIdx = new Set(ccgCodes.map(c => dictIdx.get(c)).filter(i => i !== undefined));
      let cur = 0, ccgZip = null;
      for (const rec of packed) {
        const p = rec.split('.');
        cur += parseInt(p[0], 36);
        if (ccgIdx.has(parseInt(p[p.length - 1], 36))) { ccgZip = cur; break; }
      }
      ok('a cost-group ZIP exists to test', ccgZip !== null);
      if (ccgZip !== null) {
        $('byZipA').click();
        $('zipA').value = String(ccgZip).padStart(5, '0'); fire($('zipA'), 'input');
        const note = $('zipNoteA').textContent;
        ok('the rate is still found', Number($('bahA').value) > 0);
        ok('no DFAS cost-group jargon is shown', !/COUNTY COST GROUP/i.test(note));
        ok('it confirms the ZIP instead', /ZIP\s*\d{5}/i.test(note));
      }
    })();

    // A ZIP-based share link must reopen on the ZIP tab. Otherwise a cost-group
    // area — which has no dropdown entry — reopens with a blank station, and
    // changing grade afterwards leaves the old rate in place.
    (() => {
      $('byZipA').click();
      eq('mode is recorded for sharing', $('modeA').value, 'zip');
      const q = w.collectState();
      ok('share link carries the lookup mode', /modeA=zip/.test(q));
      const d4 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
        url: URL_ + '?modeA=zip&zipA=92134&grade=E-5&deps=yes', virtualConsole: vc });
      // jsdom runs scripts synchronously enough for the init block to have run
      const g4 = id => d4.window.document.getElementById(id);
      ok('a ZIP link reopens on the ZIP tab', g4('zipWrapA').hidden === false);
      ok('and hides the station picker', g4('stationWrapA').hidden === true);
      ok('and re-resolves the rate', Number(g4('bahA').value) > 0);
    })();

    $('byStationA').click();
    $('zipA').value = '';
  })();

  G('Feedback context line');
  (() => {
    // When feedback leaves the page, the auto-filled grade/station/state have
    // nowhere to travel — a report would arrive without the inputs that
    // produced it. The context line is what the reporter pastes in.
    const box = $('fbCtx'), txt = $('fbCtxText');
    ok('context block exists', !!box && !!txt);
    if (linkOnly) {
      ok('shown when feedback goes to an external form', box.hidden === false);
      // The context questions must arrive already answered, not be retyped.
      (() => {
        // give every context field a value so all four should be sent
        $('labelA').value = 'Fort Bragg'; fire($('labelA'), 'input');
        const href = $('feedbackToggle').getAttribute('href') || '';
        ok('outbound link is a prefill link', /usp=pp_url/.test(href));
        ok('it carries the rank field', /entry\.\d+=/.test(href));
        const ids = (href.match(/entry\.\d+/g) || []);
        ok('all four context fields are sent (' + ids.length + '/4)', ids.length === 4);
        ok('no duplicate fields', new Set(ids).size === ids.length);
        // an empty value must be omitted rather than sent blank
        $('labelA').value = ''; fire($('labelA'), 'input');
        $('stationA').value = ''; fire($('stationA'), 'change');
        const bare = ($('feedbackToggle').getAttribute('href') || '').match(/entry\.\d+/g) || [];
        ok('blank context fields are omitted', bare.length < 4);
        $('labelA').value = 'Fort Bragg'; fire($('labelA'), 'input');
        // values must be real, not placeholders
        $('grade').value = 'O-5'; fire($('grade'), 'change');
        $('labelA').value = 'Norfolk'; fire($('labelA'), 'input');
        const h2 = decodeURIComponent($('feedbackToggle').getAttribute('href') || '');
        ok('rank tracks the current selection', /O-5/.test(h2));
        ok('location tracks the current selection', /Norfolk/.test(h2));
        ok('answers are not prefilled', !/entry\.999538463=.+/.test(h2));
        $('labelA').value = ''; fire($('labelA'), 'input');
      })();
      $('grade').value = 'O-4'; fire($('grade'), 'change');
      $('deps').value = 'yes'; fire($('deps'), 'change');
      $('stateA').value = 'VA'; fire($('stateA'), 'change');
      $('labelA').value = 'Norfolk'; fire($('labelA'), 'input');
      const s = txt.textContent;
      ok('names the grade', /O-4/.test(s));
      ok('names the location', /Norfolk/i.test(s));
      ok('names the state of residence', /Virginia|VA/i.test(s));
      ok('reports dependants', /dependent/i.test(s));
      ok('includes the figure the tool produced', /\$[\d,]+/.test(s));
      // must track edits, or it will describe a scenario the reporter has left
      $('grade').value = 'E-6'; fire($('grade'), 'change');
      ok('updates when inputs change', /E-6/.test(txt.textContent) && !/O-4/.test(txt.textContent));
      ok('offers a copy control', !!$('fbCtxCopy'));
      $('labelA').value = ''; fire($('labelA'), 'input');
    } else {
      ok('hidden when the in-page form submits directly', box.hidden === true);
    }
  })();

  G('Touch targets');
  (() => {
    // Browser default checkboxes are ~13px, under the 24px minimum, and this
    // tool is mostly opened on a phone. Assert the CSS that fixes it is present,
    // since jsdom does not lay out and cannot measure the rendered size.
    ok('checkboxes are explicitly sized', /input\[type=checkbox\][^}]*width:\s*18px/.test(html));
    ok('checkbox labels get a 24px hit area', /\.sp-row label[^}]*min-height:\s*24px/.test(html.replace(/\s*,\s*/g, ',')));
    ok('checkbox labels show a pointer cursor', /label[^}]*cursor:\s*pointer/.test(html));
    // Every checkbox must be reachable by clicking its label, not just the box.
    const boxes = [...d.querySelectorAll('input[type=checkbox][id]')];
    const unpaired = boxes.filter(b => !d.querySelector('label[for="' + b.id + '"]'));
    ok('every checkbox has a clickable label (' + (boxes.length - unpaired.length) + '/' + boxes.length + ')',
       unpaired.length === 0);
  })();

  G('Mobile layout');
  // An inline grid-template-columns would outrank the max-width:720px media
  // query, so the two cards could never stack and the numbers got squeezed
  // and clipped on a phone. The column count must come from CSS only.
  ok('results grid is not set by an inline style',
     !/grid-template-columns/i.test($('results').getAttribute('style') || ''));
  ok('scenarios grid is not set by an inline style',
     !/grid-template-columns/i.test(d.querySelector('.scenarios').getAttribute('style') || ''));
  ok('a mobile breakpoint exists for the results grid',
     /@media\s*\(max-width:\s*720px\)[^}]*\.results/.test(html.replace(/\s*,\s*/g, ',')));

  G('Accessibility in a real document');
  ok('page declares a language', d.documentElement.getAttribute('lang') === 'en');
  ok('single top-level heading', d.querySelectorAll('h1').length === 1);
  ok('polite live region present', $('srStatus').getAttribute('aria-live') === 'polite');
  // hidden inputs carry state, not user-facing controls, so they need no label
  const controls = [...d.querySelectorAll('main input, main select')]
    .filter(el => el.type !== 'hidden');
  const labelled = controls.filter(el =>
    (el.id && d.querySelector('label[for="' + el.id + '"]')) || el.getAttribute('aria-label'));
  ok('every control has a label (' + labelled.length + '/' + controls.length + ')',
     labelled.length === controls.length);
  ok('external links are rel=noopener',
     [...d.querySelectorAll('a[target="_blank"]')].every(a => /noopener/.test(a.rel)));

  G('Shared link restores state in a real document');
  (() => {
    const q = '?grade=O-3&yos=4&filing=mfj&deps=yes&tsp=5&sgli=31&other=0' +
              '&stationA=' + SD + '&bahA=' + data.BAH_W[SD][COL['O-3']] +
              '&stateA=VA&exemptA=0&labelA=San+Diego&compareOn=0';
    const d2 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
      url: URL_ + q, virtualConsole: vc });
    const g2 = id => d2.window.document.getElementById(id);
    setTimeout(() => {
      eq('grade restored', g2('grade').value, 'O-3');
      eq('station restored', g2('stationA').value, SD);
      eq('BAH restored', g2('bahA').value, String(data.BAH_W[SD][COL['O-3']]));
      eq('label restored', g2('labelA').value, 'San Diego');
      ok('results rendered from the link', g2('results').innerHTML.length > 300);

      // A crafted link must not be able to seed the feedback form with
      // someone else's identity.
      const hostile = '?grade=E-5&feedbackName=Attacker&feedbackEmail=evil%40example.com';
      const d3 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
        url: URL_ + hostile, virtualConsole: vc });
      setTimeout(() => {
        const g3 = id => d3.window.document.getElementById(id);
        eq('crafted link cannot prefill the name', g3('feedbackName').value, '');
        eq('crafted link cannot prefill the email', g3('feedbackEmail').value, '');
        eq('normal calculator params still restore', g3('grade').value, 'E-5');
        report();
      }, 250);
    }, 250);
  })();
}, 400);

function report() {
  const total = passed + failed;
  console.log('\n' + '-'.repeat(52));
  console.log(failed === 0
    ? 'PASS  ' + passed + '/' + total + ' DOM integration checks'
    : 'FAIL  ' + failed + ' of ' + total + ' DOM checks failed');
  console.log('Note: jsdom has no renderer — visual layout is still unverified.');
  process.exit(failed === 0 ? 0 : 1);
}
