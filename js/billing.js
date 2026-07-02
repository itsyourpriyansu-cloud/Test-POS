import { storage, formatCurrency, formatDate, $ } from './utils.js';

let selectedOrderId = null;
let cashReceived = 0;

export function initBilling() {
  loadActiveOrderSelection();
  renderBillingView();
  setupBillingEvents();

  // Listen to order updates so the billing order selector updates dynamically
  window.removeEventListener('orders-updated', renderBillingView);
  window.addEventListener('orders-updated', renderBillingView);
}

function loadActiveOrderSelection() {
  // Check if an order ID was passed from the Kitchen view or another trigger
  const activeId = sessionStorage.getItem('billing_active_order_id');
  if (activeId) {
    selectedOrderId = activeId;
    sessionStorage.removeItem('billing_active_order_id'); // clear it
  } else {
    // Default to the first unpaid order, or the most recent order if none are unpaid
    const orders = storage.getOrders();
    const unpaidOrder = orders.find(o => !o.billed);
    if (unpaidOrder) {
      selectedOrderId = unpaidOrder.id;
    } else if (orders.length > 0) {
      selectedOrderId = orders[0].id;
    } else {
      selectedOrderId = null;
    }
  }
  cashReceived = 0;
}

export function renderBillingView() {
  const orders = storage.getOrders();
  renderOrderSelector(orders);
  renderInvoice(orders);
}

function renderOrderSelector(orders) {
  const selectorContainer = $('#billing-order-list');
  if (!selectorContainer) return;

  if (orders.length === 0) {
    selectorContainer.innerHTML = `<div class="no-orders-msg">No orders recorded yet.</div>`;
    return;
  }

  // Group by Unpaid vs Billed
  const unpaidOrders = orders.filter(o => !o.billed);
  const billedOrders = orders.filter(o => o.billed);

  let htmlStr = '';

  if (unpaidOrders.length > 0) {
    htmlStr += `<h3 class="billing-list-header">Unpaid Orders</h3>`;
    htmlStr += unpaidOrders.map(order => renderOrderListItem(order)).join('');
  }

  if (billedOrders.length > 0) {
    htmlStr += `<h3 class="billing-list-header">Recent Completed Bills</h3>`;
    htmlStr += billedOrders.slice(0, 10).map(order => renderOrderListItem(order)).join('');
  }

  selectorContainer.innerHTML = htmlStr;

  // Bind clicks
  selectorContainer.querySelectorAll('.billing-list-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedOrderId = item.getAttribute('data-id');
      cashReceived = 0;
      renderBillingView();
    });
  });
}

function renderOrderListItem(order) {
  const activeClass = order.id === selectedOrderId ? 'active' : '';
  const statusClass = order.billed ? 'status-billed' : `status-unpaid-${order.status.toLowerCase()}`;
  const statusText = order.billed ? 'Billed' : order.status;

  return `
    <div class="billing-list-item ${activeClass}" data-id="${order.id}">
      <div class="billing-item-left">
        <span class="billing-item-id">${order.id}</span>
        <span class="billing-item-cust">${order.customerName}</span>
      </div>
      <div class="billing-item-right">
        <span class="billing-item-total">${formatCurrency(order.grandTotal)}</span>
        <span class="billing-item-badge ${statusClass}">${statusText}</span>
      </div>
    </div>
  `;
}

