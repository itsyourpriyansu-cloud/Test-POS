import { storage, formatCurrency, generateOrderId, $ } from './utils.js';

let menuItems = [];
let currentCategory = 'All';
let searchQuery = '';
let cart = [];
let customerName = '';
let orderNotes = '';

// Category list matching the requirements
const CATEGORIES = ['All', 'Veg', 'Non Veg', 'Rice', 'Curry', 'Bread', 'Chinese', 'Beverages', 'Desserts'];

// SVGs for categories or default food categories
const CATEGORY_ICONS = {
  Curry: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 19c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-2H2v2zm10-15C7 4 3 8 3 13h18c0-5-4-9-9-9zm-3.5 6c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm7 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"/></svg>`,
  Rice: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
  Bread: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`,
  Chinese: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 9h-4.3l-2.5-4.2c-.4-.7-1.3-.9-2-.5-.7.4-.9 1.3-.5 2L14.4 9H9.6L11.3 6.3c.4-.7.2-1.6-.5-2-.7-.4-1.6-.2-2 .5L6.3 9H2c-1.1 0-2 .9-2 2v2c0 4.4 3.6 8 8 8h8c4.4 0 8-3.6 8-8v-2c0-1.1-.9-2-2-2zM8 19c-3.3 0-6-2.7-6-6h12c0 3.3-2.7 6-6 6zm10 0c-.7 0-1.3-.1-2-.3.6-.8 1-1.8 1-2.7 0-1.8-1-3.3-2.5-4H22c0 3.8-3.1 7-7 7z"/></svg>`,
  Beverages: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 5H3v3h18V5zm-3 5H6v11h12V10zm-6 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/></svg>`,
  Desserts: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-4 0-7 3-7 7 0 2.2 1 4.1 2.5 5.5C5 15.5 3 17.5 3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2 0-2.5-2-4.5-4.5-5.5C18 13.1 19 11.2 19 9c0-4-3-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm0 12c2.5 0 4.6 1.6 5.4 3.8H6.6c.8-2.2 2.9-3.8 5.4-3.8z"/></svg>`,
  Veg: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7c-2.2 0-4 1.8-4 4v10c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4V7c0-2.2-1.8-4-4-4zm-5 14c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/></svg>`,
  'Non Veg': `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7c-2.2 0-4 1.8-4 4v10c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4V7c0-2.2-1.8-4-4-4zm-5 12.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z"/></svg>`,
  Default: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>`
};

const PIZZA_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%">
  <!-- Golden Crust -->
  <path d="M 50 15 L 85 80 A 10 10 0 0 1 75 90 L 25 90 A 10 10 0 0 1 15 80 Z" fill="#E67E22" stroke="#D35400" stroke-width="2" />
  <!-- Crust edge shadow -->
  <path d="M 17 80 A 10 10 0 0 0 25 90 L 75 90 A 10 10 0 0 0 83 80" fill="none" stroke="#C0392B" stroke-width="4" stroke-linecap="round" />
  <!-- Pizza Base / Sauce -->
  <path d="M 50 22 L 78 78 L 22 78 Z" fill="#C0392B" />
  <!-- Cheese -->
  <path d="M 50 25 L 75 75 A 5 5 0 0 1 71 80 L 29 80 A 5 5 0 0 1 25 75 Z" fill="#F1C40F" />
  <!-- Melting cheese details -->
  <path d="M 35 77 Q 40 85 45 78 Q 50 83 55 78 Q 60 85 65 77" fill="none" stroke="#F1C40F" stroke-width="4" stroke-linecap="round" />
  <!-- Pepperonis -->
  <circle cx="50" cy="45" r="7" fill="#E74C3C" />
  <circle cx="50" cy="45" r="5" fill="#C0392B" opacity="0.6" />
  <circle cx="38" cy="62" r="7" fill="#E74C3C" />
  <circle cx="38" cy="62" r="5" fill="#C0392B" opacity="0.6" />
  <circle cx="62" cy="62" r="7" fill="#E74C3C" />
  <circle cx="62" cy="62" r="5" fill="#C0392B" opacity="0.6" />
  <circle cx="50" cy="72" r="6" fill="#E74C3C" />
  <circle cx="50" cy="72" r="4" fill="#C0392B" opacity="0.6" />
  <!-- Oregano / Herbs -->
  <rect x="42" y="35" width="2" height="4" rx="1" fill="#27AE60" transform="rotate(30 42 35)" />
  <rect x="58" y="38" width="2" height="4" rx="1" fill="#27AE60" transform="rotate(-45 58 38)" />
  <rect x="48" y="58" width="2" height="4" rx="1" fill="#27AE60" transform="rotate(15 48 58)" />
  <rect x="32" y="52" width="2" height="4" rx="1" fill="#27AE60" transform="rotate(60 32 52)" />
  <rect x="68" y="52" width="2" height="4" rx="1" fill="#27AE60" transform="rotate(-30 68 52)" />
</svg>`;

export async function initMenu() {
  await loadMenuItems();
  renderCategories();
  renderMenu();
  setupEventListeners();
  updateCartUI();
}

async function loadMenuItems() {
  const cached = storage.getMenuCache();
  if (cached && cached.length > 0) {
    menuItems = cached;
    return;
  }
  
  try {
    const response = await fetch('./data/menu.json');
    if (!response.ok) throw new Error('Menu load failed');
    menuItems = await response.json();
    storage.saveMenuCache(menuItems);
  } catch (error) {
    console.error('Failed to load menu JSON, using fallback data', error);
    // Safe hardcoded fallback if network/fetch fails in some browser contexts
    menuItems = [
      { id: "1", name: "Paneer Butter Masala", category: "Curry", price: 280, isVeg: true },
      { id: "2", name: "Butter Chicken", category: "Curry", price: 320, isVeg: false },
      { id: "3", name: "Chicken Biryani", category: "Rice", price: 350, isVeg: false },
      { id: "5", name: "Butter Naan", category: "Bread", price: 60, isVeg: true },
      { id: "9", name: "Fresh Lime Soda", category: "Beverages", price: 90, isVeg: true },
      { id: "11", name: "Gulab Jamun", category: "Desserts", price: 110, isVeg: true }
    ];
    storage.saveMenuCache(menuItems);
  }
}

function renderCategories() {
  const container = $('#category-chips-container');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const activeClass = cat === currentCategory ? 'active' : '';
    return `<button class="category-chip ${activeClass}" data-category="${cat}">${cat}</button>`;
  }).join('');

  // Handle category selection click
  container.querySelectorAll('.category-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Micro-animation trigger
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = '', 100);

      container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderMenu();
    });
  });
}

