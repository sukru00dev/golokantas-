/* ==========================================================================
   GÖL RESTAURANT & CAFE (MARKO'NUN YERİ) - DİNAMİK QR MENÜ VE UYGULAMA MANTIĞI
   ========================================================================== */

let MENU_DATA = [];

// Application State
let state = {
  currentCategory: 'all',
  quickFilter: 'all',
  searchQuery: '',
  favorites: new Set(JSON.parse(localStorage.getItem('gol_favs') || '[]')),
  galleryIndex: 0,
  galleryItems: []
};

// DOM Elements
const menuItemsGrid = document.getElementById('menuItemsGrid');
const noResultsState = document.getElementById('noResultsState');
const menuSearchInput = document.getElementById('menuSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const categoryPills = document.getElementById('categoryPills');
const quickFilterTags = document.getElementById('quickFilterTags');
const favCountSpan = document.getElementById('favCount');

// Mobile drawer & backdrop
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileDrawer = document.getElementById('mobileDrawer');
const drawerClose = document.getElementById('drawerClose');
const drawerBackdrop = document.getElementById('drawerBackdrop');

// Lightbox elements
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

// Item Detail Modal
const itemDetailModal = document.getElementById('itemDetailModal');
const itemDetailClose = document.getElementById('itemDetailClose');
const detailModalImg = document.getElementById('detailModalImg');
const detailModalBadge = document.getElementById('detailModalBadge');
const detailModalTitle = document.getElementById('detailModalTitle');
const detailModalPrice = document.getElementById('detailModalPrice');
const detailModalPortion = document.getElementById('detailModalPortion');
const detailModalDesc = document.getElementById('detailModalDesc');
const detailModalFeatures = document.getElementById('detailModalFeatures');

// Random Dish Picker Modal
const randomPickerBtn = document.getElementById('randomPickerBtn');
const randomDishModal = document.getElementById('randomDishModal');
const randomDishClose = document.getElementById('randomDishClose');
const spinAgainBtn = document.getElementById('spinAgainBtn');
const randomItemTitle = document.getElementById('randomItemTitle');
const randomItemCategory = document.getElementById('randomItemCategory');
const randomItemPrice = document.getElementById('randomItemPrice');
const randomItemDesc = document.getElementById('randomItemDesc');

// Scroll To Top Button, Live Status & Table Badge
const scrollTopBtn = document.getElementById('scrollTopBtn');
const liveStatusPill = document.getElementById('liveStatusPill');
const tableBadgeHeader = document.getElementById('tableBadgeHeader');
const tableBadgeNum = document.getElementById('tableBadgeNum');

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  checkUrlTableParameter();
  initGalleryItems();
  loadMenuFromJson();
  setupEventListeners();
  updateLiveStatus();
  updateFavCountUI();
});

// CHECK URL FOR TABLE NUMBER (e.g. menu.html?masa=4 or ?table=4)
function checkUrlTableParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const masaNo = urlParams.get('masa') || urlParams.get('table') || urlParams.get('qr');
  if (masaNo && tableBadgeHeader && tableBadgeNum) {
    tableBadgeNum.textContent = `Masa ${masaNo}`;
    tableBadgeHeader.style.display = 'inline-flex';
  }
}

// FETCH MENU DATA FROM JSON FILE
async function loadMenuFromJson() {
  try {
    const response = await fetch('data/menu.json');
    if (!response.ok) throw new Error('JSON okunamadı');
    MENU_DATA = await response.json();
    renderMenuItems();
  } catch (error) {
    console.error('JSON Yükleme Hatası:', error);
  }
}