function renderInvoice(orders) {
  const invoiceContainer = $('#invoice-pane');
  if (!invoiceContainer) return;

  const order = orders.find(o => o.id === selectedOrderId);

  if (!order) {
    invoiceContainer.innerHTML = `
      <div class="invoice-empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"/></svg>
        <p>Select an order from the list to generate bill/receipt</p>
      </div>
    `;
    return;
  }

  const itemsHtml = order.items.map(item => `
    <tr class="invoice-row">
      <td class="col-item">${item.name}</td>
      <td class="col-qty text-center">${item.quantity}</td>
      <td class="col-rate text-right">${formatCurrency(item.price)}</td>
      <td class="col-amount text-right">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const balance = Math.max(0, cashReceived - order.grandTotal);
  const formattedBalance = formatCurrency(balance);
  const formattedCashReceived = cashReceived > 0 ? formatCurrency(cashReceived) : formatCurrency(0);

  const statusLabel = order.billed 
    ? `<span class="invoice-status-label status-paid">PAID / COMPLETED</span>` 
    : `<span class="invoice-status-label status-pending">PENDING PAYMENT</span>`;

  invoiceContainer.innerHTML = `
    <div class="receipt-card">
      <div class="receipt-header">
        <div class="receipt-title">KITCHENFLOW</div>
        <div class="receipt-subtitle">Restaurant POS Receipt</div>
        <div class="receipt-metadata">
          <div><span>Order ID:</span> <strong>${order.id}</strong></div>
          <div><span>Date:</span> ${new Date(order.timestamp).toLocaleDateString()} ${formatDate(order.timestamp)}</div>
          <div><span>Customer:</span> ${order.customerName}</div>
          <div><span>Status:</span> ${statusLabel}</div>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th class="col-item text-left">Item Description</th>
            <th class="col-qty text-center">Qty</th>
            <th class="col-rate text-right">Rate</th>
            <th class="col-amount text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="receipt-divider"></div>

      <div class="receipt-summary">
        <div class="summary-line">
          <span>Subtotal</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        <div class="summary-line">
          <span>GST (18%)</span>
          <span>${formatCurrency(order.gst)}</span>
        </div>
        ${order.discount > 0 ? `
          <div class="summary-line discount">
            <span>Discount</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
        ` : ''}
        <div class="receipt-divider"></div>
        <div class="summary-line grand-total">
          <span>Grand Total</span>
          <span>${formatCurrency(order.grandTotal)}</span>
        </div>
      </div>

      ${order.billed ? `
        <div class="receipt-divider"></div>
        <div class="receipt-payment-details">
          <div class="summary-line">
            <span>Cash Tendered</span>
            <span>${formatCurrency(order.cashReceived)}</span>
          </div>
          <div class="summary-line">
            <span>Balance Returned</span>
            <span>${formatCurrency(order.balance)}</span>
          </div>
        </div>
      ` : `
        <div class="receipt-divider"></div>
        <div class="cash-input-section">
          <label for="cash-received-input" class="cash-label">Cash Received (₹)</label>
          <div class="cash-input-wrapper">
            <input type="number" id="cash-received-input" class="cash-input" min="0" placeholder="Enter amount received" value="${cashReceived || ''}">
          </div>
          <div class="balance-display ${cashReceived > 0 ? 'sufficient' : ''}">
            <span>Balance to Return:</span>
            <strong id="balance-value">${formattedBalance}</strong>
          </div>
        </div>
      `}

      <div class="receipt-footer-msg">
        <p>Thank you for dining with us!</p>
        <p>Internal Ops Copy</p>
      </div>
    </div>

    <div class="invoice-actions">
      <button class="btn-invoice btn-print" id="btn-print-invoice">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
        Print
      </button>
      ${!order.billed ? `
        <button class="btn-invoice btn-complete-bill" id="btn-complete-bill" ${cashReceived > 0 ? '' : 'disabled'}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          Complete Order
        </button>
      ` : ''}
      <button class="btn-invoice btn-new-order-redirect" id="btn-new-order">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        New Order
      </button>
    </div>
  `;

  // Bind inline events for inputs
  const cashInput = $('#cash-received-input');
  if (cashInput) {
    cashInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      cashReceived = val;

      const newBalance = Math.max(0, cashReceived - order.grandTotal);
      const balanceValEl = $('#balance-value');
      const balanceDispEl = $('.balance-display');
      const completeBtn = $('#btn-complete-bill');

      if (balanceValEl) {
        balanceValEl.textContent = formatCurrency(newBalance);
      }

      if (balanceDispEl) {
        if (cashReceived > 0) {
          balanceDispEl.classList.add('sufficient');
        } else {
          balanceDispEl.classList.remove('sufficient');
        }
      }

      if (completeBtn) {
        completeBtn.disabled = cashReceived <= 0;
      }
    });
  }
}

function setupBillingEvents() {
  // Bind actions
  const container = $('#invoice-pane');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const printBtn = e.target.closest('#btn-print-invoice');
    const completeBtn = e.target.closest('#btn-complete-bill');
    const newOrderBtn = e.target.closest('#btn-new-order');

    if (printBtn) {
      window.print();
    }

    if (completeBtn) {
      completeBilling();
    }

    if (newOrderBtn) {
      redirectToMenu();
    }
  });

  // Search selector binding
  const searchInput = $('#billing-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const orders = storage.getOrders();
      const filtered = orders.filter(o => 
        o.id.toLowerCase().includes(query) || 
        o.customerName.toLowerCase().includes(query)
      );
      renderOrderSelector(filtered);
    });
  }
}

function completeBilling() {
  if (!selectedOrderId) return;

  const orders = storage.getOrders();
  const orderIndex = orders.findIndex(o => o.id === selectedOrderId);
  if (orderIndex === -1) return;

  const order = orders[orderIndex];
  if (cashReceived <= 0) return;

  order.billed = true;
  order.cashReceived = cashReceived;
  order.balance = Math.max(0, cashReceived - order.grandTotal);
  
  // Advance status to COMPLETED if not already there
  if (order.status !== 'COMPLETED') {
    order.status = 'COMPLETED';
    order.history.push({
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    });
  }

  storage.saveOrders(orders);
  renderBillingView();

  // Toast
  showToast(`Bill for ${order.id} marked as completed!`);
  
  // Dispatch metrics update
  window.dispatchEvent(new Event('metrics-updated'));
}

function redirectToMenu() {
  // Click on menu tab btn
  const menuTabBtn = $('[data-tab="menu"]');
  if (menuTabBtn) {
    menuTabBtn.click();
  }
}

function showToast(message) {
  const container = $('#toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 180);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}
export { selectedOrderId };
