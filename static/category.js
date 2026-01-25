// 서브카테고리 페이지

const app = document.getElementById('app');

// 금액 포맷팅 유틸리티 함수 (숫자에 콤마 추가)
function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '';
  // 문자열에서 숫자만 추출
  const numStr = String(price).replace(/[^0-9]/g, '');
  if (!numStr) return price; // 숫자가 없으면 원본 반환
  // 숫자에 콤마 추가
  return parseInt(numStr, 10).toLocaleString('ko-KR');
}

// 제휴카드 할인 적용 가격 계산 (대표 월렌탈료 - 제휴카드 가격)
function calculateDiscountedPrice(product) {
  const originalPrice = parseInt(String(product.price || '0').replace(/[^0-9]/g, '')) || 0;
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

let categories = [];
let products = [];
let settings = {};
let currentCategory = null;
let currentSubcategory = null;

// 초기화
async function init() {
  // URL에서 subcategory ID 추출
  const path = window.location.pathname;
  const match = path.match(/\/subcategory\/(\d+)/);
  if (match) {
    const subcategoryId = parseInt(match[1]);
    await loadData(subcategoryId);
  } else {
    // 카테고리 처리
    const categoryMatch = path.match(/\/category\/(.+)/);
    if (categoryMatch) {
      const categoryParam = decodeURIComponent(categoryMatch[1]);
      
      // 숫자인지 확인 (ID인 경우)
      if (/^\d+$/.test(categoryParam)) {
        await loadDataByCategory(parseInt(categoryParam));
      } else {
        // 카테고리명인 경우
        await loadDataByCategoryName(categoryParam);
      }
    }
  }
  
  renderPage();
  setupEventListeners();
}

// 서브카테고리 ID로 데이터 로드
async function loadData(subcategoryId) {
  try {
    const [categoriesRes, settingsRes] = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/settings')
    ]);
    categories = categoriesRes.data;
    settings = settingsRes.data;
    
    // 서브카테고리 찾기
    for (const cat of categories) {
      const sub = cat.subcategories.find(s => s.id === subcategoryId);
      if (sub) {
        currentCategory = cat;
        currentSubcategory = sub;
        
        // 제품 필터링
        let url = '/api/products?';
        if (sub.filter.category) {
          url += `category=${encodeURIComponent(sub.filter.category)}`;
        }
        
        const productsRes = await axios.get(url);
        products = sortByDisplayOrder(filterProductsBySubcategory(productsRes.data, sub));
        break;
      }
    }
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
  }
}

// 카테고리 ID로 데이터 로드
async function loadDataByCategory(categoryId) {
  try {
    const [categoriesRes, settingsRes] = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/settings')
    ]);
    categories = categoriesRes.data;
    settings = settingsRes.data;
    
    currentCategory = categories.find(c => c.id === categoryId);
    
    if (currentCategory) {
      // 카테고리의 모든 제품 가져오기
      const productsRes = await axios.get(`/api/products?category=${encodeURIComponent(currentCategory.name)}`);
      products = sortByDisplayOrder(productsRes.data);
    }
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
  }
}

// 카테고리명으로 데이터 로드
async function loadDataByCategoryName(categoryName) {
  try {
    const [productsRes, settingsRes] = await Promise.all([
      axios.get('/api/products'),
      axios.get('/api/settings')
    ]);
    settings = settingsRes.data;
    
    // 카테고리명으로 제품 필터링
    const allProducts = productsRes.data;
    products = sortByDisplayOrder(allProducts.filter(p => p.category === categoryName));
    
    // 가상의 currentCategory 객체 생성
    currentCategory = {
      name: categoryName,
      id: null
    };
    currentSubcategory = null;
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
  }
}

// 서브카테고리 필터 적용
function filterProductsBySubcategory(productList, subcategory) {
  if (!subcategory.filter) return productList;
  
  return productList.filter(product => {
    const filter = subcategory.filter;
    
    // 워터타입 필터
    if (filter.waterTypes && filter.waterTypes.length > 0) {
      if (!product.waterTypes) return false;
      const hasAllTypes = filter.waterTypes.every(type => product.waterTypes.includes(type));
      if (!hasAllTypes) return false;
    }
    
    // 스펙 필터
    if (filter.specs) {
      if (!product.specs) return false;
      if (!product.specs.includes(filter.specs)) return false;
    }
    
    // 설명 필터
    if (filter.description) {
      if (Array.isArray(filter.description)) {
        const hasAnyDesc = filter.description.some(desc => 
          product.description && product.description.includes(desc)
        );
        if (!hasAnyDesc) return false;
      } else {
        if (!product.description || !product.description.includes(filter.description)) return false;
      }
    }
    
    // 피처 필터
    if (filter.features) {
      if (!product.features) return false;
      const hasAllFeatures = filter.features.every(feat => 
        product.features.some(f => f.includes(feat))
      );
      if (!hasAllFeatures) return false;
    }
    
    return true;
  });
}

