/* ==========================================================================
   GÖL RESTAURANT - MENU APP JS (Nova Plus UI/UX Entegrasyon)
   ========================================================================== */

let MENU_DATA = [];

const CATEGORIES = [
  { id: 'kebap', label: 'KEBAP ÇEŞİTLERİ', banner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80' },
  { id: 'pide', label: 'PİDE ÇEŞİTLERİ', banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80' },
  { id: 'salata', label: 'SALATALAR', banner: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
  { id: 'kahvalti', label: 'KAHVALTI ÇEŞİTLERİ', banner: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80' },
  { id: 'tatli', label: 'TATLI ÇEŞİTLERİ', banner: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80' },
  { id: 'icecek', label: 'İÇECEK ÇEŞİTLERİ', banner: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', splitDrinks: true },
  { id: 'nargile', label: 'NARGİLE ÇEŞİTLERİ', banner: 'asset/menuler/nargile.jpg' },
  { id: 'dondurma', label: 'DONDURMA ÇEŞİTLERİ', banner: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80' }
];

const ALLERGEN_ICONS = {
  "Gluten": "fa-wheat-awn",
  "Süt Ürünleri": "fa-cow",
  "Sert Kabuklu Meyveler": "fa-seedling",
  "Yumurta": "fa-egg"
};

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadMenuData();
  setupThemeToggle();
  setupSearch();
  setupModals();
  setupScrollBehavior();
});

// ── Load Data ──
async function loadMenuData() {
  try {
    const res = await fetch('data/menu.json?v=' + new Date().getTime());
    if (!res.ok) throw new Error('JSON yüklenemedi');
    MENU_DATA = await res.json();
    renderCategoryGrid();
  } catch (err) {
    console.error('Menü yükleme hatası:', err);
  }
}



// ── Category Grid (Collapsible Accordion) ──
function renderCategoryGrid(searchQuery = '') {
  const grid = document.getElementById('categoryGrid');
  const noResults = document.getElementById('noResultsState');
  if (!grid) return;

  const query = searchQuery.toLowerCase().trim();
  let totalVisible = 0;
  let html = '';

  CATEGORIES.forEach((cat, idx) => {
    let catItems = MENU_DATA.filter(i => i.category === cat.id);

    if (query) {
      catItems = catItems.filter(i =>
        i.title.toLowerCase().includes(query) ||
        (i.description && i.description.toLowerCase().includes(query))
      );
    }

    if (catItems.length === 0) return;
    totalVisible += catItems.length;

    // First category or search active = expanded
    const expanded = query || idx === 0;
    const ariaExp = expanded ? 'true' : 'false';
    const wrapperClass = expanded ? '' : 'collapsed';

    if (cat.splitDrinks) {
      const coldDrinks = catItems.filter(item => item.subcategory === 'soguk');
      const hotDrinks = catItems.filter(item => item.subcategory === 'sicak');
      
      let drinksHtml = '';
      if (coldDrinks.length > 0) {
        drinksHtml += `
          <div class="drink-subcategory-section mt-3 mb-2" style="width: 100%; grid-column: 1 / -1;">
            <h6 class="subcategory-title fw-bold" style="color: #5AC8FA; font-size: 0.9rem;"><i class="fa-solid fa-snowflake"></i> Soğuk İçecekler</h6>
          </div>
          ${coldDrinks.map(item => renderProductCard(item)).join('')}
        `;
      }
      if (hotDrinks.length > 0) {
        drinksHtml += `
          <div class="drink-subcategory-section mt-3 mb-2" style="width: 100%; grid-column: 1 / -1;">
            <h6 class="subcategory-title fw-bold" style="color: #FF9500; font-size: 0.9rem;"><i class="fa-solid fa-mug-hot"></i> Sıcak İçecekler</h6>
          </div>
          ${hotDrinks.map(item => renderProductCard(item)).join('')}
        `;
      }
      
      html += `
      <div class="category-item-wrapper" style="display: contents;">
        <div class="category-card" type="button" aria-expanded="${ariaExp}" onclick="toggleCategory(this)">
          <div class="category-header">
            <img src="${cat.banner}" alt="${cat.label}" loading="lazy">
            <div class="category-title">${cat.label}</div>
          </div>
        </div>
        <div class="category-products-wrapper ${wrapperClass}" id="products-${cat.id}">
          <div class="product-grid">
            ${drinksHtml}
          </div>
        </div>
      </div>`;
    } else {
      html += `
      <div class="category-item-wrapper" style="display: contents;">
        <div class="category-card" type="button" aria-expanded="${ariaExp}" onclick="toggleCategory(this)">
          <div class="category-header">
            <img src="${cat.banner}" alt="${cat.label}" loading="lazy">
            <div class="category-title">${cat.label}</div>
          </div>
        </div>
        <div class="category-products-wrapper ${wrapperClass}" id="products-${cat.id}">
          <div class="product-grid">
            ${catItems.map(item => renderProductCard(item)).join('')}
          </div>
        </div>
      </div>`;
    }
  });

  grid.innerHTML = html;

  if (totalVisible === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'block';
  } else {
    grid.style.display = '';
    noResults.style.display = 'none';
  }

}

// ── Product Card ──
function renderProductCard(item) {
  const price = formatPrice(item.price);
  const badgeHtml = item.badge
    ? `<span class="badge-v3">${item.badge}</span>`
    : (item.spicy ? `<span class="badge-v3" style="background:#ff4757;">🌶️ Acılı</span>` : '');
  const dateHtml = item.lastUpdated
    ? `<div class="product-date-v3"><i class="fa-regular fa-clock"></i> ${item.lastUpdated}</div>`
    : '';

  return `
    <div class="product-card-v3" onclick="openProductModal(${item.id})">
      <img src="${item.image}" alt="${item.title}" class="product-img-v3" loading="lazy" onerror="this.src='asset/balıklıgöl.jpg'">
      ${badgeHtml}
      <div class="product-info-v3">
        <div class="product-name-v3">${item.title}</div>
        <div class="product-desc-v3">${item.description || ''}</div>
        <div class="product-price-v3">${price}</div>
        ${dateHtml}
      </div>
    </div>`;
}

// ── Toggle Category ──
function toggleCategory(card) {
  const wrapper = card.nextElementSibling;
  if (!wrapper) return;

  const isExpanded = card.getAttribute('aria-expanded') === 'true';

  if (isExpanded) {
    card.setAttribute('aria-expanded', 'false');
    wrapper.classList.add('collapsed');
  } else {
    card.setAttribute('aria-expanded', 'true');
    wrapper.classList.remove('collapsed');
  }
}
window.toggleCategory = toggleCategory;

// ── Product Modal ──
function openProductModal(id) {
  const item = MENU_DATA.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('productModal');
  if (!modal) return;


  document.getElementById('modalTitle').textContent = item.title;
  document.getElementById('modalPrice').textContent = formatPrice(item.price);
  document.getElementById('modalDesc').textContent = item.description || '';
  document.getElementById('modalPortion').innerHTML = item.portion
    ? `<i class="fa-solid fa-scale-balanced"></i> ${item.portion}`
    : '';

  // Badge
  const badgeEl = document.getElementById('modalBadge');
  if (item.badge) {
    badgeEl.textContent = item.badge;
    badgeEl.style.display = 'inline-block';
    badgeEl.style.background = 'var(--primary-color)';
    badgeEl.style.color = '#fff';
    badgeEl.style.borderRadius = '6px';
    badgeEl.style.padding = '3px 8px';
    badgeEl.style.fontSize = '0.75rem';
  } else if (item.spicy) {
    badgeEl.innerHTML = '🌶️ Acılı';
    badgeEl.style.display = 'inline-block';
    badgeEl.style.background = '#ff4757';
    badgeEl.style.color = '#fff';
    badgeEl.style.borderRadius = '6px';
    badgeEl.style.padding = '3px 8px';
    badgeEl.style.fontSize = '0.75rem';
  } else {
    badgeEl.style.display = 'none';
  }

  // Calories
  const calEl = document.getElementById('modalCalories');
  const calText = document.getElementById('modalCaloriesText');
  if (item.calories && item.calories > 0) {
    calText.textContent = item.calories;
    calEl.style.display = 'block';
  } else {
    calEl.style.display = 'none';
  }

  // Last Updated
  const updEl = document.getElementById('modalUpdated');
  if (item.lastUpdated) {
    updEl.innerHTML = `<i class="fa-regular fa-clock me-1"></i> Son Güncelleme: ${item.lastUpdated}`;
    updEl.style.display = 'block';
  } else {
    updEl.style.display = 'none';
  }

  // Allergens
  const algContainer = document.getElementById('modalAllergens');
  const algContent = document.getElementById('modalAllergensContent');
  if (item.allergens && item.allergens.length > 0) {
    algContent.innerHTML = item.allergens.map(a => {
      const icon = ALLERGEN_ICONS[a] || 'fa-circle-exclamation';
      return `<span class="allergen-pill"><i class="fa-solid ${icon}"></i> ${a}</span>`;
    }).join('');
    algContainer.style.display = 'block';
  } else {
    algContainer.style.display = 'none';
  }

  // Show modal
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.background = 'rgba(0,0,0,0.6)';
  modal.style.backdropFilter = 'blur(4px)';
  modal.style.zIndex = '3000';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '15px';
  document.body.style.overflow = 'hidden';
}
window.openProductModal = openProductModal;

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ── Theme Toggle ──
function setupThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;

  const saved = localStorage.getItem('gol_theme');
  if (saved === 'light') {
    document.body.classList.remove('dark');
    document.body.classList.add('light-theme');
    btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  btn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      document.body.classList.remove('dark');
      document.body.classList.add('light-theme');
      localStorage.setItem('gol_theme', 'light');
      btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark');
      localStorage.setItem('gol_theme', 'dark');
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  });
}

// ── Search ──
function setupSearch() {
  const input = document.getElementById('menuSearchInput');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderCategoryGrid(input.value);
    }, 250);
  });

  const resetBtn = document.getElementById('resetSearchBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      input.value = '';
      renderCategoryGrid();
    });
  }
}

