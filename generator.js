// Example inline JSON data
const receiptsData = [
  {
    receiptNo: "4924",
    product: "Petrol",
    ratePerLitre: 94.71,
    amount: 3450,
    volume: 36.42,
    vehicleType: "Petrol",
    vehicleNo: "UP13 AT6119",
    customerName: "Mithun Kumar",
    date: "03 Apr 2025",
    time: "14:57",
    mode: "Cash"
  },
  {
    receiptNo: "4925",
    product: "Petrol",
    ratePerLitre: 94.71,
    amount: 3500,
    volume: 36.95,
    vehicleType: "Petrol",
    vehicleNo: "UP13 AT6119",
    customerName: "Mithun Kumar",
    date: "20 Apr 2025",
    time: "09:20",
    mode: "Card"
  },
  {
    receiptNo: "4926",
    product: "Petrol",
    ratePerLitre: 95.12,
    amount: 3650,
    volume: 38.37,
    vehicleType: "Petrol",
    vehicleNo: "UP13 AT6119",
    customerName: "Mithun Kumar",
    date: "02 May 2025",
    time: "11:45",
    mode: "UPI"
  },
  {
    receiptNo: "4927",
    product: "Petrol",
    ratePerLitre: 95.05,
    amount: 3500,
    volume: 36.82,
    vehicleType: "Petrol",
    vehicleNo: "UP13 AT6119",
    customerName: "Mithun Kumar",
    date: "15 May 2025",
    time: "16:10",
    mode: "Cash"
  },
  {
    receiptNo: "4928",
    product: "Petrol",
    ratePerLitre: 94.12,
    amount: 3400,
    volume: 36.12,
    vehicleType: "Petrol",
    vehicleNo: "UP13 AT6119",
    customerName: "Mithun Kumar",
    date: "25 May 2025",
    time: "08:30",
    mode: "Card"
  },
  {
    receiptNo: "4929",
    product: "Petrol",
    ratePerLitre: 94.85,
    amount: 3800,
    volume: 40.06,
    vehicleType: "Petrol",
    vehicleNo: "UP13 AT6119",
    customerName: "Mithun Kumar",
    date: "05 Jun 2025",
    time: "13:25",
    mode: "Cash"
  }
];

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
      Date: ${data.date}     Time: ${data.time}
    </div>
    <div class="section">
      MODE: ${data.mode}
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

const receiptsContainer = document.getElementById('receipts');
receiptsData.forEach(receipt => {
  receiptsContainer.innerHTML += generateReceiptHTML(receipt);
});
