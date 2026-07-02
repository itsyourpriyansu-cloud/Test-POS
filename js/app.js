import { storage, formatCurrency, formatDate, $ } from './utils.js';
import { initMenu } from './menu.js';
import { initKitchen, renderKanbanBoard } from './kitchen.js';
import { initBilling, renderBillingView } from './billing.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Initialize module states
  initMenu();
  initKitchen();
  initBilling();

  // Navigation Setup
  setupNavigation();

  // Dashboard calculations
  updateDashboardMetrics();

  // Event Listeners for global metrics updates
  window.addEventListener('metrics-updated', updateDashboardMetrics);
  window.addEventListener('orders-updated', updateDashboardMetrics);

  // Register service worker for offline capabilities
  registerServiceWorker();

  // Setup periodic refresh of kitchen order timers (every 30s)
  setInterval(() => {
    const activeTab = $('.nav-btn.active')?.getAttribute('data-tab');
    if (activeTab === 'kitchen') {
      renderKanbanBoard();
    }
  }, 30000);
}

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.app-section');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (!tab) return;

      // Tap micro-interaction
      btn.style.transform = 'scale(0.9)';
      setTimeout(() => btn.style.transform = '', 120);

      // Reset nav states
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Hide/Show containers
      sections.forEach(sec => {
        if (sec.id === `${tab}-section`) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // Special re-renders when changing tabs
      if (tab === 'home') {
        updateDashboardMetrics();
      } else if (tab === 'kitchen') {
        renderKanbanBoard();
      } else if (tab === 'bill') {
        renderBillingView();
      }
    });
  });

  // Bind Quick Action buttons on Home screen
  const qaNewOrder = $('#qa-new-order');
  const qaKitchen = $('#qa-kitchen');
  const qaBill = $('#qa-bill');

  if (qaNewOrder) qaNewOrder.addEventListener('click', () => navigateToTab('menu'));
  if (qaKitchen) qaKitchen.addEventListener('click', () => navigateToTab('kitchen'));
  if (qaBill) qaBill.addEventListener('click', () => navigateToTab('bill'));
}

function navigateToTab(tabName) {
  const tabBtn = $(`.nav-btn[data-tab="${tabName}"]`);
  if (tabBtn) {
    tabBtn.click();
  }
}

function updateDashboardMetrics() {
  const orders = storage.getOrders();

  // 1. Calculate Today's Revenue (Billed/Completed orders only)
  // To simulate "Today's", we can check if it was created within the last 24h
  const now = new Date();
  const todayRevenue = orders
    .filter(order => order.billed)
    .reduce((sum, order) => sum + order.grandTotal, 0);

  // 2. Count statuses
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

  // Render metrics elements
  const revenueEl = $('#metric-revenue');
  const preparingEl = $('#metric-preparing');
  const readyEl = $('#metric-ready');
  const completedEl = $('#metric-completed');

  if (revenueEl) revenueEl.textContent = formatCurrency(todayRevenue);
  if (preparingEl) preparingEl.textContent = preparingCount;
  if (readyEl) readyEl.textContent = readyCount;
  if (completedEl) completedEl.textContent = completedCount;

  // 3. Render recent orders list on Dashboard
  const recentOrdersList = $('#recent-orders-list');
  if (recentOrdersList) {
    if (orders.length === 0) {
      recentOrdersList.innerHTML = `<div class="empty-dashboard-msg">No orders recorded for today yet.</div>`;
      return;
    }

    // Show top 5 recent orders
    const recent = orders.slice(0, 5);
    recentOrdersList.innerHTML = recent.map(order => {
      let statusClass = `status-${order.status.toLowerCase()}`;
      if (order.billed) statusClass = 'status-billed';
      const statusText = order.billed ? 'Billed' : order.status;

      return `
        <div class="recent-order-item" data-id="${order.id}">
          <div class="recent-item-info">
            <span class="recent-item-id">${order.id}</span>
            <span class="recent-item-cust">${order.customerName}</span>
          </div>
          <span class="recent-item-time">${formatDate(order.timestamp)}</span>
          <span class="recent-item-total">${formatCurrency(order.grandTotal)}</span>
          <span class="recent-item-badge ${statusClass}">${statusText}</span>
        </div>
      `;
    }).join('');

    // Bind clicking recent item to view receipt in Bill tab
    recentOrdersList.querySelectorAll('.recent-order-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        sessionStorage.setItem('billing_active_order_id', id);
        navigateToTab('bill');
      });
    });
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
          console.log('KitchenFlow Service Worker registered successfully', reg.scope);
        })
        .catch(err => {
          console.warn('Service Worker registration failed:', err);
        });
    });
  }
}
