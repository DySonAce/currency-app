const API_URL = "https://open.er-api.com/v6/latest/USD";

const currencyNames = {
  "TWD": "台幣", "USD": "美金", "CNY": "人民幣", "JPY": "日圓", "HKD": "港幣",
  "EUR": "歐元", "GBP": "英鎊", "KRW": "韓元", "THB": "泰銖", "AUD": "澳幣",
  "CAD": "加幣", "SGD": "新幣", "MYR": "馬來西亞令吉", "VND": "越南盾",
  "PHP": "菲律賓披索", "IDR": "印尼盾", "MOP": "澳門幣", "NZD": "紐西蘭元",
  "CHF": "瑞士法郎", "SEK": "瑞典克朗"
};

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('currencyContainer');
  const addBtn = document.getElementById('addCurrency');
  const status = document.getElementById('status');
  const themeToggle = document.getElementById('themeToggle');

  let allRates = {};
  let activeCurrencies = JSON.parse(localStorage.getItem('myCurrencies')) || ['TWD', 'USD', 'CNY', 'JPY']; 
  let currentBaseValue = 100; 
  let currentBaseCurrency = activeCurrencies[0];

  // --- 主題功能 ---
  function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeToggle.innerText = theme === 'dark' ? '☀️ 日間模式' : '🌙 夜間模式';
  }

  themeToggle.onclick = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // --- 匯率功能 (改為按日期更新 + 顯示完整日期) ---
  async function loadRates() {
    try {
      const cachedRates = JSON.parse(localStorage.getItem('rates'));
      const lastUpdateDate = localStorage.getItem('lastUpdateDate');
      const lastUpdateTime = localStorage.getItem('lastUpdateTime');
      
      const today = new Date().toLocaleDateString(); // 取得今天日期字串 (YYYY/M/D)

      if (cachedRates && lastUpdateDate === today) {
        allRates = cachedRates;
        renderAll();
        status.innerText = "今日匯率已同步 (更新於 " + lastUpdateDate + " " + lastUpdateTime + ")";
      } else {
        const response = await fetch(API_URL);
        const data = await response.json();
        allRates = data.rates;
        
        const nowTime = new Date().toLocaleTimeString();
        
        localStorage.setItem('rates', JSON.stringify(allRates));
        localStorage.setItem('lastUpdateDate', today);
        localStorage.setItem('lastUpdateTime', nowTime);
        
        renderAll();
        status.innerText = "已同步今日最新匯率 (" + today + " " + nowTime + ")";
      }
    } catch (e) {
      status.innerText = "連線失敗，請檢查網路";
    }
  }

  function renderAll() {
    container.innerHTML = '';
    activeCurrencies.forEach((cur, index) => {
      createRow(cur, index);
    });
    updateValues(currentBaseCurrency, currentBaseValue);
  }

  function createRow(selectedCur, index) {
    const row = document.createElement('div');
    row.className = 'currency-row';
    
    const optionsHtml = Object.keys(allRates).sort().map(code => {
      const name = currencyNames[code] ? ` (${currencyNames[code]})` : "";
      return `<option value="${code}" ${code === selectedCur ? 'selected' : ''}>${code}${name}</option>`;
    }).join('');

    row.innerHTML = `
      <select class="cur-select">${optionsHtml}</select>
      <input type="number" class="cur-input" inputmode="decimal" placeholder="0.00">
      <button class="remove-btn">×</button>
    `;

    const select = row.querySelector('.cur-select');
    const input = row.querySelector('.cur-input');

    select.onchange = (e) => {
      activeCurrencies[index] = e.target.value;
      localStorage.setItem('myCurrencies', JSON.stringify(activeCurrencies));
      updateValues(e.target.value, parseFloat(input.value) || 0);
    };

    input.oninput = (e) => {
      currentBaseValue = parseFloat(e.target.value);
      currentBaseCurrency = select.value;
      updateValues(currentBaseCurrency, currentBaseValue, input);
    };

    row.querySelector('.remove-btn').onclick = () => {
      if (activeCurrencies.length <= 2) return alert("至少保留兩個貨幣");
      activeCurrencies.splice(index, 1);
      localStorage.setItem('myCurrencies', JSON.stringify(activeCurrencies));
      renderAll();
    };

    container.appendChild(row);
  }

  function updateValues(fromCur, amount, sourceInput = null) {
    if (isNaN(amount)) {
      document.querySelectorAll('.cur-input').forEach(input => { if (input !== sourceInput) input.value = ''; });
      return;
    }
    const usdBase = amount / allRates[fromCur];
    const inputs = document.querySelectorAll('.cur-input');
    const selects = document.querySelectorAll('.cur-select');

    inputs.forEach((input, i) => {
      if (input === sourceInput) return;
      const targetCur = selects[i].value;
      const result = usdBase * allRates[targetCur];
      input.value = result < 0.1 ? result.toFixed(4) : result.toFixed(2);
    });
  }

  addBtn.onclick = () => {
    activeCurrencies.push('USD');
    localStorage.setItem('myCurrencies', JSON.stringify(activeCurrencies));
    renderAll();
  };

  initTheme();
  loadRates();
});