export function renderMenu() {
  const container = $('#menu-grid');
  if (!container) return;

  const filtered = menuItems.filter(item => {
    // 1. Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Category filter
    if (currentCategory === 'All') return true;
    if (currentCategory === 'Veg') return item.isVeg === true;
    if (currentCategory === 'Non Veg') return item.isVeg === false;
    return item.category === currentCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No items found matching "${searchQuery}"</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const vegBadge = item.isVeg 
      ? '<span class="badge veg">Veg</span>' 
      : '<span class="badge non-veg">Non Veg</span>';
    
    // Choose appropriate SVG icon based on category (forced Pizza illustration)
    const iconSvg = PIZZA_SVG;
    const itemInCart = cart.find(c => c.id === item.id);
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;

    return `
      <div class="product-card" data-id="${item.id}">
        <div class="product-header">
          <div class="product-icon-wrapper ${item.isVeg ? 'veg-theme' : 'nonveg-theme'}">
            ${iconSvg}
          </div>
          ${vegBadge}
        </div>
        <div class="product-details">
          <h3 class="product-name">${item.name}</h3>
          <span class="product-category">${item.category}</span>
          <div class="product-footer">
            <span class="product-price">${formatCurrency(item.price)}</span>
            ${quantityInCart > 0 ? `
              <div class="quantity-selector-mini">
                <button class="btn-qty-mini decrease" data-id="${item.id}">-</button>
                <span class="qty-count-mini">${quantityInCart}</span>
                <button class="btn-qty-mini increase" data-id="${item.id}">+</button>
              </div>
            ` : `
              <button class="btn-add-item" data-id="${item.id}">Add</button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  setupMenuCardEvents(container);
}

function setupMenuCardEvents(container) {
  // Add to cart buttons
  container.querySelectorAll('.btn-add-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const item = menuItems.find(i => i.id === id);
      if (item) {
        addToCart(item);
      }
    });
  });

  // Quantity mini controls
  container.querySelectorAll('.btn-qty-mini.increase').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      updateCartQuantity(id, 1);
    });
  });

  container.querySelectorAll('.btn-qty-mini.decrease').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      updateCartQuantity(id, -1);
    });
  });
}

