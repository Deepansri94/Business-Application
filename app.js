// ── Storage helpers ──────────────────────────────────────────────
const load = key => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

let customers = load('customers');
let transactions = load('transactions');

// ── Navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(item.dataset.page).classList.add('active');
    if (item.dataset.page === 'dashboard') renderDashboard();
    if (item.dataset.page === 'messages') renderMsgCheckboxes();
  });
});

// ── Toast ────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.className = 'toast hidden', 3000);
}

// ── Modal ────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ── Dashboard ────────────────────────────────────────────────────
function renderDashboard() {
  const today = new Date().toDateString();
  const todayTxns = transactions.filter(t => new Date(t.date).toDateString() === today);
  document.getElementById('stat-customers').textContent = customers.length;
  document.getElementById('stat-txns').textContent = transactions.length;
  document.getElementById('stat-today').textContent = '₹' + todayTxns.reduce((s, t) => s + t.total, 0).toFixed(2);
  document.getElementById('stat-revenue').textContent = '₹' + transactions.reduce((s, t) => s + t.total, 0).toFixed(2);

  const tbody = document.getElementById('recent-txns-body');
  const recent = [...transactions].reverse().slice(0, 8);
  tbody.innerHTML = recent.map(t => `
    <tr>
      <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
      <td>${t.customerName || 'Walk-in'}</td>
      <td>${t.items.map(i => i.name).join(', ')}</td>
      <td>₹${t.total.toFixed(2)}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">No transactions yet</td></tr>';
}

// ── Customers ────────────────────────────────────────────────────
function renderCustomers() {
  const tbody = document.getElementById('customers-body');
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.phone}</td>
      <td>${c.email || '-'}</td>
      <td>
        <button class="btn-edit" onclick="editCustomer('${c.id}')">✏️ Edit</button>
        <button class="btn-danger" onclick="deleteCustomer('${c.id}')">🗑️ Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">No customers added</td></tr>';
  refreshCustomerDropdowns();
}

function saveCustomer() {
  const id = document.getElementById('edit-customer-id').value;
  const name = document.getElementById('c-name').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  if (!name || !phone) return toast('Name and Phone are required', 'error');
  if (!/^\d{10}$/.test(phone)) return toast('Enter a valid 10-digit phone number', 'error');

  const customer = { id: id || Date.now().toString(), name, phone, email: document.getElementById('c-email').value.trim(), address: document.getElementById('c-address').value.trim() };
  if (id) {
    customers = customers.map(c => c.id === id ? customer : c);
  } else {
    customers.push(customer);
  }
  save('customers', customers);
  closeModal('customer-modal');
  renderCustomers();
  toast(id ? 'Customer updated!' : 'Customer added!');
}

function editCustomer(id) {
  const c = customers.find(x => x.id === id);
  document.getElementById('customer-modal-title').textContent = 'Edit Customer';
  document.getElementById('edit-customer-id').value = c.id;
  document.getElementById('c-name').value = c.name;
  document.getElementById('c-phone').value = c.phone;
  document.getElementById('c-email').value = c.email || '';
  document.getElementById('c-address').value = c.address || '';
  openModal('customer-modal');
}

function deleteCustomer(id) {
  if (!confirm('Delete this customer?')) return;
  customers = customers.filter(c => c.id !== id);
  save('customers', customers);
  renderCustomers();
  toast('Customer deleted');
}

document.getElementById('customer-modal').addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal('customer-modal');
});

// Reset modal on open
const origOpenModal = openModal;
window.openModal = function(id) {
  if (id === 'customer-modal') {
    document.getElementById('customer-modal-title').textContent = 'Add Customer';
    document.getElementById('edit-customer-id').value = '';
    ['c-name','c-phone','c-email','c-address'].forEach(f => document.getElementById(f).value = '');
  }
  if (id === 'txn-modal') {
    document.getElementById('txn-items-list').innerHTML = '';
    document.getElementById('txn-total-val').textContent = '0.00';
    addTxnItem();
  }
  document.getElementById(id).classList.remove('hidden');
};

// ── Customer Dropdowns ───────────────────────────────────────────
function refreshCustomerDropdowns() {
  const opts = `<option value="">-- Walk-in / Select --</option>` + customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  document.getElementById('txn-customer').innerHTML = opts;
  const billOpts = `<option value="">-- Select Customer --</option>` + customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  document.getElementById('bill-customer').innerHTML = billOpts;
}

// ── Item Rows (shared) ───────────────────────────────────────────
const SERVICES = ['Xerox B&W', 'Xerox Color', 'Printout B&W', 'Printout Color', 'Lamination', 'Spiral Binding', 'Pen', 'Notebook', 'Stapler', 'A4 Paper (Ream)', 'Other'];

function itemRowHTML(prefix, idx) {
  return `<div class="bill-item-row" id="${prefix}-row-${idx}">
    <select onchange="calcTotal('${prefix}')">
      ${SERVICES.map(s => `<option>${s}</option>`).join('')}
    </select>
    <input type="number" min="1" value="1" placeholder="Qty" onchange="calcTotal('${prefix}')" />
    <input type="number" min="0" step="0.5" value="0" placeholder="Rate ₹" onchange="calcTotal('${prefix}')" />
    <button class="btn-danger" onclick="removeItemRow('${prefix}',${idx})">✕</button>
  </div>`;
}

let billIdx = 0, txnIdx = 0;

function addBillItem() {
  document.getElementById('bill-items-list').insertAdjacentHTML('beforeend', itemRowHTML('bill', billIdx++));
}
function addTxnItem() {
  document.getElementById('txn-items-list').insertAdjacentHTML('beforeend', itemRowHTML('txn', txnIdx++));
}
function removeItemRow(prefix, idx) {
  document.getElementById(`${prefix}-row-${idx}`)?.remove();
  calcTotal(prefix);
}

function calcTotal(prefix) {
  const container = document.getElementById(`${prefix}-items-list`);
  let total = 0;
  container.querySelectorAll('.bill-item-row').forEach(row => {
    const qty = parseFloat(row.querySelectorAll('input')[0].value) || 0;
    const rate = parseFloat(row.querySelectorAll('input')[1].value) || 0;
    total += qty * rate;
  });
  document.getElementById(`${prefix}-total-val`).textContent = total.toFixed(2);
}

function getItems(prefix) {
  const container = document.getElementById(`${prefix}-items-list`);
  const items = [];
  container.querySelectorAll('.bill-item-row').forEach(row => {
    const name = row.querySelector('select').value;
    const qty = parseFloat(row.querySelectorAll('input')[0].value) || 0;
    const rate = parseFloat(row.querySelectorAll('input')[1].value) || 0;
    if (qty > 0 && rate > 0) items.push({ name, qty, rate, amount: qty * rate });
  });
  return items;
}

// ── Transactions ─────────────────────────────────────────────────
function renderTransactions() {
  const tbody = document.getElementById('txns-body');
  tbody.innerHTML = [...transactions].reverse().map(t => `
    <tr>
      <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
      <td>${t.customerName || 'Walk-in'}</td>
      <td>${t.items.map(i => `${i.name} x${i.qty}`).join(', ')}</td>
      <td>₹${t.total.toFixed(2)}</td>
      <td><button class="btn-danger" onclick="deleteTxn('${t.id}')">🗑️</button></td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">No transactions yet</td></tr>';
}

function saveTransaction() {
  const items = getItems('txn');
  if (!items.length) return toast('Add at least one item', 'error');
  const custId = document.getElementById('txn-customer').value;
  const cust = customers.find(c => c.id === custId);
  const txn = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    customerId: custId,
    customerName: cust ? cust.name : 'Walk-in',
    items,
    total: items.reduce((s, i) => s + i.amount, 0),
    payment: document.getElementById('txn-payment').value
  };
  transactions.push(txn);
  save('transactions', transactions);
  closeModal('txn-modal');
  renderTransactions();
  renderDashboard();
  toast('Transaction saved!');
}

