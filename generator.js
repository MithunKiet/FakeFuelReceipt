const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

const FUEL_RATE_API = {
  baseUrl: "https://daily-petrol-diesel-lpg-cng-fuel-prices-api.p.rapidapi.com/v1/fuel-prices",
  hostHeader: "daily-petrol-diesel-lpg-cng-fuel-prices-api.p.rapidapi.com"
};

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
    const today = new Date();
    toDateInput.value = formatISODate(today);
  }

  if (!fromDateInput.value) {
    const from = new Date(toDateInput.value || new Date());
    from.setDate(from.getDate() - 6);
    fromDateInput.value = formatISODate(from);
  }
}

function getFallbackFuelRate(product, date) {
  const schedule = FALLBACK_FUEL_RATE_SCHEDULE[product] || FALLBACK_FUEL_RATE_SCHEDULE.Petrol;
  const target = date.getTime();
  let selectedRate = schedule[0].rate;

  schedule.forEach((entry) => {
    const [y, m, d] = entry.from.split("-").map(Number);
    const effectiveDate = new Date(y, m - 1, d).getTime();
    if (effectiveDate <= target) {
      selectedRate = entry.rate;
    }
  });

  return selectedRate;
}

function findRateInApiResponse(payload, product) {
  if (!payload || typeof payload !== "object") return null;
  const keys = [product.toLowerCase(), "price", "rate", "fuelPrice", "amount"];

  for (const key of keys) {
    if (typeof payload[key] === "number") return payload[key];
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "object") {
      const nested = findRateInApiResponse(value, product);
      if (nested != null) return nested;
    }
  }

  return null;
}

async function fetchFuelRateFromApi({ product, date, state, city }) {
  if (product === "EV") return null;

  const params = new URLSearchParams({
    country: "IN",
    state,
    city,
    fuel: product.toLowerCase(),
    date: formatISODate(date)
  });

  const response = await fetch(`${FUEL_RATE_API.baseUrl}?${params.toString()}`, {
    headers: {
      "x-rapidapi-host": FUEL_RATE_API.hostHeader
    }
  });

  if (!response.ok) {
    throw new Error(`Fuel API failed with status ${response.status}`);
  }

  const payload = await response.json();
  return findRateInApiResponse(payload, product);
}

function generateReceiptHTML(data) {
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
        <div class="section">Receipt No.: ${data.receiptNo}</div>
        <div class="section">
          PRODUCT: ${data.product}<br>
          RATE/LTR: ₹ ${data.ratePerLitre}<br>
          AMOUNT: ₹ ${data.amount}<br>
          VOLUME(LTR.): ${data.volume} lt
        </div>
        <div class="section">
          VEH TYPE: ${data.vehicleType}<br>
          VEH NO: ${data.vehicleNo}<br>
          CUSTOMER NAME: ${data.customerName}
        </div>
        <div class="section">
          Date: ${data.date} &nbsp;&nbsp;&nbsp; Time: ${data.time}
        </div>
        <div class="section">
          MODE: ${data.mode}
        </div>
        <div class="section">
          From Date: ${data.fromDate}<br>
          To Date: ${data.toDate}<br>
          Rate Source: ${data.rateSource}
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
    const amount = +(volume * rate).toFixed(2);
    const hh = String(8 + Math.floor(Math.random() * 10)).padStart(2, "0");
    const mm = String(Math.floor(Math.random() * 60)).padStart(2, "0");

    return {
      receiptNo: String(4930 + index),
      product: vehicleType,
      ratePerLitre: Number(rate.toFixed(2)),
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


setDefaultDates();
