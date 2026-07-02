# Military Take-Home Pay Estimator (2026)

*A Blue Star Families tool.*

A single-file, dependency-free web app that estimates a U.S. service member's monthly **gross** and **take-home** pay — basic pay, allowances, special pays, and estimated federal, FICA, and state taxes — and lets you **compare two duty stations** side-by-side to see how a move (PCS) changes the paycheck.

**Live demo:** https://moeinis.github.io/military-pay-calculator/

## Why

Military pay has many moving parts that change with rank, location, duty type, and state of residence. Most online calculators show gross pay only. This tool models the **deductions** too, so families can estimate real take-home when weighing housing and relocation decisions.

## Features

- **2026 basic pay** for all grades (E-1–E-9, W-1–W-5, O-1–O-10, plus O-1E/2E/3E) by years of service (FY2026 NDAA, 3.8% raise).
- **BAS** auto-added ($476.95 enlisted / $328.48 officer); **BAH** entered from the official DoD lookup.
- **Special & incentive pays**: sea pay, aviation/ACIP, hostile fire/IDP, hazardous duty, jump, HALO, dive, submarine, hardship, SDAP, and Family Separation Allowance (non-taxable).
- **Deductions modeled**: federal income tax (2026 brackets + standard deduction), Social Security (6.2% to the $184,500 wage base), Medicare (1.45%), state income tax (real 2026 brackets & standard deductions for all 50 states + DC), TSP (traditional vs Roth), SGLI, combat-zone exclusion, and other allotments.
- **Duty-station comparison** with monthly and annual take-home difference, effective tax rate, and take-home percentage.
- Runs entirely in the browser. No server, no data leaves the page.

## Usage

Open `index.html` in any browser, or visit the live demo. Everything recalculates as you type.

## Data sources (2026)

- Basic pay — DFAS / FY2026 NDAA
- BAS — DFAS
- Federal brackets & standard deduction — IRS Rev. Proc. 2025-32 (via Tax Foundation)
- FICA — Social Security wage base $184,500
- State income tax — 2026 brackets & standard deductions (Tax Foundation)
- BAH — official DoD BAH Rate Lookup

## Disclaimer

**Estimate only.** BAH is user-entered. State standard deductions are applied to military income alone (accurate for a single-income household). Tax credits, itemized deductions, spouse income, local taxes outside Maryland, and detailed combat-zone/special-pay rules are simplified. Verify with your finance office / MyPay before making financial decisions. Not affiliated with the U.S. Department of Defense.

## License

MIT — see [LICENSE](LICENSE).