// ── Modals ──
function setupModals() {
  // Product modal close
  const closeBtn = document.getElementById('modalCloseBtn');
  const floatingClose = document.getElementById('modalFloatingClose');
  const productModal = document.getElementById('productModal');

  if (closeBtn) closeBtn.addEventListener('click', closeProductModal);
  if (floatingClose) floatingClose.addEventListener('click', closeProductModal);
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal || e.target.classList.contains('modal-dialog')) {
        closeProductModal();
      }
    });
  }

  // Custom modal open triggers
  const modalMap = {
    'ratingNavBtn': 'ratingModal',
    'socialNavBtn': 'socialModal',
    'legalBtn': 'legalModal'
  };

  Object.entries(modalMap).forEach(([btnId, modalId]) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (btn && modal) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
      });
    }
  });

  // Custom modal close
  document.querySelectorAll('[data-dismiss]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-dismiss');
      const modal = document.getElementById(modalId);
      if (modal) modal.style.display = 'none';
    });
  });

  // Close custom modals on overlay click
  document.querySelectorAll('.custom-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      document.querySelectorAll('.custom-modal-overlay').forEach(m => m.style.display = 'none');
    }
  });
}

// ── Scroll Behavior ──
function setupScrollBehavior() {
  const bottomNav = document.getElementById('bottomNav');
  if (!bottomNav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      bottomNav.classList.add('scrolled');
    } else {
      bottomNav.classList.remove('scrolled');
    }
  });
}

// ── Rating System ──
let currentRating = 0;
function rate(num) {
  currentRating = num;
  document.querySelectorAll('.rating-star').forEach((s, i) => {
    s.classList.toggle('fas', i < num);
    s.classList.toggle('far', i >= num);
  });
}
window.rate = rate;

function sendRating() {
  if (currentRating === 0) { alert("Lütfen önce bir puan seçiniz!"); return; }
  alert("Geri bildiriminiz için teşekkür ederiz!");
  currentRating = 0;
  document.querySelectorAll('.rating-star').forEach(s => { s.classList.remove('fas'); s.classList.add('far'); });
  const comment = document.getElementById('userComment');
  if (comment) comment.value = '';
  const modal = document.getElementById('ratingModal');
  if (modal) modal.style.display = 'none';
}
window.sendRating = sendRating;

// ── Helpers ──
function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'Sorunuz';
  if (typeof price === 'number') {
    return price.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺';
  }
  // String prices like 'İkram' should not get ₺ suffix
  return price;
}