function setupEventListeners() {
  // Search Input live filter
  const searchInput = $('#menu-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderMenu();
    });
  }

  // Floating sheet toggle (Mobile only click trigger)
  const cartSummaryBar = $('#cart-summary-bar');
  if (cartSummaryBar) {
    cartSummaryBar.addEventListener('click', () => {
      toggleBottomSheet(true);
    });
  }

  // Close sheet button
  const closeSheetBtn = $('#close-sheet-btn');
  if (closeSheetBtn) {
    closeSheetBtn.addEventListener('click', () => {
      toggleBottomSheet(false);
    });
  }

  // Clear bottom sheet overlay background click
  const sheetOverlay = $('#bottom-sheet-overlay');
  if (sheetOverlay) {
    sheetOverlay.addEventListener('click', () => {
      toggleBottomSheet(false);
    });
  }

  // Form input bindings
  const customerInput = $('#customer-name');
  if (customerInput) {
    customerInput.addEventListener('input', (e) => {
      customerName = e.target.value;
    });
    // Micro-UX: Scroll to inputs on mobile viewports when they focus
    customerInput.addEventListener('focus', () => {
      setTimeout(() => {
        customerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    });
  }

  const notesInput = $('#order-notes');
  if (notesInput) {
    notesInput.addEventListener('input', (e) => {
      orderNotes = e.target.value;
    });
    // Micro-UX: Scroll to inputs on mobile viewports when they focus
    notesInput.addEventListener('focus', () => {
      setTimeout(() => {
        notesInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    });
  }

  // Place Order button click
  const btnPlaceOrder = $('#btn-place-order');
  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', () => {
      placeOrder();
    });
  }
}

export function toggleBottomSheet(show) {
  const bottomSheet = $('#current-order-sheet');
  const overlay = $('#bottom-sheet-overlay');
  if (!bottomSheet) return;

  if (show) {
    document.body.classList.add('cart-open');
    bottomSheet.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    // Micro-UX: Smoothly scroll to calculations and order fields on open
    setTimeout(() => {
      const sheetBody = $('.sheet-body');
      if (sheetBody) {
        sheetBody.scrollTo({
          top: sheetBody.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 200);
  } else {
    document.body.classList.remove('cart-open');
    bottomSheet.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }
}

function addToCart(item) {
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      category: item.category,
      quantity: 1
    });
  }
  updateCartUI();
  renderMenu();
}

function updateCartQuantity(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  }
  updateCartUI();
  renderMenu();
}

function deleteCartItem(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  updateCartUI();
  renderMenu();
}

function calculateBillDetails() {
  const settings = storage.getSettings();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * (settings.gstPercent / 100);
  const discount = subtotal * (settings.discountPercent / 100);
  const grandTotal = subtotal + gst - discount;

  return { subtotal, gst, discount, grandTotal };
}

