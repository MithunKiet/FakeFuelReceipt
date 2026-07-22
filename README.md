# Fuel Receipt Generator

A single-page, client-side tool that generates printable HPCL-style fuel purchase receipts for a date range. Open `receipt.html` in a browser, fill in the form, and get one receipt per day styled like a petrol pump printout.

## Features

- Generates one receipt per day for a given From/To date range.
- Supports Petrol, Diesel, CNG, and EV vehicle types.
- Randomizes fuel volume within a configurable litre range, and the time of purchase.
- Looks up the fuel rate for each date from a fuel price API, falling back to a built-in rate schedule (`FALLBACK_FUEL_RATE_SCHEDULE` in `generator.js`) if the API call fails or is unavailable.
- Each receipt shows the rate source used (API vs. fallback schedule).
- Print-friendly layout (`@media print` styles) for generating physical copies.

## Usage

1. Open `receipt.html` in any modern browser (no build step or server required).
2. Fill in the form:
   - **VEH TYPE** — Petrol, Diesel, CNG, or EV
   - **VEH NO** — vehicle registration number
   - **CUSTOMER NAME**
   - **FROM DATE** / **TO DATE** — date range to generate receipts for (inclusive)
   - **FUEL RANGE (LTR)** — min/max litres to randomize per receipt
   - **CITY** / **STATE**
3. Click **Generate Receipts**. One receipt card is rendered per day in the range.
4. Use your browser's print function to print or save the receipts as a PDF.

## Files

| File | Description |
|---|---|
| `receipt.html` | Form UI and receipt layout/styles |
| `generator.js` | Date handling, fuel rate lookup/fallback, and receipt generation logic |
| `hplogo.png` | Logo used on the generated receipts |

## Notes

- The fuel rate API endpoint in `generator.js` is a placeholder (`FUEL_RATE_API`) and requires a valid RapidAPI key/host to return live data; without one, generation falls back to the static rate schedule.
- This tool is intended for generating sample/mock receipts (e.g. for testing or demo purposes) and is not affiliated with HPCL.