function deleteTxn(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  save('transactions', transactions);
  renderTransactions();
  renderDashboard();
  toast('Transaction deleted');
}

// ── Billing ──────────────────────────────────────────────────────
let lastBill = null;

function generateBill() {
  const items = getItems('bill');
  if (!items.length) return toast('Add at least one item', 'error');
  const custId = document.getElementById('bill-customer').value;
  const cust = customers.find(c => c.id === custId);
  const total = items.reduce((s, i) => s + i.amount, 0);
  const payment = document.getElementById('bill-payment').value;
  const notes = document.getElementById('bill-notes').value;
  const billNo = 'BILL-' + Date.now().toString().slice(-6);
  const date = new Date().toLocaleDateString('en-IN');

  lastBill = { billNo, date, cust, items, total, payment, notes };

  const txn = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    customerId: custId,
    customerName: cust ? cust.name : 'Walk-in',
    items, total, payment, billNo
  };
  transactions.push(txn);
  save('transactions', transactions);

  renderBillPreview(lastBill);
  toast('Bill generated & saved!');
}

function renderBillPreview({ billNo, date, cust, items, total, payment, notes }) {
  const preview = document.getElementById('bill-preview');
  preview.classList.remove('hidden');
  preview.innerHTML = `
    <h3 style="font-family:'Catamaran',sans-serif;font-weight:900;font-size:1.5rem">மகரஜோதி</h3>
    <div class="shop-info">
      <strong>Maharajothi Enterprises</strong><br/>
      2/1, East Street, Pudanchandai Road, Dhathathiripuram<br/>
      Namakkal, Tamil Nadu – 637018<br/>
      Phone: 9XXXXXXXXX
    </div>
    <hr style="border-color:#e2e8f0;margin:8px 0"/>
    <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:8px">
      <span><strong>Bill No:</strong> ${billNo}</span><span><strong>Date:</strong> ${date}</span>
    </div>
    ${cust ? `<div style="font-size:.85rem;margin-bottom:8px"><strong>Customer:</strong> ${cust.name} | ${cust.phone}</div>` : ''}
    <table>
      <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${items.map((i, idx) => `<tr><td>${idx+1}</td><td>${i.name}</td><td>${i.qty}</td><td>₹${i.rate}</td><td>₹${i.amount.toFixed(2)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="bill-footer"><span>Payment: ${payment}</span><span>Total: ₹${total.toFixed(2)}</span></div>
    ${notes ? `<div style="font-size:.82rem;color:#64748b;margin-top:8px">Note: ${notes}</div>` : ''}`;
}

function printBill() {
  if (!lastBill) return toast('Generate a bill first', 'error');
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Bill</title><style>body{font-family:sans-serif;padding:24px;max-width:480px;margin:auto}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;font-size:13px}th{background:#f5f5f5}.footer{display:flex;justify-content:space-between;font-weight:bold;margin-top:12px}</style></head><body>${document.getElementById('bill-preview').innerHTML}</body></html>`);
  win.document.close();
  win.print();
}

