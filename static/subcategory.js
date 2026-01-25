// 청호나이스 렌탈 - 서브카테고리 페이지

const app = document.getElementById('app');

// 금액 포맷팅 유틸리티 함수 (숫자에 콤마 추가)
function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '';
  const numStr = String(price).replace(/[^0-9]/g, '');
  if (!numStr) return price;
  return parseInt(numStr, 10).toLocaleString('ko-KR');
}

// 제휴카드 할인 적용 가격 계산 (대표 월렌탈료 - 제휴카드 가격)
function calculateDiscountedPrice(product) {
  const originalPrice = parseInt(String(product.price || product.rentalPrice || '0').replace(/[^0-9]/g, '')) || 0;
  const cardPrice = parseInt(String(product.cardPrice || '0').replace(/[^0-9]/g, '')) || 0;
  
  if (cardPrice > 0) {
    // 제휴카드 가격이 있으면: 월렌탈료 - 제휴카드 가격
    // 월렌탈료 ≤ 제휴카드 가격이면 0
    return originalPrice > cardPrice ? originalPrice - cardPrice : 0;
  }
  // 제휴카드 가격이 없으면 원래 가격 표시
  return originalPrice;
}

// 제품을 displayOrder로 정렬하는 함수
function sortByDisplayOrder(productList) {
  return [...productList].sort((a, b) => {
    const orderA = a.displayOrder || a.id || 0;
    const orderB = b.displayOrder || b.id || 0;
    return orderA - orderB;
  });
}
const mainCategory = window.mainCategory || '정수기';
const subCategory = window.subCategory || '얼음정수기';

let products = [];
let settings = {};

// 초기화
async function init() {
  await loadData();
  renderPage();
}

// 데이터 로드
async function loadData() {
  try {
    const [productsRes, settingsRes] = await Promise.all([
      axios.get('/api/products'),
      axios.get('/api/settings')
    ]);
    products = productsRes.data;
    settings = settingsRes.data;
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
  }
}

// 페이지 렌더링
function renderPage() {
  // 서브카테고리에 해당하는 제품만 필터링
  let filteredProducts;
  
  if (subCategory === '전체') {
    // '전체'인 경우 해당 카테고리의 모든 제품
    filteredProducts = sortByDisplayOrder(products.filter(p => p.category === mainCategory));
  } else {
    // 특정 서브카테고리
    filteredProducts = sortByDisplayOrder(products.filter(p => 
      p.category === mainCategory && p.subCategory === subCategory
    ));
  }

  app.innerHTML = `
    ${renderHeader()}
    ${renderBreadcrumb()}
    ${renderCategoryHeader()}
    ${renderProductGrid(filteredProducts)}
    ${renderFooter()}
  `;
  
  // DOM 렌더링 후 슬라이더 시작
  setTimeout(() => {
    startCategoryProductSliders();
  }, 100);
}

