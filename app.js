/* ==========================================================================
   GÖL RESTAURANT & CAFE (MARKO'NUN YERİ) - ANA SİTE UYGULAMA MANTIĞI
   index.html için kullanılır
   ========================================================================== */

// Application State
const state = {
  galleryIndex: 0,
  galleryItems: []
};

// DOM Elements (index.html'de mevcut olanlar)
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileDrawer = document.getElementById('mobileDrawer');
const drawerClose = document.getElementById('drawerClose');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const scrollTopBtn = document.getElementById('scrollTopBtn');

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

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

  // General Modal Toggle (Bootstrap emulation)
  document.querySelectorAll('[data-bs-toggle="modal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-bs-target');
      const modal = document.querySelector(targetId);
      if (modal) modal.style.display = 'flex';
    });
  });

  document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.style.display = 'none';
    });
  });

  // Close modals when backdrop is clicked
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.style.display = 'none';
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
      themeToggleBtn.innerHTML = currentlyLight
        ? '<i class="fa-solid fa-moon"></i>'
        : '<i class="fa-solid fa-sun"></i>';
    });
  }

  // Gallery Lightbox & Navigation
  lightboxClose?.addEventListener('click', () => {
    lightboxModal.style.display = 'none';
  });

  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) lightboxModal.style.display = 'none';
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

  // Gallery slide images → open lightbox on click
  document.querySelectorAll('.gallery-slide img').forEach((img, index) => {
    state.galleryItems.push({ src: img.src, caption: img.alt || '' });
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      state.galleryIndex = index;
      updateLightboxImage();
      if (lightboxModal) lightboxModal.style.display = 'flex';
    });
  });

  // Keyboard Navigation (ESC, Arrows)
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
      document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
    }
  });

  // Scroll to Top & ScrollSpy
  setupScrollControls();
}

function updateLightboxImage() {
  if (state.galleryItems.length === 0 || !lightboxImg) return;
  const current = state.galleryItems[state.galleryIndex];
  lightboxImg.src = current.src;
  if (lightboxCaption) lightboxCaption.textContent = current.caption;
}

// SCROLL TO TOP & SCROLLSPY
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

    // Bottom Nav scrolled class
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      bottomNav.classList.toggle('scrolled', scrollY > 50);
    }

    // Active Nav Link Observer
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (scrollY > sectionTop && scrollY <= sectionTop + section.offsetHeight) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
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
  
  if (!track || !prevBtn || !nextBtn) return;
  
  let autoSlideInterval;
  let currentIndex = 0;
  const slides = track.querySelectorAll('.gallery-slide');
  if (slides.length === 0) return;

  // Function to smoothly scroll to a specific slide index
  const scrollToSlide = (index) => {
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    currentIndex = index;
    
    // Exact position of the slide
    const targetSlide = slides[currentIndex];
    
    // We use targetSlide.offsetLeft relative to the track's content
    let scrollPos = targetSlide.offsetLeft;
    // If track itself has an offset inside the container, subtract it
    if (track.offsetParent === targetSlide.offsetParent) {
      scrollPos = targetSlide.offsetLeft - track.offsetLeft;
    }
    
    track.scrollTo({ left: scrollPos, behavior: 'smooth' });
  };

  const startAutoSlide = () => {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
      scrollToSlide(currentIndex + 1);
    }, 2500);
  };

  const stopAutoSlide = () => {
    clearInterval(autoSlideInterval);
  };

  startAutoSlide();

  track.addEventListener('mouseenter', stopAutoSlide);
  track.addEventListener('mouseleave', startAutoSlide);
  track.addEventListener('touchstart', stopAutoSlide, { passive: true });
  track.addEventListener('touchend', startAutoSlide, { passive: true });

  prevBtn.addEventListener('click', () => {
    stopAutoSlide();
    scrollToSlide(currentIndex - 1);
    startAutoSlide();
  });
  
  nextBtn.addEventListener('click', () => {
    stopAutoSlide();
    scrollToSlide(currentIndex + 1);
    startAutoSlide();
  });
  
  // Sync index if user scrolls manually
  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      let closestIndex = 0;
      let minDiff = Infinity;
      slides.forEach((slide, i) => {
        let pos = slide.offsetLeft;
        if (track.offsetParent === slide.offsetParent) {
          pos = slide.offsetLeft - track.offsetLeft;
        }
        const diff = Math.abs(track.scrollLeft - pos);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      });
      currentIndex = closestIndex;
    }, 150);
  });
});
