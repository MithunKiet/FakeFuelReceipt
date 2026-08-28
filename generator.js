const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const RECEIPT_NO_BASE = 4930;
const MAX_RECEIPT_DAYS = 366;
const MS_PER_DAY = 86400000;

const FALLBACK_FUEL_RATE_SCHEDULE = {
  Petrol: [
    { from: "2024-01-01", rate: 96.72 },
    { from: "2024-06-15", rate: 95.19 },
    { from: "2025-01-01", rate: 94.31 }
  ],
  Diesel: [
    { from: "2024-01-01", rate: 89.62 },
    { from: "2024-06-15", rate: 87.76 },
    { from: "2025-01-01", rate: 86.88 }
  ],
  CNG: [
    { from: "2024-01-01", rate: 72.11 },
    { from: "2024-07-01", rate: 74.02 },
    { from: "2025-01-01", rate: 76.15 }
  ],
  EV: [
    { from: "2024-01-01", rate: 11.5 },
    { from: "2025-01-01", rate: 12.0 }
  ]
};

// Set `key` to a RapidAPI key to enable live rate lookups. While it is empty the
// API is skipped entirely and every receipt uses FALLBACK_FUEL_RATE_SCHEDULE.
const FUEL_RATE_API = {
  baseUrl: "https://daily-petrol-diesel-lpg-cng-fuel-prices-api.p.rapidapi.com/v1/fuel-prices",
  hostHeader: "daily-petrol-diesel-lpg-cng-fuel-prices-api.p.rapidapi.com",
  key: ""
};

const RATE_VALUE_KEYS = ["price", "rate", "fuelPrice", "amount"];

// Used only to recognise a payload that is keyed by fuel, so a response that
// omits the requested fuel is not mistaken for a single-fuel response.
const KNOWN_PRODUCT_KEYS = ["petrol", "diesel", "cng", "ev", "lpg"];

