import { storage, formatCurrency, formatDate, $ } from './utils.js';

const STATUSES = ['NEW', 'PREPARING', 'READY', 'COMPLETED'];

const STAGE_TRANSITIONS = {
  'NEW': { next: 'PREPARING', label: 'Start Preparing' },
  'PREPARING': { next: 'READY', label: 'Mark as Ready' },
  'READY': { next: 'COMPLETED', label: 'Serve / Complete' },
  'COMPLETED': { next: null, label: 'Close Order' }
};

export function initKitchen() {
  renderKanbanBoard();
  setupKitchenEvents();

  // Listen to order updates from other views (e.g. Menu placing order)
  window.removeEventListener('orders-updated', renderKanbanBoard);
  window.addEventListener('orders-updated', renderKanbanBoard);
}

export function renderKanbanBoard() {
  const orders = storage.getOrders();

  STATUSES.forEach(status => {
    const columnContainer = $(`#column-${status.toLowerCase()} .column-content`);
    const countBadge = $(`#column-${status.toLowerCase()} .column-count`);
    
    if (!columnContainer) return;

    // Filter orders matching current column status
    const filteredOrders = orders.filter(order => order.status === status);

    // Update count badge
    if (countBadge) {
      countBadge.textContent = filteredOrders.length;
    }

    if (filteredOrders.length === 0) {
      columnContainer.innerHTML = `
        <div class="column-empty-state">
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          <span>No Orders</span>
        </div>
      `;
      return;
    }

    columnContainer.innerHTML = filteredOrders.map(order => {
      const itemsListStr = order.items.map(item => `
        <div class="kitchen-card-item">
          <span class="kitchen-item-qty">${item.quantity}x</span>
          <span class="kitchen-item-name">${item.name}</span>
          ${item.isVeg ? '<span class="dot-veg"></span>' : '<span class="dot-nonveg"></span>'}
        </div>
      `).join('');

      // Calculate minutes elapsed since creation
      const creationTime = new Date(order.timestamp);
      const elapsedMs = new Date() - creationTime;
      const elapsedMins = Math.floor(elapsedMs / 60000);
      
      let timerClass = 'timer-normal';
      if (status === 'NEW' && elapsedMins >= 5) timerClass = 'timer-warning';
      if (status === 'PREPARING' && elapsedMins >= 15) timerClass = 'timer-danger';

      const transition = STAGE_TRANSITIONS[status];
      const hasAction = transition && transition.next;

      return `
        <div class="kitchen-order-card ${status.toLowerCase()}-card" data-id="${order.id}">
          <div class="kitchen-card-header">
            <span class="kitchen-order-id">${order.id}</span>
            <span class="kitchen-order-timer ${timerClass}">
              ${elapsedMins === 0 ? 'Just now' : `${elapsedMins}m ago`}
            </span>
          </div>
          <div class="kitchen-card-body">
            <div class="kitchen-customer-name">${order.customerName}</div>
            <div class="kitchen-card-items">
              ${itemsListStr}
            </div>
            ${order.notes ? `<div class="kitchen-card-notes">“${order.notes}”</div>` : ''}
          </div>
          <div class="kitchen-card-footer">
            <span class="kitchen-card-total">${formatCurrency(order.grandTotal)}</span>
            <div class="kitchen-card-actions">
              ${hasAction ? `
                <button class="btn-advance-status" data-id="${order.id}" data-next="${transition.next}">
                  ${transition.label}
                </button>
              ` : `
                <button class="btn-view-invoice" data-id="${order.id}">
                  View Receipt
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  });

  setupAdvanceButtons();
}

function setupAdvanceButtons() {
  const advanceButtons = document.querySelectorAll('.btn-advance-status');
  advanceButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.getAttribute('data-id');
      const nextStatus = btn.getAttribute('data-next');
      advanceOrderStatus(orderId, nextStatus);
    });
  });

  // View Invoice button (mostly for completed cards)
  const viewInvoiceButtons = document.querySelectorAll('.btn-view-invoice');
  viewInvoiceButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderId = btn.getAttribute('data-id');
      openBillingForOrder(orderId);
    });
  });
}

function setupKitchenEvents() {
  // We can add search/filter within kitchen screen later if needed, but POS Kanban columns are usually self-contained.
}

function advanceOrderStatus(orderId, nextStatus) {
  const orders = storage.getOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) return;

  const order = orders[orderIndex];
  order.status = nextStatus;
  order.history.push({
    status: nextStatus,
    timestamp: new Date().toISOString()
  });

  // Automatically mark as billed/completed if moved to COMPLETED and paid?
  // Let's keep status syncing robust
  storage.saveOrders(orders);
  renderKanbanBoard();
  
  // Custom event trigger to let app.js update header metrics instantly
  window.dispatchEvent(new Event('metrics-updated'));
}

function openBillingForOrder(orderId) {
  // Find order
  const orders = storage.getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  // Let's store selected billing order ID and trigger billing screen navigation
  sessionStorage.setItem('billing_active_order_id', orderId);
  
  const billingTabBtn = $('[data-tab="bill"]');
  if (billingTabBtn) {
    billingTabBtn.click();
  }
}
