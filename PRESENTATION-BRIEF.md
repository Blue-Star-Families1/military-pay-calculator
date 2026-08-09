# Military Take-Home Pay Estimator — Presentation Brief

**Live tool:** https://blue-star-families1.github.io/military-pay-calculator/
**Repo:** https://github.com/Blue-Star-Families1/military-pay-calculator

---

## ⚠️ Before you present

**Test the demo on the exact device and network you'll use in the room.**
Avast (and some corporate/guest Wi-Fi filters) block this brand-new domain and
show `ERR_CONNECTION_RESET`. This is a filtering false-positive on a new site,
not a fault in the tool — it loads normally elsewhere.

If it's blocked: add an Avast exception, present from a phone on cellular, or
use a different machine. **Have screenshots as a backup.**

---

## The 30-second pitch

> Military pay isn't one number. When a family PCSs, their housing allowance,
> state taxes, and special pays all change at once — and every calculator out
> there shows only *gross* pay. None of them tell you what actually lands in
> your bank account.
>
> Two-thirds of military families rent on the local market. They're signing
> leases without knowing their real take-home.
>
> This tool answers the question they're actually asking: **"If we move here,
> what does our paycheck look like?"** — and it compares two duty stations
> side by side.

---

## Demo script (4 clicks, ~3 minutes)

Open each link in a tab beforehand.

### 1. The core value — same rank, different city
**E-5 with family, Fort Bragg → JBLM/Tacoma (Texas residence)**

| | BAH | Take-home |
|---|---|---|
| Fort Bragg, NC | $1,806 | **$5,942/mo** |
| JBLM / Tacoma, WA | $2,556 | **$6,692/mo** |

**+$750/month · +$9,000/year**

> "Same rank, same job, same family. The only thing that changed is the city —
> and that's $9,000 a year."

### 2. The high-cost move
**O-3 with family, Fort Hood → San Diego (Virginia residence)**

| | BAH | Take-home |
|---|---|---|
| Fort Hood, TX | $2,340 | **$8,560/mo** |
| San Diego, CA | $4,518 | **$10,738/mo** |

**+$2,178/month · +$26,136/year**

> "This is the difference between affording a house and not. Families need this
> number *before* they commit to a lease."

### 3. The honest counter-example
**E-4 single, Norfolk → Colorado Springs (Florida residence)**

**−$18/month.** Essentially flat.

> "Not every move changes the budget. That's useful too — it tells a family
> they don't need to panic."

### 4. The detail that shows real depth
**E-7 deployed to a combat zone, Fort Hood (Georgia residence)**

Federal income tax: **$0** (combat-zone exclusion) — but **FICA is still
withheld ($475)**, and Georgia state tax follows the federal exclusion.

> "This is the kind of nuance families get wrong, and most calculators ignore
> entirely."

---

## Why the numbers are trustworthy

Every layer is validated against a source **outside** the tool:

| Component | Validated against |
|---|---|
| Basic pay | DFAS 2026 tables; cross-checked vs DoD/CRS grade averages |
| BAS | **Exact match** to DoD published annual figures |
| BAH | All **18,252 rate cells** byte-verified against DoD DTMO source files |
| Federal tax | IRS Rev. Proc. 2025-32 brackets and standard deductions |
| FICA | Statutory rates, wage base, and Additional Medicare thresholds |
| State tax | Published state schedules; hand-computed arithmetic confirmed |

**198 automated tests** run in one command, so next January's rate update is
verifiable rather than hoped-for.

Two concrete findings worth mentioning:
- Cross-validation against DoD's published tables caught a missing **E-1
  under-4-months rate** — new recruits were being shown $181/month too much.
- A competing public calculator is currently serving **2023 BAS rates** as
  though they were current. Ours is verified against DoD's own tables.

---

## Expect these questions

**"Has anyone checked it against a real LES?"**
> Not yet — and that's the honest answer. It's validated against every official
> published source, but not against a live pay statement. That's my next step,
> and I'd love two or three of you to compare it against your own LES this week.

*(This turns the biggest gap into audience participation.)*

**"How accurate is it?"**
> Gross pay and allowances are dollar-accurate. Take-home is an estimate — the
> federal line is annual tax liability ÷ 12, not your exact W-4 withholding, so
> expect some drift there. The A-vs-B comparison is more reliable than either
> absolute number, because most sources of error cancel on both sides.

**"What isn't included?"**
> Spouse income, child tax credits, itemized deductions, local taxes outside
> Maryland, and OCONUS locations (those use OHA, not BAH). All documented.

**"Who maintains it?"**
> Rates change every January. The update procedure is documented and the test
> suite verifies it — but someone needs to own that annually. That's a real ask.

**"What did it cost?"**
> Nothing. Static site, free hosting, no server, no database. Nothing a family
> enters ever leaves their browser.

---

## The ask

Pick whichever fits your audience:

1. **Validation** — two or three service members compare it against a real LES.
2. **Ownership** — someone owns the annual January rate refresh.
3. **Distribution** — share it through BSF channels ahead of PCS season.
4. **Custom domain** — point a `bluestarfam.org` subdomain at it so it reads as
   official (also resolves the new-domain filtering issue).

---

## Share blurb

> Moving this year? Our new Military Take-Home Pay Estimator shows what your
> paycheck actually looks like after taxes at your next duty station — and
> compares two locations side by side. Free, private (nothing leaves your
> browser), and updated for 2026.
> https://blue-star-families1.github.io/military-pay-calculator/