const fuelRateCache = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateInput(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayNumber(date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
}

function dateRangeInclusive(fromDate, toDate) {
  const dates = [];
  const cursor = new Date(fromDate);

  while (cursor <= toDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function setDefaultDates() {
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  if (!fromDateInput || !toDateInput) return;

  if (!toDateInput.value) {
    toDateInput.value = formatISODate(new Date());
  }

  if (!fromDateInput.value) {
    // parseDateInput keeps this in local time; `new Date("YYYY-MM-DD")` would
    // parse as UTC and shift the result by a day west of UTC.
    const from = toDateInput.value ? parseDateInput(toDateInput.value) : new Date();
    from.setDate(from.getDate() - 6);
    fromDateInput.value = formatISODate(from);
  }
}

function getFallbackFuelRate(product, date) {
  const schedule = FALLBACK_FUEL_RATE_SCHEDULE[product] || FALLBACK_FUEL_RATE_SCHEDULE.Petrol;
  const target = date.getTime();
  let selectedRate = schedule[0].rate;
  let selectedFrom = -Infinity;

  // Pick the latest entry effective on or before `date`, independent of the
  // order the schedule happens to be written in.
  schedule.forEach((entry) => {
    const effectiveDate = parseDateInput(entry.from).getTime();
    if (effectiveDate <= target && effectiveDate >= selectedFrom) {
      selectedFrom = effectiveDate;
      selectedRate = entry.rate;
    }
  });

  return selectedRate;
}

function extractRateValue(node) {
  if (typeof node === "number") return Number.isFinite(node) ? node : null;
  if (!node || typeof node !== "object") return null;

  for (const key of RATE_VALUE_KEYS) {
    if (typeof node[key] === "number" && Number.isFinite(node[key])) return node[key];
  }

  for (const value of Object.values(node)) {
    const nested = extractRateValue(value);
    if (nested != null) return nested;
  }

  return null;
}

function findProductNode(payload, product) {
  if (!payload || typeof payload !== "object") return null;
  const wanted = product.toLowerCase();

  for (const [key, value] of Object.entries(payload)) {
    if (key.toLowerCase() === wanted) return value;
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const nested = findProductNode(value, product);
      if (nested != null) return nested;
    }
  }

  return null;
}

function hasAnyProductKey(payload) {
  if (!payload || typeof payload !== "object") return false;

  for (const [key, value] of Object.entries(payload)) {
    if (KNOWN_PRODUCT_KEYS.includes(key.toLowerCase())) return true;
    if (hasAnyProductKey(value)) return true;
  }

  return false;
}

function findRateInApiResponse(payload, product) {
  if (!payload || typeof payload !== "object") return null;

  // Scope the search to the requested product first, otherwise a generic
  // "price" key belonging to a different fuel can win the lookup.
  const productNode = findProductNode(payload, product);
  if (productNode != null) return extractRateValue(productNode);

  // The payload is keyed by fuel but not the one we asked for: fall back to
  // the schedule rather than reporting another fuel's price.
  if (hasAnyProductKey(payload)) return null;

  return extractRateValue(payload);
}

async function fetchFuelRateFromApi({ product, date, state, city }) {
  if (product === "EV") return null;
  if (!FUEL_RATE_API.key) return null;

  const isoDate = formatISODate(date);
  const cacheKey = `${product}|${state}|${city}|${isoDate}`;
  if (fuelRateCache.has(cacheKey)) return fuelRateCache.get(cacheKey);

  const params = new URLSearchParams({
    country: "IN",
    state,
    city,
    fuel: product.toLowerCase(),
    date: isoDate
  });

  const response = await fetch(`${FUEL_RATE_API.baseUrl}?${params.toString()}`, {
    headers: {
      "x-rapidapi-host": FUEL_RATE_API.hostHeader,
      "x-rapidapi-key": FUEL_RATE_API.key
    }
  });

  if (!response.ok) {
    throw new Error(`Fuel API failed with status ${response.status}`);
  }

  const payload = await response.json();
  const rate = findRateInApiResponse(payload, product);
  fuelRateCache.set(cacheKey, rate);
  return rate;
}

function generateReceiptHTML(data) {
  const v = {};
  Object.keys(data).forEach((key) => {
    v[key] = escapeHtml(data[key]);
  });

  return `
      <div class="receipt">
        <img class="logo" src="./hplogo.png" alt="Hindustan Petroleum Logo">
        <div class="title">WELCOME!!!</div>
        <div class="section section-center">
          HPCL PETROL PUMP - HP Auto<br>
          Care H-9 Site B Industrial<br>
          Area, Baburi Sharqi, Uttar<br>
          Pradesh
        </div>
        <div class="section">Receipt No.: ${v.receiptNo}</div>
        <div class="section">
          PRODUCT: ${v.product}<br>
          RATE/LTR: ₹ ${v.ratePerLitre}<br>
          AMOUNT: ₹ ${v.amount}<br>
          VOLUME(LTR.): ${v.volume} lt
        </div>
        <div class="section">
          VEH TYPE: ${v.vehicleType}<br>
          VEH NO: ${v.vehicleNo}<br>
          CUSTOMER NAME: ${v.customerName}
        </div>
        <div class="section">
          Date: ${v.date} &nbsp;&nbsp;&nbsp; Time: ${v.time}
        </div>
        <div class="section">
          MODE: ${v.mode}
        </div>
        <div class="section">
          From Date: ${v.fromDate}<br>
          To Date: ${v.toDate}<br>
          Rate Source: ${v.rateSource}
        </div>
        <div class="footer">
          SAVE FUEL YAANI SAVE MONEY !!<br>
          THANKS FOR FUELLING WITH US.<br>
          YOU CAN NOW CALL US ON<br>
          476069 (TOLL-FREE) FOR<br>
          QUERIES/COMPLAINTS.
        </div>
      </div>`;
}

async function generateReceipts() {
  const vehicleType = document.getElementById("vehType").value || "Petrol";
  const vehicleNo = document.getElementById("vehNo").value || "UP13 AT6119";
  const customerName = document.getElementById("custName").value || "Mithun Kumar";
  const fromDateVal = document.getElementById("fromDate").value;
  const toDateVal = document.getElementById("toDate").value;
  const fuelRangeStart = parseFloat(document.getElementById("fuelRangeStart").value);
  const fuelRangeEnd = parseFloat(document.getElementById("fuelRangeEnd").value);
  const city = document.getElementById("city").value.trim() || "Ghaziabad";
  const state = document.getElementById("state").value.trim() || "Uttar Pradesh";

  if (!fromDateVal || !toDateVal) {
    alert("Please select both From Date and To Date.");
    return;
  }

  if (!Number.isFinite(fuelRangeStart) || !Number.isFinite(fuelRangeEnd) || fuelRangeStart <= 0 || fuelRangeEnd <= 0) {
    alert("Please enter valid fuel range values.");
    return;
  }

  if (fuelRangeStart > fuelRangeEnd) {
    alert("Fuel range start should not be greater than fuel range end.");
    return;
  }

  const fromDate = parseDateInput(fromDateVal);
  const toDate = parseDateInput(toDateVal);

  if (fromDate > toDate) {
    alert("From Date should not be greater than To Date.");
    return;
  }

  const totalDays = dayNumber(toDate) - dayNumber(fromDate) + 1;
  if (totalDays > MAX_RECEIPT_DAYS) {
    alert(`Please select a range of ${MAX_RECEIPT_DAYS} days or fewer (selected: ${totalDays}).`);
    return;
  }

  const fromDateDisplay = formatDate(fromDate);
  const toDateDisplay = formatDate(toDate);
  const dates = dateRangeInclusive(fromDate, toDate);
  const rates = await Promise.all(dates.map(async (date) => {
    let rate = null;
    let rateSource = "Fallback schedule";

    try {
      rate = await fetchFuelRateFromApi({
        product: vehicleType,
        date,
        state,
        city
      });
      if (rate != null) {
        rateSource = "Fuel API";
      }
    } catch (error) {
      console.warn("Fuel API lookup failed, fallback applied:", error.message);
    }

    if (rate == null) {
      rate = getFallbackFuelRate(vehicleType, date);
    }

    return { rate, rateSource };
  }));

  const receiptsData = dates.map((date, index) => {
    const { rate, rateSource } = rates[index];
    const volume = +(fuelRangeStart + Math.random() * (fuelRangeEnd - fuelRangeStart)).toFixed(2);
    // Round the rate before deriving the amount so the printed
    // RATE/LTR x VOLUME actually equals the printed AMOUNT.
    const ratePerLitre = +rate.toFixed(2);
    const amount = +(volume * ratePerLitre).toFixed(2);
    const hh = String(8 + Math.floor(Math.random() * 10)).padStart(2, "0");
    const mm = String(Math.floor(Math.random() * 60)).padStart(2, "0");

    return {
      receiptNo: String(RECEIPT_NO_BASE + dayNumber(date)),
      product: vehicleType,
      ratePerLitre,
      amount,
      volume,
      vehicleType,
      vehicleNo,
      customerName,
      date: formatDate(date),
      time: `${hh}:${mm}`,
      mode: "Cash",
      fromDate: fromDateDisplay,
      toDate: toDateDisplay,
      rateSource
    };
  });

  const receiptsContainer = document.getElementById("receipts");
  receiptsContainer.innerHTML = receiptsData.map(generateReceiptHTML).join("");
}

function initGenerator() {
  setDefaultDates();

  const button = document.getElementById("generateBtn");
  if (!button) return;

  button.addEventListener("click", async () => {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Generating...";

    try {
      await generateReceipts();
    } catch (error) {
      console.error("Receipt generation failed:", error);
      alert("Receipt generation failed. See the browser console for details.");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}

initGenerator();
