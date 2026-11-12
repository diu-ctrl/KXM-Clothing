(function () {
  const shopGrid = document.getElementById('shopGrid');
  if (!shopGrid || !window.KXM_PRODUCTS) return;

  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get('category') || 'all';
  activeCategory = activeCategory.toLowerCase();
  if (!['all', 'clothing', 'accessories'].includes(activeCategory)) {
    activeCategory = 'all';
  }

  let activeSort = 'featured';

  const allEntries = Object.entries(window.KXM_PRODUCTS);

  // Update chip count labels
  const clothingCount = allEntries.filter(function (entry) { return entry[1].category === 'clothing'; }).length;
  const accessoriesCount = allEntries.filter(function (entry) { return entry[1].category === 'accessories'; }).length;
  const allCount = allEntries.length;

  const countAllEl = document.getElementById('countAll');
  const countClothingEl = document.getElementById('countClothing');
  const countAccessoriesEl = document.getElementById('countAccessories');
  if (countAllEl) countAllEl.textContent = allCount;
  if (countClothingEl) countClothingEl.textContent = clothingCount;
  if (countAccessoriesEl) countAccessoriesEl.textContent = accessoriesCount;

  function renderGrid() {
    var filtered = allEntries.filter(function (entry) {
      if (activeCategory === 'all') return true;
      return entry[1].category === activeCategory;
    });

    if (activeSort === 'price-asc') {
      filtered.sort(function (a, b) {
        var pA = parseInt(a[1].price.replace(/[^\d]/g, ''), 10) || 0;
        var pB = parseInt(b[1].price.replace(/[^\d]/g, ''), 10) || 0;
        return pA - pB;
      });
    } else if (activeSort === 'price-desc') {
      filtered.sort(function (a, b) {
        var pA = parseInt(a[1].price.replace(/[^\d]/g, ''), 10) || 0;
        var pB = parseInt(b[1].price.replace(/[^\d]/g, ''), 10) || 0;
        return pB - pA;
      });
    }

    var titleRight = document.querySelector('.shop-title-bar .title-right');
    if (titleRight) {
      titleRight.textContent = '(' + filtered.length + ')';
    }

    shopGrid.innerHTML = filtered.map(function (entry, idx) {
      var id = entry[0];
      var product = entry[1];
      var delayMod = idx % 6;
      var delayClass = delayMod === 0 ? '' : ' js-reveal-delay-' + delayMod;
      var hasHover = product.images && product.images.length > 1;
      var hoverImgHtml = hasHover
        ? '<img class="hover-img" src="' + product.images[1] + '" alt="' + product.name + ' alternate view" loading="lazy" ' + window.KXM_IMG_ATTRS(product.images[1]) + ' />'
        : '';
      var hoverClass = hasHover ? ' has-hover' : ' single-img';

      return (
        '<a href="product.html?id=' + id + '" class="product-card js-reveal' + delayClass + hoverClass + '">' +
          '<div class="product-img-container">' +
            '<img class="default-img" src="' + product.images[0] + '" alt="' + product.name + '" loading="lazy" ' + window.KXM_IMG_ATTRS(product.images[0]) + ' />' +
            hoverImgHtml +
          '</div>' +
          '<div class="product-info">' +
            '<div class="product-info-row">' +
              '<span class="product-name">' + product.name + '</span>' +
              '<span class="product-price">' + product.price + '</span>' +
            '</div>' +
            '<div class="product-hover-action">View Product</div>' +
          '</div>' +
        '</a>'
      );
    }).join('');

    // Observe reveal elements
    var revealEls = shopGrid.querySelectorAll('.js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Bind chip buttons
  var chipButtons = document.querySelectorAll('.filter-chip');
  chipButtons.forEach(function (btn) {
    var cat = btn.dataset.category;
    if (cat === activeCategory) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    btn.addEventListener('click', function () {
      activeCategory = btn.dataset.category;
      chipButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderGrid();
    });
  });

  // Bind sort buttons
  var sortButtons = document.querySelectorAll('.sort-btn');
  sortButtons.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.sort === activeSort);
    btn.addEventListener('click', function () {
      activeSort = btn.dataset.sort;
      sortButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderGrid();
    });
  });

  renderGrid();

  // Unified Menu Overlay logic for shop.html
  var body = document.body;
  var menuToggle = document.getElementById('menuToggle');
  var menuBackdrop = document.getElementById('menuBackdrop');
  var menuLinks = document.querySelectorAll('.menu-link');

  function openMenu() {
    body.classList.add('menu-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    body.classList.remove('menu-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (body.classList.contains('menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });
  }

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMenu);
  }

  menuLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) {
      closeMenu();
    }
  });
})();