// 페이지 렌더링
function renderPage() {
  app.innerHTML = `
    ${renderHeader()}
    ${renderBreadcrumb()}
    ${renderCategoryHeader()}
    ${renderProductSection()}
  `;
}

// 헤더
function renderHeader() {
  return `
    <header class="header bg-white shadow-md sticky top-0 z-40">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-20">
          <a href="/" class="flex items-center space-x-2">
            <div class="text-2xl font-bold text-blue-600">
              <i class="fas fa-water mr-2"></i>${settings.siteName || '청호나이스'}
            </div>
          </a>

          <nav class="hidden lg:flex items-center space-x-1">
            ${categories.map(cat => `
              <div class="menu-item relative group">
                <a href="${cat.subcategories.length > 0 ? '#' : `/category/${cat.id}`}" 
                   class="px-4 py-6 font-semibold text-gray-700 hover:text-blue-600 transition inline-block ${currentCategory && currentCategory.id === cat.id ? 'text-blue-600' : ''}">
                  ${cat.name}
                  ${cat.subcategories.length > 0 ? '<i class="fas fa-chevron-down text-xs ml-1"></i>' : ''}
                </a>
                
                ${cat.subcategories.length > 0 ? `
                  <div class="submenu absolute left-0 top-full bg-white shadow-lg rounded-b-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 min-w-[200px]">
                    ${cat.subcategories.map(sub => `
                      <a href="/subcategory/${sub.id}" 
                         class="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition text-sm ${currentSubcategory && currentSubcategory.id === sub.id ? 'bg-blue-50 text-blue-600' : ''}">
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
        </div>
      </div>
    </header>
  `;
}

// 브레드크럼
function renderBreadcrumb() {
  if (!currentCategory) return '';
  
  return `
    <div class="bg-gray-100 py-4">
      <div class="container mx-auto px-4">
        <div class="flex items-center space-x-2 text-sm">
          <a href="/" class="text-gray-600 hover:text-blue-600">
            <i class="fas fa-home"></i> 홈
          </a>
          <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
          <a href="/category/${currentCategory.id}" class="text-gray-600 hover:text-blue-600">
            ${currentCategory.name}
          </a>
          ${currentSubcategory ? `
            <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            <span class="text-gray-900 font-semibold">${currentSubcategory.name}</span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// 카테고리 헤더
function renderCategoryHeader() {
  if (!currentCategory) return '';
  
  return `
    <div class="bg-white py-8 border-b">
      <div class="container mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          ${currentSubcategory ? currentSubcategory.name : currentCategory.name}
        </h1>
        <p class="text-gray-600">
          총 <span class="text-blue-600 font-bold">${products.length}</span>개의 제품이 있습니다.
        </p>
        
        ${currentCategory.subcategories.length > 0 && !currentSubcategory ? `
          <div class="flex flex-wrap gap-2 mt-6">
            ${currentCategory.subcategories.map(sub => `
              <a href="/subcategory/${sub.id}" 
                 class="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg transition font-medium">
                ${sub.name}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 제품 섹션
function renderProductSection() {
  return `
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <!-- 정렬 필터 -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-8">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
              <span class="font-semibold">${products.length}개</span> 제품
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-semibold text-gray-700">정렬:</label>
              <select id="filter-sort" onchange="sortProducts()" 
                      class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">기본순</option>
                <option value="newest">신상품순</option>
                <option value="price-low">낮은 가격순</option>
                <option value="price-high">높은 가격순</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 제품 그리드 -->
        <div id="products-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          ${renderProductCards(products)}
        </div>
      </div>
    </section>
  `;
}

// 제품 카드 렌더링
function renderProductCards(productList) {
  if (productList.length === 0) {
    return `
      <div class="col-span-full text-center py-12 text-gray-500">
        <i class="fas fa-inbox text-6xl mb-4"></i>
        <p class="text-lg">해당 카테고리의 제품이 없습니다.</p>
        <a href="/" class="inline-block mt-4 text-blue-600 hover:underline">홈으로 돌아가기</a>
      </div>
    `;
  }

  return productList.map(product => {
    // 이미지 배열 처리 (단일 이미지 하위 호환)
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const hasMultipleImages = images.length > 1;
    
    // 제휴카드 할인 적용 가격 계산
    const discountedPrice = calculateDiscountedPrice(product);

    return `
    <a href="/product/${product.id}" 
       class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group product-card"
       data-product-id="${product.id}">
      <div class="relative aspect-square bg-gray-100 overflow-hidden">
        ${product.promotionTag ? `
          <span class="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full z-10">
            ${product.promotionTag}
          </span>
        ` : ''}
        
        <!-- 이미지 컨테이너 -->
        <div class="w-full h-full relative product-image-slider">
          ${images.map((img, idx) => `
            <img src="${img}" 
                 alt="${product.name}" 
                 class="w-full h-full object-contain p-4 absolute top-0 left-0 transition-opacity duration-500 ${idx === 0 ? 'opacity-100' : 'opacity-0'}"
                 data-img-index="${idx}"
                 onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
          `).join('')}
        </div>
        
        <!-- 슬라이드 인디케이터 (여러 장일 때만) -->
        ${hasMultipleImages ? `
          <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            ${images.map((_, idx) => `
              <div class="w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'} product-slider-dot" data-dot-index="${idx}"></div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-500 mb-1">${product.category}</div>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-1">${product.description}</p>
        ${product.waterTypes && product.waterTypes.length > 0 ? `
          <div class="flex flex-wrap gap-1 mb-3">
            ${product.waterTypes.map(type => `
              <span class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">${type}</span>
            `).join('')}
          </div>
        ` : ''}
        <div class="flex items-baseline justify-between">
          <div>
            <span class="text-xl font-bold text-blue-600">${discountedPrice.toLocaleString()}</span>
            <span class="text-sm text-gray-600">원/월</span>
          </div>
        </div>
      </div>
    </a>
  `).join('');
}

// 정렬
window.sortProducts = async function() {
  const sort = document.getElementById('filter-sort').value;
  
  let sorted = [...products];
  
  if (sort === 'default') {
    // 관리자 설정 순서 (displayOrder)
    sorted = sortByDisplayOrder(sorted);
  } else if (sort === 'newest') {
    sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
  } else if (sort === 'price-low') {
    sorted.sort((a, b) => {
      const priceA = parseInt(String(a.price || '0').replace(/,/g, ''));
      const priceB = parseInt(String(b.price || '0').replace(/,/g, ''));
      return priceA - priceB;
    });
  } else if (sort === 'price-high') {
    sorted.sort((a, b) => {
      const priceA = parseInt(String(a.price || '0').replace(/,/g, ''));
      const priceB = parseInt(String(b.price || '0').replace(/,/g, ''));
      return priceB - priceA;
    });
  }
  
  document.getElementById('products-grid').innerHTML = renderProductCards(sorted);
  startProductSliders(); // 정렬 후 슬라이더 재시작
};

// 슬라이더 인터벌 관리
let sliderIntervals = [];

// 제품 카드 슬라이더 시작
function startProductSliders() {
  // 기존 인터벌 제거
  sliderIntervals.forEach(interval => clearInterval(interval));
  sliderIntervals = [];

  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach((card, cardIndex) => {
    const slider = card.querySelector('.product-image-slider');
    if (!slider) return;
    
    const images = slider.querySelectorAll('img');
    const dots = card.querySelectorAll('.product-slider-dot');
    
    if (images.length <= 1) return;

    let currentIndex = 0;
    
    // 슬라이드 변경 함수
    const goToSlide = (newIndex) => {
      // 현재 이미지 숨김
      images[currentIndex].classList.remove('opacity-100');
      images[currentIndex].classList.add('opacity-0');
      if (dots.length > 0) {
        dots[currentIndex].classList.remove('bg-blue-600');
        dots[currentIndex].classList.add('bg-gray-300');
      }
      
      // 새 인덱스 설정
      currentIndex = newIndex;
      
      // 새 이미지 표시
      images[currentIndex].classList.remove('opacity-0');
      images[currentIndex].classList.add('opacity-100');
      if (dots.length > 0) {
        dots[currentIndex].classList.remove('bg-gray-300');
        dots[currentIndex].classList.add('bg-blue-600');
      }
    };
    
    // dot 클릭 이벤트 추가
    dots.forEach((dot, dotIndex) => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToSlide(dotIndex);
      });
    });
    
    // 3초마다 자동 슬라이드
    const interval = setInterval(() => {
      goToSlide((currentIndex + 1) % images.length);
    }, 3000 + Math.random() * 1000); // 랜덤 딜레이로 자연스럽게

    sliderIntervals.push(interval);
  });
}

// 이벤트 리스너
function setupEventListeners() {
  // 슬라이더 시작
  startProductSliders();
}

// 초기화 실행
init();
