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
window.toggleFavorite = toggleFavorite;

function updateFavCountUI() {
  if (favCountSpan) {
    favCountSpan.textContent = state.favorites.size;
  }
}

// Global Rating Logic
let currentRating = 0;
function rate(num) {
  currentRating = num;
  const stars = document.querySelectorAll('.rating-star');
  stars.forEach((s, i) => {
    if (i < num) {
      s.classList.remove('far');
      s.classList.add('fas');
    } else {
      s.classList.remove('fas');
      s.classList.add('far');
    }
  });
}
window.rate = rate;

function sendRating() {
  if (currentRating === 0) {
    alert("Lütfen önce bir puan seçiniz!");
    return;
  }
  alert("Geri bildiriminiz için teşekkür ederiz!");
  
  // Clear and close modal
  currentRating = 0;
  const stars = document.querySelectorAll('.rating-star');
  stars.forEach(s => {
    s.classList.remove('fas');
    s.classList.add('far');
  });
  const userComment = document.getElementById('userComment');
  if (userComment) userComment.value = '';
  
  const ratingModal = document.getElementById('ratingModal');
  if (ratingModal) ratingModal.style.display = 'none';
}
window.sendRating = sendRating;

// EVENT LISTENERS SETUP
function setupEventListeners() {




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

  // Random Dish Picker Modal Events
  randomPickerBtn?.addEventListener('click', pickRandomDish);
  spinAgainBtn?.addEventListener('click', pickRandomDish);
  randomDishClose?.addEventListener('click', () => {
    randomDishModal.style.display = 'none';
  });

  // General Modal Toggle Event Listeners (Bootstrap emulation)
  document.querySelectorAll('[data-bs-toggle="modal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-bs-target');
      const modal = document.querySelector(targetId);
      if (modal) {
        modal.style.display = 'flex';
      }
    });
  });

  document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Close modals when backdrop is clicked
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = 'none';
      }
    });
  });

  // Theme Toggler
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    const isLight = localStorage.getItem('gol_theme') === 'light';
    if (isLight) {
      document.body.classList.add('light-theme');
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const currentlyLight = document.body.classList.contains('light-theme');
      localStorage.setItem('gol_theme', currentlyLight ? 'light' : 'dark');
      themeToggleBtn.innerHTML = currentlyLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });
  }

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
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => {
        m.style.display = 'none';
      });
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
  // Disabled as per user request - static 7/24
}

// SCROLL TO TOP & SCROLLSPY CONTROLS
function setupScrollControls() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Scroll to Top visibility
    if (scrollY > 400) {
      scrollTopBtn?.classList.add('visible');
    } else {
      scrollTopBtn?.classList.remove('visible');
    }

    // Bottom Nav scrolled class toggle
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      if (scrollY > 50) {
        bottomNav.classList.add('scrolled');
      } else {
        bottomNav.classList.remove('scrolled');
      }
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





// --- GALLERY SLIDER LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('galleryTrack');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  
  let autoSlideInterval;

  const startAutoSlide = () => {
    autoSlideInterval = setInterval(() => {
      if (!track) return;
      // If reached the end, loop back to start
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }); // Scroll by slide width
      }
    }, 2500); // Auto slide every 2.5 seconds
  };

  const stopAutoSlide = () => {
    clearInterval(autoSlideInterval);
  };

  if (track && prevBtn && nextBtn) {
    startAutoSlide(); // Start initially

    // Pause on hover or touch
    track.addEventListener('mouseenter', stopAutoSlide);
    track.addEventListener('mouseleave', startAutoSlide);
    track.addEventListener('touchstart', stopAutoSlide);
    track.addEventListener('touchend', startAutoSlide);

    prevBtn.addEventListener('click', () => {
      stopAutoSlide();
      track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
      startAutoSlide();
    });
    
    nextBtn.addEventListener('click', () => {
      stopAutoSlide();
      track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
      startAutoSlide();
    });
  }
});