// 헤더
function renderHeader() {
  const fixedMenu = [
    { 
      name: '정수기', 
      link: '#',
      submenu: [
        { name: '얼음정수기', link: '/category/정수기/얼음정수기' },
        { name: '냉온정수기', link: '/category/정수기/냉온정수기' },
        { name: '냉정수기', link: '/category/정수기/냉정수기' },
        { name: '일반정수기', link: '/category/정수기/일반정수기' }
      ]
    },
    { 
      name: '공기청정기', 
      link: '#',
      submenu: [
        { name: '10평형', link: '/category/공기청정기/10평형' },
        { name: '20평형', link: '/category/공기청정기/20평형' },
        { name: '30평형', link: '/category/공기청정기/30평형' },
        { name: '40평형', link: '/category/공기청정기/40평형' },
        { name: '제습공기청정기', link: '/category/공기청정기/제습공기청정기' }
      ]
    },
    { 
      name: '비데·연수기', 
      link: '#',
      submenu: [
        { name: '비데', link: '/category/비데/비데' },
        { name: '연수기', link: '/category/비데/연수기' }
      ]
    },
    { 
      name: '생활가전', 
      link: '#',
      submenu: [
        { name: '제빙기', link: '/category/생활가전/제빙기' },
        { name: '매트리스', link: '/category/생활가전/매트리스' },
        { name: '안마의자', link: '/category/생활가전/안마의자' }
      ]
    },
    { name: '파트너점 모집', link: '/partner.html' },
    { name: '제휴카드', link: '/category/7' },
    { name: '사은품', link: '/category/8' }
  ];

  return `
    <header class="header bg-white shadow-md sticky top-0 z-40">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-20">
          <a href="/" class="flex items-center space-x-2">
            ${settings.logoImage ? `
              <img src="${settings.logoImage}" alt="${settings.siteName}" class="h-12 w-auto">
            ` : `
              <div class="text-2xl font-bold text-blue-600">
                <i class="fas fa-water mr-2"></i>${settings.siteName || '청호나이스'}
              </div>
            `}
          </a>

          <nav class="hidden lg:flex items-center space-x-1">
            ${fixedMenu.map(item => `
              <div class="menu-item relative group">
                <a href="${item.link}" 
                   class="px-4 py-6 font-semibold text-gray-700 hover:text-blue-600 transition inline-block">
                  ${item.name}
                  ${item.submenu ? '<i class="fas fa-chevron-down text-xs ml-1"></i>' : ''}
                </a>
                
                ${item.submenu ? `
                  <div class="submenu absolute left-0 top-full bg-white shadow-lg rounded-b-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 min-w-[200px] z-50">
                    ${item.submenu.map(sub => `
                      <a href="${sub.link}" 
                         class="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition text-sm">
                        ${sub.name}
                      </a>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </nav>

          <a href="tel:${settings.phoneNumber}" 
             class="hidden lg:flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-phone"></i>
            <span class="font-bold">${settings.phoneNumber}</span>
          </a>
          
          <button onclick="toggleMobileMenu()" class="lg:hidden text-gray-700 text-2xl">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
      
      <!-- 모바일 메뉴 -->
      <div id="mobile-menu" class="hidden lg:hidden bg-white border-t fixed left-0 right-0 top-20 bottom-0 overflow-y-auto z-40">
        <div class="container mx-auto px-4 py-4">
          ${fixedMenu.map((item, idx) => `
            <div class="mb-2 border-b pb-2">
              ${item.submenu ? `
                <button onclick="toggleMobileSubmenu(${idx})" 
                        class="w-full flex items-center justify-between py-3 font-semibold text-gray-700 hover:text-blue-600">
                  <span>${item.name}</span>
                  <i class="fas fa-chevron-down transition-transform duration-200" id="mobile-icon-${idx}"></i>
                </button>
                <div id="mobile-submenu-${idx}" class="hidden pl-4 space-y-1 pb-2">
                  ${item.submenu.map(sub => `
                    <a href="${sub.link}" 
                       onclick="toggleMobileMenu()"
                       class="block py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 rounded">
                      ${sub.name}
                    </a>
                  `).join('')}
                </div>
              ` : `
                <a href="${item.link}" 
                   onclick="toggleMobileMenu()"
                   class="block py-3 font-semibold text-gray-700 hover:text-blue-600">
                  ${item.name}
                </a>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    </header>
  `;
}

// 브레드크럼
function renderBreadcrumb() {
  return `
    <div class="bg-gray-100 py-4">
      <div class="container mx-auto px-4">
        <div class="flex items-center space-x-2 text-sm">
          <a href="/" class="text-gray-600 hover:text-blue-600">
            <i class="fas fa-home"></i>
          </a>
          <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
          <a href="/" class="text-gray-600 hover:text-blue-600">${mainCategory}</a>
          <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
          <span class="text-blue-600 font-semibold">${subCategory}</span>
        </div>
      </div>
    </div>
  `;
}

// 카테고리 헤더
function renderCategoryHeader() {
  return `
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 py-12 text-white">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-2">${subCategory}</h1>
        <p class="text-blue-100">${mainCategory} 전문 렌탈 서비스</p>
      </div>
    </div>
  `;
}

// 제품 그리드
function renderProductGrid(productList) {
  return `
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        ${productList.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            ${productList.map((product, idx) => {
              const images = product.images || [product.image] || [];
              const hasMultipleImages = images.length > 1;
              return `
              <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div class="relative aspect-square overflow-hidden bg-gray-100 rounded-lg flex items-center justify-center" id="category-product-slider-${idx}">
                  ${hasMultipleImages ? `
                    <!-- 이미지 슬라이더 -->
                    <div class="w-full h-full relative">
                      ${images.map((img, imgIdx) => `
                        <img src="${img || 'https://via.placeholder.com/600x600?text=No+Image'}" 
                             alt="${product.name} ${imgIdx + 1}" 
                             class="w-full h-full object-contain p-4 absolute top-0 left-0 transition-opacity duration-500 ${imgIdx === 0 ? 'opacity-100' : 'opacity-0'}"
                             data-cat-slider-img="${idx}-${imgIdx}"
                             onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                      `).join('')}
                    </div>
                    
                    <!-- 슬라이더 인디케이터 -->
                    <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                      ${images.map((_, imgIdx) => `
                        <div class="w-2 h-2 rounded-full ${imgIdx === 0 ? 'bg-blue-600' : 'bg-gray-300'}" data-cat-slider-indicator="${idx}-${imgIdx}"></div>
                      `).join('')}
                    </div>
                  ` : `
                    <img src="${images[0] || 'https://via.placeholder.com/600x600?text=' + encodeURIComponent(product.name)}" 
                         alt="${product.name}" 
                         class="w-full h-full object-contain p-4"
                         onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                  `}
                  ${product.promotionTag ? `
                    <div class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ${product.promotionTag}
                    </div>
                  ` : ''}
                </div>
                
                <div class="p-6">
                  <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                    ${product.subCategory || product.category}
                  </span>
                  <h3 class="text-xl font-bold text-gray-900 mb-2">${product.name}</h3>
                  <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description || ''}</p>
                  
                  <div class="flex items-baseline justify-between mb-4">
                    <div>
                      <span class="text-2xl font-bold text-blue-600">${calculateDiscountedPrice(product).toLocaleString()}</span>
                      <span class="text-sm text-gray-600">원/월</span>
                    </div>
                  </div>
                  
                  <button onclick="window.location.href='/product/${product.id}'" 
                          class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all duration-300">
                    자세히 보기
                  </button>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        ` : `
          <div class="text-center py-20">
            <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <p class="text-xl text-gray-500">해당 카테고리의 제품이 없습니다.</p>
            <a href="/" class="inline-block mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
              홈으로 돌아가기
            </a>
          </div>
        `}
      </div>
    </section>
  `;
}

// 푸터
function renderFooter() {
  return `
    <footer class="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <p class="text-gray-400">${settings.footerText || 'Copyright © 2024 청호나이스 렌탈. All Rights Reserved.'}</p>
        </div>
      </div>
    </footer>
  `;
}

// 모바일 메뉴 토글
window.toggleMobileMenu = function() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
  // 메뉴 닫을 때 body 스크롤 복원
  if (menu.classList.contains('hidden')) {
    document.body.style.overflow = '';
  } else {
    document.body.style.overflow = 'hidden';
  }
};

// 모바일 서브메뉴 토글 (아코디언)
window.toggleMobileSubmenu = function(index) {
  const submenu = document.getElementById(`mobile-submenu-${index}`);
  const icon = document.getElementById(`mobile-icon-${index}`);
  
  if (submenu) {
    submenu.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
  }
};

// 제품 이미지 슬라이더 자동 전환 (카테고리 페이지용)
function startCategoryProductSliders() {
  const sliderIntervals = [];
  
  document.querySelectorAll('[id^="category-product-slider-"]').forEach((sliderEl) => {
    // 슬라이더 ID에서 인덱스 추출
    const sliderId = sliderEl.id;
    const idx = sliderId.replace('category-product-slider-', '');
    
    // 해당 슬라이더 내부의 이미지와 인디케이터 찾기
    const images = sliderEl.querySelectorAll(`[data-cat-slider-img^="${idx}-"]`);
    const indicators = sliderEl.querySelectorAll(`[data-cat-slider-indicator^="${idx}-"]`);
    
    if (images.length <= 1) return; // 이미지가 1개면 슬라이더 불필요
    
    let currentIdx = 0;
    
    // 슬라이드 변경 함수
    const goToSlide = (newIdx) => {
      // 현재 이미지 숨기기
      if (images[currentIdx]) {
        images[currentIdx].classList.remove('opacity-100');
        images[currentIdx].classList.add('opacity-0');
      }
      if (indicators[currentIdx]) {
        indicators[currentIdx].classList.remove('bg-blue-600');
        indicators[currentIdx].classList.add('bg-gray-300');
      }
      
      // 새 인덱스 설정
      currentIdx = newIdx;
      
      // 새 이미지 표시
      if (images[currentIdx]) {
        images[currentIdx].classList.remove('opacity-0');
        images[currentIdx].classList.add('opacity-100');
      }
      if (indicators[currentIdx]) {
        indicators[currentIdx].classList.remove('bg-gray-300');
        indicators[currentIdx].classList.add('bg-blue-600');
      }
    };
    
    // indicator 클릭 이벤트 추가
    indicators.forEach((indicator, indicatorIdx) => {
      indicator.style.cursor = 'pointer';
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToSlide(indicatorIdx);
      });
    });
    
    // 3초마다 자동 전환
    const interval = setInterval(() => {
      goToSlide((currentIdx + 1) % images.length);
    }, 3000);
    
    sliderIntervals.push(interval);
  });
  
  return sliderIntervals;
}

// 초기화 실행
init();
