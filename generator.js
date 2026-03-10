 const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function formatDate(d) {
    return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
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
          To Date: ${data.toDate}
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

    function generateReceipts() {
      const vehicleType = document.getElementById('vehType').value || "Petrol";
      const vehicleNo = document.getElementById('vehNo').value || "UP13 AT6119";
      const customerName = document.getElementById('custName').value || "Mithun Kumar";
      const fromDateVal = document.getElementById('fromDate').value;
      const toDateVal = document.getElementById('toDate').value;

      if (!fromDateVal || !toDateVal) {
        alert('Please select both From Date and To Date.');
        return;
      }

      // Use local date parsing to avoid timezone offset issues
      const [fy, fm, fd] = fromDateVal.split('-').map(Number);
      const [ty, tm, td] = toDateVal.split('-').map(Number);
      const fromDate = new Date(fy, fm - 1, fd);
      const toDate = new Date(ty, tm - 1, td);

      if (fromDate > toDate) {
        alert('From Date should not be greater than To Date.');
        return;
      }

      const fromDateDisplay = formatDate(fromDate);
      const toDateDisplay = formatDate(toDate);

      const vehicle = { product: "Petrol", vehicleType, vehicleNo, customerName };

      const receiptsData = [];
      let receiptNo = 4930;

      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const rate = +(93 + Math.random() * 3).toFixed(2);
        const amount = 1000 + Math.floor(Math.random() * 3000);
        const volume = +(amount / rate).toFixed(2);
        const hh = String(8 + Math.floor(Math.random() * 10)).padStart(2, "0");
        const mm = String(Math.floor(Math.random() * 60)).padStart(2, "0");
        const mode = "Cash";

        receiptsData.push({
          receiptNo: String(receiptNo++),
          product: vehicle.product,
          ratePerLitre: rate,
          amount,
          volume,
          vehicleType: vehicle.vehicleType,
          vehicleNo: vehicle.vehicleNo,
          customerName: vehicle.customerName,
          date: formatDate(currentDate),
          time: `${hh}:${mm}`,
          mode,
          fromDate: fromDateDisplay,
          toDate: toDateDisplay
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const receiptsContainer = document.getElementById('receipts');
      receiptsContainer.innerHTML = ''; // clear old data
      receiptsData.forEach(receipt => {
        receiptsContainer.innerHTML += generateReceiptHTML(receipt);
      });
    }