// ── WhatsApp Messages ────────────────────────────────────────────
const WA_SERVER = 'http://localhost:3001';

function toggleCustomerSelect() {
  const val = document.getElementById('msg-recipients').value;
  document.getElementById('msg-customer-select').classList.toggle('hidden', val !== 'select');
}

function renderMsgCheckboxes() {
  const box = document.getElementById('msg-customer-checkboxes');
  box.innerHTML = customers.map(c => `
    <label>
      <input type="checkbox" value="${c.id}" /> ${c.name} (${c.phone})
    </label>`).join('') || '<span style="color:#94a3b8;font-size:.85rem">No customers added yet</span>';
  checkWAStatus();
}

async function checkWAStatus() {
  const badge = document.getElementById('wa-status-badge');
  if (!badge) return;
  try {
    const res = await fetch(`${WA_SERVER}/status`);
    const { connected, qrReady } = await res.json();
    if (connected) {
      badge.textContent = '🟢 WhatsApp Connected';
      badge.className = 'wa-badge connected';
    } else if (qrReady) {
      badge.textContent = '📱 Scan QR to Connect';
      badge.className = 'wa-badge qr';
      badge.onclick = () => window.open(`${WA_SERVER}/qr`, '_blank');
    } else {
      badge.textContent = '🔴 Server Offline — Run server/index.js';
      badge.className = 'wa-badge offline';
    }
  } catch {
    badge.textContent = '🔴 Server Offline — Run server/index.js';
    badge.className = 'wa-badge offline';
  }
}

async function sendWhatsApp() {
  const msg = document.getElementById('msg-text').value.trim();
  if (!msg) return toast('Please type a message', 'error');

  const mode = document.getElementById('msg-recipients').value;
  let targets = [];

  if (mode === 'all') {
    targets = customers;
  } else {
    const checked = document.querySelectorAll('#msg-customer-checkboxes input:checked');
    if (!checked.length) return toast('Select at least one customer', 'error');
    checked.forEach(cb => {
      const c = customers.find(x => x.id === cb.value);
      if (c) targets.push(c);
    });
  }

  if (!targets.length) return toast('No customers to send to', 'error');

  const btn = document.querySelector('.btn-whatsapp');
  btn.disabled = true;
  btn.textContent = '⏳ Sending...';

  const log = document.getElementById('msg-log');
  log.innerHTML = `<h3 style="margin-bottom:10px">📋 Sending to ${targets.length} customer(s)...</h3>`;

  try {
    const res = await fetch(`${WA_SERVER}/send-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: targets, message: msg })
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    log.innerHTML = `<h3 style="margin-bottom:10px">📋 Results</h3>`;
    data.results.forEach(r => {
      const ok = r.status === 'sent';
      log.insertAdjacentHTML('beforeend', `
        <div class="msg-log-item ${ok ? '' : 'failed'}">
          ${ok ? '✅' : '❌'} <strong>${r.name}</strong> (${r.phone}) — ${ok ? 'Message sent!' : 'Failed: ' + r.error}
        </div>`);
    });
    const sentCount = data.results.filter(r => r.status === 'sent').length;
    toast(`✅ Sent to ${sentCount}/${targets.length} customers!`);
  } catch (err) {
    log.innerHTML = `<div class="msg-log-item failed">❌ Error: ${err.message}. Make sure the server is running.</div>`;
    toast('Failed to send. Is the server running?', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💬 Send via WhatsApp';
  }
}

// ── Init ─────────────────────────────────────────────────────────
addBillItem();
renderCustomers();
renderTransactions();
renderDashboard();