// RENDER MENU ITEMS WITH FILTERS & FAVORITES
function renderMenuItems() {
  if (!menuItemsGrid) return;

  const filtered = MENU_DATA.filter(item => {
    const matchesCategory = state.currentCategory === 'all' || item.category === state.currentCategory;
    
    let matchesQuick = true;
    if (state.quickFilter === 'popular') matchesQuick = !!item.popular;
    else if (state.quickFilter === 'chef') matchesQuick = !!item.chefChoice;
    else if (state.quickFilter === 'spicy') matchesQuick = !!item.spicy;
    else if (state.quickFilter === 'favorites') matchesQuick = state.favorites.has(item.id);

    const query = state.searchQuery.toLowerCase();
    const matchesSearch = !query || 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query);

    return matchesCategory && matchesQuick && matchesSearch;
  });

  if (filtered.length === 0) {
    menuItemsGrid.style.display = 'none';
    noResultsState.style.display = 'block';
    return;
  }

  menuItemsGrid.style.display = 'grid';
  noResultsState.style.display = 'none';

  menuItemsGrid.innerHTML = filtered.map(item => {
    const isFav = state.favorites.has(item.id);

    return `
      <div class="menu-card" data-id="${item.id}" onclick="openItemDetail(${item.id})">
        <div class="card-img-wrapper">
          <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='asset/balıklıgöl.jpg';">
          ${item.badge ? `<span class="card-badge ${item.spicy ? 'spicy' : ''}">${item.badge}</span>` : (item.spicy ? `<span class="card-badge spicy"><i class="fa-solid fa-pepper-hot"></i> Acılı</span>` : '')}
          <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${item.id}, event)" aria-label="Favorilere Ekle">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <h3 class="item-title">
              ${item.title} 
              ${item.spicy ? '<i class="fa-solid fa-pepper-hot spicy-icon" style="color: #FF5A5F; font-size: 0.85rem; margin-left: 4px;" title="Acılı"></i>' : ''}
            </h3>
            <span class="item-price">${item.price} ₺</span>
          </div>
          <p class="item-desc">${item.description}</p>
          <div class="card-footer-row">
            <span class="portion-info"><i class="fa-solid fa-scale-balanced"></i> ${item.portion}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// OPEN ITEM DETAIL MODAL (GURME DETAY POPUP)
function openItemDetail(itemId) {
  const item = MENU_DATA.find(m => m.id == itemId);
  if (!item || !itemDetailModal) return;

  detailModalImg.src = item.image;
  detailModalTitle.textContent = item.title;
  detailModalPrice.textContent = `${item.price} ₺`;
  detailModalPortion.innerHTML = `<i class="fa-solid fa-scale-balanced"></i> ${item.portion}`;
  detailModalDesc.textContent = item.description;

  if (item.badge) {
    detailModalBadge.textContent = item.badge;
    detailModalBadge.className = `card-badge ${item.spicy ? 'spicy' : ''}`;
    detailModalBadge.style.display = 'inline-block';
  } else {
    detailModalBadge.style.display = 'none';
  }

  // Generate Feature Pills
  let featuresHtml = `<span class="detail-feature-pill"><i class="fa-solid fa-utensils"></i> Kategori: ${getCategoryLabel(item.category)}</span>`;
  if (item.spicy) featuresHtml += `<span class="detail-feature-pill" style="color: #FF5A5F; border-color: #FF5A5F;"><i class="fa-solid fa-pepper-hot"></i> Acılı Harç</span>`;
  if (item.chefChoice) featuresHtml += `<span class="detail-feature-pill" style="color: var(--gold-primary);"><i class="fa-solid fa-star"></i> Şefin Seçimi</span>`;
  if (item.popular) featuresHtml += `<span class="detail-feature-pill"><i class="fa-solid fa-fire"></i> Çok Satan</span>`;
  featuresHtml += `<span class="detail-feature-pill"><i class="fa-solid fa-check"></i> Günlük Taze Servis</span>`;

  detailModalFeatures.innerHTML = featuresHtml;
  itemDetailModal.style.display = 'flex';
}

function getCategoryLabel(cat) {
  const map = {
    kebap: 'Kebap & Izgara',
    yoresel: 'Yöresel Lezzetler',
    meze: 'Meze & Salata',
    tatli: 'Tatlılar',
    icecek: 'İçecekler & Mırra',
    nargile: 'Nargile Çeşitleri'
  };
  return map[cat] || cat;
}

// RANDOM DISH PICKER ("Bugün Ne Yesem?")
function pickRandomDish() {
  if (MENU_DATA.length === 0 || !randomDishModal) return;
  
  const randomIndex = Math.floor(Math.random() * MENU_DATA.length);
  const item = MENU_DATA[randomIndex];

  randomItemTitle.textContent = item.title;
  randomItemCategory.textContent = getCategoryLabel(item.category);
  randomItemPrice.textContent = `${item.price} ₺`;
  randomItemDesc.textContent = item.description;

  randomDishModal.style.display = 'flex';
}

// TOGGLE FAVORITES
function toggleFavorite(itemId, event) {
  if (event) event.stopPropagation();
  if (state.favorites.has(itemId)) {
    state.favorites.delete(itemId);
  } else {
    state.favorites.add(itemId);
  }
  localStorage.setItem('gol_favs', JSON.stringify(Array.from(state.favorites)));
  updateFavCountUI();
  renderMenuItems();
}

function updateFavCountUI() {
  if (favCountSpan) {
    favCountSpan.textContent = state.favorites.size;
  }
}

// EVENT LISTENERS SETUP
function setupEventListeners() {
  // Search Input
  menuSearchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderMenuItems();
  });

  clearSearchBtn?.addEventListener('click', () => {
    menuSearchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderMenuItems();
  });

  resetSearchBtn?.addEventListener('click', () => {
    menuSearchInput.value = '';
    state.searchQuery = '';
    state.currentCategory = 'all';
    state.quickFilter = 'all';
    
    document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.pill-btn[data-category="all"]')?.classList.add('active');

    document.querySelectorAll('.quick-tag-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.quick-tag-btn[data-filter="all"]')?.classList.add('active');

    clearSearchBtn.style.display = 'none';
    renderMenuItems();
  });

  // Category Pills
  categoryPills?.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;

    document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.currentCategory = btn.dataset.category;
    renderMenuItems();
  });

  // Quick Filter Badges
  quickFilterTags?.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-tag-btn');
    if (!btn) return;

    document.querySelectorAll('.quick-tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.quickFilter = btn.dataset.filter;
    renderMenuItems();
  });

  // Mobile Drawer Navigation & Backdrop
  function openDrawer() {
    mobileDrawer?.classList.add('active');
    drawerBackdrop?.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  function closeDrawer() {
    mobileDrawer?.classList.remove('active');
    drawerBackdrop?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  mobileMenuToggle?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Item Detail Modal Close
  itemDetailClose?.addEventListener('click', () => {
    itemDetailModal.style.display = 'none';
  });

  itemDetailModal?.addEventListener('click', (e) => {
    if (e.target === itemDetailModal) {
      itemDetailModal.style.display = 'none';
    }
  });

  // Random Dish Picker Modal Events
  randomPickerBtn?.addEventListener('click', pickRandomDish);
  spinAgainBtn?.addEventListener('click', pickRandomDish);
  randomDishClose?.addEventListener('click', () => {
    randomDishModal.style.display = 'none';
  });

  randomDishModal?.addEventListener('click', (e) => {
    if (e.target === randomDishModal) {
      randomDishModal.style.display = 'none';
    }
  });

  // Gallery Lightbox & Navigation
  lightboxClose?.addEventListener('click', () => {
    lightboxModal.style.display = 'none';
  });

  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
      lightboxModal.style.display = 'none';
    }
  });

  lightboxPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.galleryIndex = (state.galleryIndex - 1 + state.galleryItems.length) % state.galleryItems.length;
    updateLightboxImage();
  });

  lightboxNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.galleryIndex = (state.galleryIndex + 1) % state.galleryItems.length;
    updateLightboxImage();
  });

  // Global Keyboard Navigation (ESC, Left, Right)
  document.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.style.display === 'flex') {
      if (e.key === 'Escape') lightboxModal.style.display = 'none';
      if (e.key === 'ArrowLeft') {
        state.galleryIndex = (state.galleryIndex - 1 + state.galleryItems.length) % state.galleryItems.length;
        updateLightboxImage();
      }
      if (e.key === 'ArrowRight') {
        state.galleryIndex = (state.galleryIndex + 1) % state.galleryItems.length;
        updateLightboxImage();
      }
    } else if (itemDetailModal && itemDetailModal.style.display === 'flex' && e.key === 'Escape') {
      itemDetailModal.style.display = 'none';
    } else if (randomDishModal && randomDishModal.style.display === 'flex' && e.key === 'Escape') {
      randomDishModal.style.display = 'none';
    }
  });

  // Scroll to Top & ScrollSpy
  setupScrollControls();
}

// GALLERY ITEMS INITIALIZATION
function initGalleryItems() {
  const items = document.querySelectorAll('.gallery-item');
  state.galleryItems = [];

  items.forEach((item, index) => {
    const src = item.getAttribute('data-src');
    const caption = item.querySelector('span')?.textContent || '';
    state.galleryItems.push({ src, caption });

    item.addEventListener('click', () => {
      state.galleryIndex = index;
      updateLightboxImage();
      lightboxModal.style.display = 'flex';
    });
  });
}

function updateLightboxImage() {
  if (state.galleryItems.length === 0 || !lightboxImg) return;
  const current = state.galleryItems[state.galleryIndex];
  lightboxImg.src = current.src;
  if (lightboxCaption) lightboxCaption.textContent = current.caption;
}

// LIVE OPENING HOURS STATUS BADGE
function updateLiveStatus() {
  if (!liveStatusPill) return;

  const now = new Date();
  const day = now.getDay(); // 0: Sunday, 6: Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeVal = hours * 60 + minutes;

  const openTime = 8 * 60; // 08:00
  const closeTimeWeekday = 25 * 60; // 01:00 (next day)
  const closeTimeWeekend = 26 * 60; // 02:00 (next day)

  const isWeekend = (day === 0 || day === 6);
  const closingLimit = isWeekend ? closeTimeWeekend : closeTimeWeekday;

  // Normalize time for past midnight (00:00 - 02:00)
  let adjustedTime = timeVal;
  if (hours < 5) adjustedTime += 24 * 60;

  if (adjustedTime >= openTime && adjustedTime < closingLimit) {
    liveStatusPill.className = 'live-status-pill open';
    liveStatusPill.innerHTML = `<i class="fa-solid fa-circle"></i> Şu An Açığız (${isWeekend ? '08:00 - 02:00' : '08:00 - 01:00'})`;
  } else {
    liveStatusPill.className = 'live-status-pill closed';
    liveStatusPill.innerHTML = `<i class="fa-solid fa-circle"></i> Kapalı (Açılış: 08:00)`;
  }
}

// SCROLL TO TOP & SCROLLSPY CONTROLS
function setupScrollControls() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    // Scroll to Top visibility
    if (scrollY > 400) {
      scrollTopBtn?.classList.add('visible');
    } else {
      scrollTopBtn?.classList.remove('visible');
    }

    // Active Nav Link Observer
    let current = '';
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


