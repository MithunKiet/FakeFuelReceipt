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

      const receiptsData = [];
      const receipts = [];

      const vehicle = { product: "Petrol", vehicleType, vehicleNo, customerName };

      function interpolateRates(startRate, endRate, daysCount) {
        const arr = [];
        const diff = (endRate - startRate) / (daysCount - 1);
        for (let i = 0; i < daysCount; i++) arr.push(+(startRate + diff * i).toFixed(2));
        return arr;
      }

      const months = [
        { year: 2025, m: 7, startRate: 95.03, endRate: 95.15 },
        { year: 2025, m: 8, startRate: 95.15, endRate: 95.06 },
        { year: 2025, m: 9, startRate: 95.08, endRate: 95.19 }
      ];

      let receiptNo = 4930;
      months.forEach(({ year, m, startRate, endRate }) => {
        const daysInMonth = new Date(year, m, 0).getDate();
        const rates = interpolateRates(startRate, endRate, daysInMonth);

        for (let d = 1; d <= daysInMonth; d++) {
          const rate = rates[d - 1];
          const amount = 1000 + Math.floor(Math.random() * 3000);
          const volume = +(amount / rate).toFixed(2);
          const hh = String(8 + Math.floor(Math.random() * 10)).padStart(2, "0");
          const mm = String(Math.floor(Math.random() * 60)).padStart(2, "0");
          const mode = "Cash";

          receipts.push({
            receiptNo: String(receiptNo++),
            product: vehicle.product,
            ratePerLitre: rate,
            amount,
            volume,
            vehicleType: vehicle.vehicleType,
            vehicleNo: vehicle.vehicleNo,
            customerName: vehicle.customerName,
            date: `${String(d).padStart(2, "0")} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${year}`,
            time: `${hh}:${mm}`,
            mode
          });
        }
      });

      receiptsData.push(...receipts);

      const receiptsContainer = document.getElementById('receipts');
      receiptsContainer.innerHTML = ''; // clear old data
      receiptsData.forEach(receipt => {
        receiptsContainer.innerHTML += generateReceiptHTML(receipt);
      });
    }