function updateCartUI() {
  const cartSummaryBar = $('#cart-summary-bar');
  const cartItemCountEl = $('#cart-item-count');
  const cartTotalAmountEl = $('#cart-total-amount');
  const sheetItemsList = $('#sheet-items-list');

  // Calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal, gst, discount, grandTotal } = calculateBillDetails();

  // Update Floating Mini Bar (Mobile/Tablet)
  if (cartSummaryBar) {
    if (totalItemsCount > 0) {
      cartSummaryBar.classList.add('visible');
      if (cartItemCountEl) cartItemCountEl.textContent = `${totalItemsCount} Item${totalItemsCount > 1 ? 's' : ''}`;
      if (cartTotalAmountEl) cartTotalAmountEl.textContent = formatCurrency(grandTotal);
    } else {
      cartSummaryBar.classList.remove('visible');
      toggleBottomSheet(false);
    }
  }

  // Update Bottom Sheet Items List
  if (sheetItemsList) {
    if (cart.length === 0) {
      sheetItemsList.innerHTML = `<div class="empty-cart-message">Add dishes to start building an order.</div>`;
    } else {
      sheetItemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price-desc">${formatCurrency(item.price)} each</span>
          </div>
          <div class="cart-item-controls">
            <div class="quantity-selector">
              <button class="btn-qty decrease" data-id="${item.id}">-</button>
              <span class="qty-count">${item.quantity}</span>
              <button class="btn-qty increase" data-id="${item.id}">+</button>
            </div>
            <button class="btn-delete-item" data-id="${item.id}" aria-label="Remove item">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      `).join('');

      // Setup event listeners for cart controls
      sheetItemsList.querySelectorAll('.btn-qty.increase').forEach(btn => {
        btn.addEventListener('click', () => updateCartQuantity(btn.getAttribute('data-id'), 1));
      });
      sheetItemsList.querySelectorAll('.btn-qty.decrease').forEach(btn => {
        btn.addEventListener('click', () => updateCartQuantity(btn.getAttribute('data-id'), -1));
      });
      sheetItemsList.querySelectorAll('.btn-delete-item').forEach(btn => {
        btn.addEventListener('click', () => deleteCartItem(btn.getAttribute('data-id')));
      });
    }
  }

  // Update Summary Totals
  const subtotalEl = $('#sheet-subtotal');
  const gstEl = $('#sheet-gst');
  const discountEl = $('#sheet-discount');
  const grandTotalEl = $('#sheet-grand-total');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (gstEl) gstEl.textContent = formatCurrency(gst);
  if (discountEl) discountEl.textContent = formatCurrency(discount);
  if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);

  // Disable/enable checkout button
  const btnPlaceOrder = $('#btn-place-order');
  if (btnPlaceOrder) {
    btnPlaceOrder.disabled = cart.length === 0;
  }
}

function placeOrder() {
  if (cart.length === 0) return;

  const { subtotal, gst, discount, grandTotal } = calculateBillDetails();
  const newOrder = {
    id: generateOrderId(),
    customerName: customerName.trim() || 'Walk-in Customer',
    items: [...cart],
    notes: orderNotes.trim(),
    status: 'NEW',
    timestamp: new Date().toISOString(),
    subtotal,
    gst,
    discount,
    grandTotal,
    cashReceived: 0,
    balance: 0,
    billed: false,
    history: [
      { status: 'NEW', timestamp: new Date().toISOString() }
    ]
  };

  const existingOrders = storage.getOrders();
  existingOrders.unshift(newOrder); // Add to beginning of array
  storage.saveOrders(existingOrders);

  // Clear cart and resets
  cart = [];
  customerName = '';
  orderNotes = '';
  
  const customerInput = $('#customer-name');
  if (customerInput) customerInput.value = '';
  const notesInput = $('#order-notes');
  if (notesInput) notesInput.value = '';

  updateCartUI();
  renderMenu();
  toggleBottomSheet(false);

  // Spark a clean visual notification
  showToast(`Order ${newOrder.id} placed successfully!`);

  // Navigate user to Kitchen panel
  const kitchenTabBtn = $('[data-tab="kitchen"]');
  if (kitchenTabBtn) {
    kitchenTabBtn.click();
  }
}

function showToast(message) {
  const container = $('#toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger entering transition
  setTimeout(() => toast.classList.add('visible'), 10);

  // Dismiss after 3s
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
export { cart };
