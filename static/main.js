// 청호나이스 렌탈 총판 - 메인 페이지 (완전 리뉴얼)

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

// 전역 변수
let categories = [];
let products = [];
let settings = {};
let reviews = [];
let currentBannerIndex = 0;
let bannerInterval = null;
let currentReviewSlide = 0;
let reviewSlideInterval = null;
let totalReviewSlides = 0;

// 초기화
async function init() {
  await loadData();
  renderPage();
  startBannerSlider();
  startEventBannerSlider(); // 이벤트 배너 슬라이더
  // startRealtimeNotifications(); // 기존 실시간 알림 제거
  startRealtimeStatusUpdate(); // 새로운 실시간 접수 현황
  setupScrollEffects();
  
  // 베스트 제품 이미지 슬라이더 시작 (DOM 렌더링 후)
  setTimeout(() => {
    startBestProductSliders();
    startReviewSlider(); // 리뷰 슬라이더 시작
  }, 100);
  
  // 첫 방문 시 팝업 표시 (오늘 하루 안보기 체크)
  showWelcomePopup();
}

// 데이터 로드
async function loadData() {
  try {
    const [categoriesRes, productsRes, settingsRes, reviewsRes] = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/products'),
      axios.get('/api/settings'),
      axios.get('/api/reviews')
    ]);
    categories = categoriesRes.data;
    products = productsRes.data;
    settings = settingsRes.data;
    reviews = reviewsRes.data;
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
  }
}

// 페이지 렌더링
function renderPage() {
  app.innerHTML = `
    ${renderHeader()}
    ${renderMainBanner()}
    ${renderRealtimeStatus()}
    ${renderReviewSection()}
    ${renderBestProducts()}
    ${renderOfficialServiceSection()}
    ${renderEventBanner()}
    ${renderPartnershipBanner()}
    ${renderFooter()}
    ${renderBottomQuickMenu()}
    ${renderRightQuickMenu()}
    ${renderPrivacyModal()}
    ${renderMarketingModal()}
    ${renderWelcomePopup()}
  `;
  
  setupEventListeners();
}

// 최상단 배너 (제거됨 - 필요시 주석 해제)
// function renderTopBanner() {
//   return `
//     <div class="top-banner bg-gradient-to-r from-blue-600 to-blue-700 py-2">
//       <div class="container mx-auto px-4">
//         <img src="${settings.topBannerImage || 'https://via.placeholder.com/1920x60?text=Top+Banner'}" 
//              alt="Top Banner" 
//              class="w-full h-auto max-h-16 object-contain">
//       </div>
//     </div>
//   `;
// }

// 헤더 (메뉴)
function renderHeader() {
  // 고정된 메뉴 구조
  const fixedMenu = [
    { 
      name: '정수기', 
      link: '#products', 
      filter: '정수기',
      submenu: [
        { name: '얼음정수기', link: '/category/정수기/얼음정수기' },
        { name: '냉온정수기', link: '/category/정수기/냉온정수기' },
        { name: '냉정수기', link: '/category/정수기/냉정수기' },
        { name: '일반정수기', link: '/category/정수기/일반정수기' }
      ]
    },
    { 
      name: '공기청정기', 
      link: '#products', 
      filter: '공기청정기',
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
        { name: '안마의자', link: '/category/생활가전/안마의자' },
        { name: '패키지', link: '/category/생활가전/패키지' }
      ]
    },
    { name: '파트너점 모집', link: '/partner.html' },
    { name: '제휴카드', link: '/card' },
    { name: '사은품', link: '/gifts' }
  ];
  
  return `
    <header class="header bg-white shadow-md sticky top-0 z-40">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-20">
          <!-- 로고 -->
          <a href="/" class="flex items-center space-x-2">
            ${settings.logoImage ? `
              <img src="${settings.logoImage}" alt="${settings.siteName}" class="h-12 w-auto">
            ` : `
              <div class="text-2xl font-bold text-blue-600">
                <i class="fas fa-water mr-2"></i>${settings.siteName || '청호나이스'}
              </div>
            `}
          </a>

          <!-- 메뉴 -->
          <nav class="hidden lg:flex items-center space-x-1">
            ${fixedMenu.map(item => `
              <div class="menu-item relative group">
                <a href="${item.link}" 
                   class="px-4 py-6 font-semibold text-gray-700 hover:text-blue-600 transition inline-block"
                   ${item.filter ? `onclick="filterByCategory('${item.filter}'); return false;"` : ''}>
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

          <!-- 모바일 메뉴 버튼 -->
          <button onclick="toggleMobileMenu()" class="lg:hidden text-gray-700">
            <i class="fas fa-bars text-2xl"></i>
          </button>

          <!-- 전화번호 -->
          <a href="tel:${settings.phoneNumber}" 
             class="hidden lg:flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-phone"></i>
            <span class="font-bold">${settings.phoneNumber}</span>
          </a>
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

// 메인 배너 슬라이더
function renderMainBanner() {
  const banners = settings.mainBannerImages || ['https://via.placeholder.com/1920x600?text=Banner+1'];
  
  return `
    <div class="main-banner relative overflow-hidden lg:h-[600px] h-[400px]">
      <div class="banner-slider relative h-full">
        ${banners.map((banner, idx) => {
          // 하위 호환성: 문자열이면 객체로 변환
          const bannerObj = typeof banner === 'string' ? { url: banner, title: settings.siteName, subtitle: settings.mainPromotion, link: '' } : banner;
          const hasLink = bannerObj.link && bannerObj.link.trim() !== '';
          
          // PC/모바일 이미지 URL 결정
          const pcImage = bannerObj.pcUrl || bannerObj.url || banner;
          const mobileImage = bannerObj.mobileUrl || pcImage;
          
          return `
          <div class="banner-slide absolute inset-0 transition-opacity duration-1000 ${idx === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}" 
               data-index="${idx}">
            ${hasLink ? `<a href="${bannerObj.link}" class="block w-full h-full">` : ''}
              <!-- PC 이미지 -->
              <img src="${pcImage}" 
                   alt="Banner ${idx + 1}" 
                   class="hidden lg:block w-full h-full object-cover ${hasLink ? 'cursor-pointer' : ''}">
              <!-- 모바일 이미지 -->
              <img src="${mobileImage}" 
                   alt="Banner ${idx + 1}" 
                   class="lg:hidden w-full h-full object-cover ${hasLink ? 'cursor-pointer' : ''}">
            ${hasLink ? `</a>` : ''}
          </div>
          `;
        }).join('')}
      </div>

      <!-- 슬라이더 컨트롤 -->
      ${banners.length > 1 ? `
        <button onclick="prevBanner()" 
                class="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 w-12 h-12 rounded-full transition">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button onclick="nextBanner()" 
                class="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 w-12 h-12 rounded-full transition">
          <i class="fas fa-chevron-right"></i>
        </button>

        <!-- 인디케이터 -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          ${banners.map((_, idx) => `
            <button onclick="goToBanner(${idx})" 
                    class="banner-indicator w-3 h-3 rounded-full transition ${idx === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}">
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// 고객 리뷰 섹션 (1개씩 넘어가는 슬라이더)
function renderReviewSection() {
  if (!reviews || reviews.length === 0) {
    return '';
  }

  return `
    <section class="review-section py-8 sm:py-16 bg-white">
      <div class="container mx-auto px-4">
        <!-- 섹션 헤더 -->
        <div class="text-center mb-6 sm:mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Review</h2>
          <p class="text-gray-600 text-sm sm:text-base">고객님들의 소중한 후기</p>
        </div>

        <!-- 리뷰 슬라이더 -->
        <div class="relative max-w-6xl mx-auto">
          <!-- 슬라이더 컨테이너 -->
          <div class="overflow-hidden">
            <div id="review-slider" class="flex transition-transform duration-500 ease-in-out">
              ${reviews.map((review, idx) => `
                <div class="w-[85%] sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-3">
                  <a href="/product/${review.productId}" 
                     class="review-card block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 h-full">
                    <!-- 리뷰 이미지 -->
                    <div class="aspect-[4/3] overflow-hidden bg-gray-100">
                      <img src="${review.image || 'https://via.placeholder.com/400x300/F5F5F5/999999?text=No+Image'}" 
                           alt="${review.title}"
                           class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           onerror="this.src='https://via.placeholder.com/400x300/F5F5F5/999999?text=No+Image'">
                    </div>
                    
                    <!-- 리뷰 내용 -->
                    <div class="p-3 sm:p-5">
                      <!-- 구매제품 태그 -->
                      <div class="mb-2 sm:mb-3">
                        <span class="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          <i class="fas fa-shopping-cart mr-1"></i>구매제품
                        </span>
                        <span class="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-600">${review.productName || '제품명 없음'}</span>
                      </div>

                      <!-- 제목 -->
                      <h3 class="font-bold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        ${review.title}
                      </h3>
                      
                      <!-- 별점 -->
                      <div class="flex items-center mb-2 sm:mb-3">
                        <span class="text-lg sm:text-2xl font-bold text-gray-900 mr-2">${review.rating.toFixed(1)}</span>
                        <div class="flex text-yellow-400 text-sm sm:text-base">
                          ${Array(5).fill(0).map((_, i) => 
                            i < Math.floor(review.rating) 
                              ? '<i class="fas fa-star"></i>' 
                              : (i < review.rating ? '<i class="fas fa-star-half-alt"></i>' : '<i class="far fa-star"></i>')
                          ).join('')}
                        </div>
                      </div>
                      
                      <!-- 내용 -->
                      <p class="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        ${review.content}
                      </p>
                    </div>
                  </a>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 좌우 화살표 버튼 -->
          ${reviews.length > 1 ? `
            <button onclick="prevReviewSlide()" 
                    class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 bg-white shadow-lg rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition z-10">
              <i class="fas fa-chevron-left text-lg sm:text-xl"></i>
            </button>
            <button onclick="nextReviewSlide()" 
                    class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 bg-white shadow-lg rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition z-10">
              <i class="fas fa-chevron-right text-lg sm:text-xl"></i>
            </button>
          ` : ''}

          <!-- 인디케이터 (점) -->
          ${reviews.length > 3 ? `
            <div class="flex justify-center mt-6 gap-2">
              ${reviews.slice(0, reviews.length - 2).map((_, idx) => `
                <button onclick="goToReviewSlide(${idx})" 
                        class="review-indicator w-3 h-3 rounded-full transition-all ${idx === 0 ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}"
                        data-index="${idx}"></button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}

// 실시간 온라인 접수 현황 (메인 배너 바로 아래)
function renderRealtimeStatus() {
  return `
    <section class="realtime-consultation-section py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <!-- 실시간 온라인 접수 현황 -->
          <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <div class="flex items-center mb-4">
              <i class="fas fa-list-ul text-blue-600 text-xl mr-2"></i>
              <h3 class="text-xl font-bold text-gray-900">
                실시간 <span class="text-red-500">온라인 접수 현황</span>
              </h3>
            </div>
            
            <div id="realtime-status-list" class="space-y-3">
              <!-- 여기에 동적으로 접수 현황 목록이 표시됩니다 -->
            </div>
          </div>

          <!-- 렌탈 상담 신청하기 -->
          <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <div class="flex items-center mb-4">
              <i class="fas fa-edit text-orange-500 text-xl mr-2"></i>
              <h3 class="text-xl font-bold text-gray-900">
                렌탈 <span class="text-red-500">상담 신청하기</span>
              </h3>
            </div>
            
            <form id="quick-consultation-form-v2" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">고객명</label>
                  <input type="text" 
                         id="quick-customer-name-v2" 
                         required
                         placeholder="고객명"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                  <input type="tel" 
                         id="quick-customer-phone-v2" 
                         required
                         placeholder="숫자만 입력하세요"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="flex items-start cursor-pointer text-sm">
                  <input type="checkbox" 
                         id="quick-privacy-consent-v2" 
                         required
                         class="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                  <span class="ml-2 text-gray-700">
                    개인정보 수집 및 이용 동의(필수)
                    <button type="button" 
                            onclick="openPrivacyModal()" 
                            class="text-blue-600 underline ml-1 hover:text-blue-800">
                      [보기]
                    </button>
                  </span>
                </label>
                
                <label class="flex items-start cursor-pointer text-sm">
                  <input type="checkbox" 
                         id="quick-marketing-consent-v2"
                         class="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                  <span class="ml-2 text-gray-700">
                    마케팅 활용 동의(선택)
                    <button type="button" 
                            onclick="openMarketingModal()" 
                            class="text-blue-600 underline ml-1 hover:text-blue-800">
                      [보기]
                    </button>
                  </span>
                </label>
              </div>
              
              <button type="submit" 
                      class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md">
                상담신청하기
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
}

// 간편상담신청 섹션
function renderQuickConsultation() {
  return `
    <section class="quick-consultation py-12 bg-white">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">
              <i class="fas fa-headset text-blue-600 mr-2"></i>
              간편상담신청
            </h2>
            <p class="text-gray-600">빠르고 편리한 렌탈 상담을 받아보세요</p>
          </div>
          
          <form id="quick-consultation-form" class="space-y-4">
            <!-- 고객명 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                고객명 <span class="text-red-500">*</span>
              </label>
              <input type="text" 
                     id="quick-customer-name" 
                     required
                     placeholder="이름을 입력해주세요"
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <!-- 연락처 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                연락처 <span class="text-red-500">*</span>
              </label>
              <input type="tel" 
                     id="quick-customer-phone" 
                     required
                     placeholder="010-0000-0000"
                     pattern="[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}"
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <!-- 개인정보 수집 및 이용동의 (필수) -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" 
                       id="quick-privacy-consent" 
                       required
                       class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <span class="ml-3 text-sm text-gray-700">
                  <span class="font-semibold">개인정보 수집 및 이용동의</span>
                  <span class="text-red-500">*</span>
                  <button type="button" 
                          onclick="openPrivacyModal()" 
                          class="text-blue-600 underline ml-1 hover:text-blue-800">
                    [자세히]
                  </button>
                </span>
              </label>
            </div>
            
            <!-- 마케팅 활용 동의 (선택) -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" 
                       id="quick-marketing-consent"
                       class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <span class="ml-3 text-sm text-gray-700">
                  <span class="font-semibold">마케팅 활용 동의</span>
                  <span class="text-gray-500">(선택)</span>
                  <button type="button" 
                          onclick="openMarketingModal()" 
                          class="text-blue-600 underline ml-1 hover:text-blue-800">
                    [자세히]
                  </button>
                </span>
              </label>
            </div>
            
            <!-- 제출 버튼 -->
            <button type="submit" 
                    class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <i class="fas fa-paper-plane mr-2"></i>
              상담신청하기
            </button>
          </form>
        </div>
      </div>
    </section>
  `;
}

// 베스트 주력상품 섹션
function renderBestProducts() {
  const bestProductIds = settings.bestProductIds || [];
  
  // 베스트 상품이 선택되지 않았으면 표시하지 않음
  if (bestProductIds.length === 0) {
    return '';
  }
  
  // 선택된 베스트 상품 필터링 (bestProductIds 순서대로 정렬)
  const bestProducts = bestProductIds
    .map(id => products.find(p => p.id === id))
    .filter(p => p); // null/undefined 제거
  
  if (bestProducts.length === 0) {
    return '';
  }
  
  return `
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">
            베스트 상품
          </h2>
          <p class="text-gray-600 text-lg">진행중인 이벤트를 놓치지 마세요</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${bestProducts.map((product, idx) => {
            const images = product.images || [product.image] || [];
            const hasMultipleImages = images.length > 1;
            return `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-yellow-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <!-- 베스트 뱃지 -->
              <div class="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                <i class="fas fa-crown mr-1"></i>BEST
              </div>
              
              <div class="relative aspect-square overflow-hidden bg-gray-100 rounded-lg flex items-center justify-center" id="best-product-slider-${idx}">
                ${hasMultipleImages ? `
                  <!-- 이미지 슬라이더 -->
                  <div class="w-full h-full relative">
                    ${images.map((img, imgIdx) => `
                      <img src="${img || 'https://via.placeholder.com/600x600?text=No+Image'}" 
                           alt="${product.name} ${imgIdx + 1}" 
                           class="w-full h-full object-contain p-4 absolute top-0 left-0 transition-opacity duration-500 ${imgIdx === 0 ? 'opacity-100' : 'opacity-0'}"
                           data-slider-img="${idx}-${imgIdx}"
                           onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                    `).join('')}
                  </div>
                  
                  <!-- 슬라이더 인디케이터 -->
                  <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                    ${images.map((_, imgIdx) => `
                      <div class="w-2 h-2 rounded-full ${imgIdx === 0 ? 'bg-blue-600' : 'bg-gray-300'}" data-slider-indicator="${idx}-${imgIdx}"></div>
                    `).join('')}
                  </div>
                ` : `
                  <img src="${images[0] || 'https://via.placeholder.com/600x600?text=' + encodeURIComponent(product.name)}" 
                       alt="${product.name}" 
                       class="w-full h-full object-contain p-4"
                       onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                `}
              </div>
              
              <div class="p-6">
                <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                  ${product.category}
                </span>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description || ''}</p>
                
                <div class="flex items-baseline justify-between mb-4">
                  <div>
                    <span class="text-2xl font-bold text-blue-600">${calculateDiscountedPrice(product).toLocaleString()}</span>
                    <span class="text-sm text-gray-600">원/월</span>
                  </div>
                  ${product.promotionTag ? `
                    <span class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                      ${product.promotionTag}
                    </span>
                  ` : ''}
                </div>
                
                <a href="/product/${product.id}" 
                   class="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-center">
                  자세히 보기
                </a>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

// 청호나이스 공식인증몰 서비스 섹션
function renderOfficialServiceSection() {
  return `
    <section class="py-8 sm:py-16 bg-gray-50">
      <div class="container mx-auto px-3 sm:px-4">
        <div class="text-center mb-6 sm:mb-10">
          <h2 class="text-xl sm:text-3xl lg:text-4xl font-bold">
            <span class="text-blue-500">청호나이스</span>
            <span class="text-gray-500 relative inline-block pb-1 sm:pb-2">공식인증몰<span class="absolute bottom-0 left-0 w-full h-0.5 sm:h-1 bg-blue-400 rounded-full"></span></span>
            <span class="text-gray-500"> 서비스</span>
          </h2>
        </div>
        
        <div class="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden lg:h-[400px] h-auto">
          <div class="grid grid-cols-2 lg:grid-cols-4 h-full">
            <!-- 빠른 설치일정 배정 -->
            <div class="flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 border-r border-b lg:border-b-0 border-gray-100">
              <div class="w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-2 sm:mb-4 flex items-center justify-center">
                <svg viewBox="0 0 80 80" class="w-full h-full text-gray-700">
                  <rect x="15" y="10" width="50" height="60" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
                  <line x1="25" y1="25" x2="55" y2="25" stroke="currentColor" stroke-width="2"/>
                  <line x1="25" y1="35" x2="55" y2="35" stroke="currentColor" stroke-width="2"/>
                  <line x1="25" y1="45" x2="45" y2="45" stroke="currentColor" stroke-width="2"/>
                  <circle cx="55" cy="20" r="12" fill="white" stroke="currentColor" stroke-width="2"/>
                  <path d="M50 20 L53 23 L60 16" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3 class="text-xs sm:text-lg lg:text-xl font-bold text-gray-800 mb-1 sm:mb-3 text-center">빠른 설치일정 배정</h3>
              <p class="text-[10px] sm:text-sm lg:text-base text-gray-500 text-center leading-tight sm:leading-relaxed">
                본사 직접 간편접수 후<br>
                고객 일정에 맞춰 신속하게<br>
                설치 일정을 안내해드립니다
              </p>
            </div>
            
            <!-- 본사직배송/설치 -->
            <div class="flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div class="w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-2 sm:mb-4 flex items-center justify-center">
                <svg viewBox="0 0 80 80" class="w-full h-full text-gray-700">
                  <rect x="5" y="30" width="45" height="25" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                  <path d="M50 30 L50 55 L70 55 L70 40 L60 30 Z" fill="none" stroke="currentColor" stroke-width="2"/>
                  <line x1="50" y1="40" x2="60" y2="40" stroke="currentColor" stroke-width="2"/>
                  <circle cx="20" cy="55" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
                  <circle cx="60" cy="55" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
                  <line x1="0" y1="35" x2="5" y2="35" stroke="currentColor" stroke-width="2"/>
                  <line x1="0" y1="40" x2="5" y2="40" stroke="currentColor" stroke-width="2"/>
                  <line x1="0" y1="45" x2="5" y2="45" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3 class="text-xs sm:text-lg lg:text-xl font-bold text-gray-800 mb-1 sm:mb-3 text-center">본사직배송/설치</h3>
              <p class="text-[10px] sm:text-sm lg:text-base text-gray-500 text-center leading-tight sm:leading-relaxed">
                본사의 전문 배송직원이<br>
                직접 방문하여 안전하게<br>
                배송부터 설치까지 책임집니다
              </p>
            </div>
            
            <!-- 특별 사은품 증정 -->
            <div class="flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 border-r border-gray-100">
              <div class="w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-2 sm:mb-4 flex items-center justify-center">
                <svg viewBox="0 0 80 80" class="w-full h-full text-gray-700">
                  <rect x="15" y="30" width="50" height="35" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                  <line x1="15" y1="45" x2="65" y2="45" stroke="currentColor" stroke-width="2"/>
                  <line x1="40" y1="30" x2="40" y2="65" stroke="currentColor" stroke-width="2"/>
                  <path d="M40 30 C40 20, 25 15, 25 25 C25 30, 40 30, 40 30" fill="none" stroke="currentColor" stroke-width="2"/>
                  <path d="M40 30 C40 20, 55 15, 55 25 C55 30, 40 30, 40 30" fill="none" stroke="currentColor" stroke-width="2"/>
                  <path d="M30 10 L40 25 L50 10" fill="none" stroke="currentColor" stroke-width="2"/>
                  <circle cx="40" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3 class="text-xs sm:text-lg lg:text-xl font-bold text-gray-800 mb-1 sm:mb-3 text-center">특별 사은품 증정</h3>
              <p class="text-[10px] sm:text-sm lg:text-base text-gray-500 text-center leading-tight sm:leading-relaxed">
                모든 청호나이스 가입 고객에게<br>
                프리미엄 사은품을<br>
                100% 증정합니다
              </p>
              <p class="text-[9px] sm:text-xs text-gray-400 mt-1 sm:mt-2">*렌탈 제품별 상이</p>
            </div>
            
            <!-- 단체 가입 특별 혜택 -->
            <div class="flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8">
              <div class="w-12 h-12 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-2 sm:mb-4 flex items-center justify-center">
                <svg viewBox="0 0 80 80" class="w-full h-full text-gray-700">
                  <rect x="10" y="25" width="25" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                  <rect x="45" y="15" width="25" height="50" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                  <line x1="15" y1="30" x2="30" y2="30" stroke="currentColor" stroke-width="1"/>
                  <line x1="15" y1="35" x2="30" y2="35" stroke="currentColor" stroke-width="1"/>
                  <line x1="15" y1="40" x2="30" y2="40" stroke="currentColor" stroke-width="1"/>
                  <line x1="50" y1="20" x2="65" y2="20" stroke="currentColor" stroke-width="1"/>
                  <line x1="50" y1="25" x2="65" y2="25" stroke="currentColor" stroke-width="1"/>
                  <line x1="50" y1="30" x2="65" y2="30" stroke="currentColor" stroke-width="1"/>
                  <line x1="50" y1="35" x2="65" y2="35" stroke="currentColor" stroke-width="1"/>
                </svg>
              </div>
              <h3 class="text-xs sm:text-lg lg:text-xl font-bold text-gray-800 mb-1 sm:mb-3 text-center">단체 가입 특별 혜택</h3>
              <p class="text-[10px] sm:text-sm lg:text-base text-gray-500 text-center leading-tight sm:leading-relaxed">
                기업/공공, 숙박, 병원, 단체 등<br>
                단체 렌탈 가입 시 렌탈료 할인<br>
                등의 혜택을 드립니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// 이벤트 배너 (슬라이더)
function renderEventBanner() {
  const eventBanners = settings.eventBannerImages || [];
  
  // 배너가 없으면 표시하지 않음
  if (eventBanners.length === 0) {
    return '';
  }
  
  return `
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-8">
          <h2 class="text-4xl font-bold text-gray-900">이벤트</h2>
          <p class="text-gray-600 text-lg mt-2">진행중인 이벤트를 놓치지 마세요</p>
        </div>
        
        <div class="relative">
          <!-- 배너 슬라이더 -->
          <div id="event-banner-slider" class="relative overflow-hidden rounded-2xl shadow-2xl lg:h-[400px] h-[300px]">
            ${eventBanners.map((banner, idx) => {
              // 하위 호환성: 문자열이면 객체로 변환
              const bannerObj = typeof banner === 'string' ? { url: banner, link: '' } : banner;
              const hasLink = bannerObj.link && bannerObj.link.trim() !== '';
              
              // PC/모바일 이미지 URL 결정
              const pcImage = bannerObj.pcUrl || bannerObj.url || banner;
              const mobileImage = bannerObj.mobileUrl || pcImage;
              
              return `
              <div class="event-banner-slide absolute inset-0 transition-opacity duration-500 ${idx === 0 ? 'opacity-100' : 'opacity-0'}" 
                   data-index="${idx}">
                ${hasLink ? `<a href="${bannerObj.link}" class="block w-full h-full">` : ''}
                  <!-- PC 이미지 -->
                  <img src="${pcImage}" 
                       alt="Event Banner ${idx + 1}" 
                       class="hidden lg:block w-full h-full object-cover ${hasLink ? 'cursor-pointer hover:opacity-90 transition' : ''}">
                  <!-- 모바일 이미지 -->
                  <img src="${mobileImage}" 
                       alt="Event Banner ${idx + 1}" 
                       class="lg:hidden w-full h-full object-cover ${hasLink ? 'cursor-pointer hover:opacity-90 transition' : ''}">
                ${hasLink ? `</a>` : ''}
              </div>
              `;
            }).join('')}
          </div>

          <!-- 슬라이더 컨트롤 -->
          ${eventBanners.length > 1 ? `
            <button onclick="prevEventBanner()" 
                    class="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 w-12 h-12 rounded-full transition z-10">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button onclick="nextEventBanner()" 
                    class="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 w-12 h-12 rounded-full transition z-10">
              <i class="fas fa-chevron-right"></i>
            </button>

            <!-- 인디케이터 -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              ${eventBanners.map((_, idx) => `
                <button onclick="goToEventBanner(${idx})" 
                        class="event-banner-indicator w-3 h-3 rounded-full transition ${idx === 0 ? 'bg-white' : 'bg-white bg-opacity-50'}">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}

// 제휴 이벤트 배너 (단일 배너 - 하위 호환성)
function renderPartnershipBanner() {
  const bannerImage = settings.partnershipBannerImage;
  
  // 배너 이미지가 설정되지 않았으면 표시하지 않음
  if (!bannerImage) {
    return '';
  }
  
  return `
    <section class="py-8 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="rounded-2xl overflow-hidden shadow-xl">
          <img src="${bannerImage}" 
               alt="제휴 이벤트 배너" 
               class="w-full h-auto object-cover">
        </div>
      </div>
    </section>
  `;
}

// 대표 카테고리 영역 (Hero Categories)
function renderHeroCategories() {
  return `
    <section class="hero-categories py-16 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
          <i class="fas fa-star text-yellow-500 mr-2"></i>
          대표 서비스
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <!-- 생활가전 -->
          <a href="#products" 
             class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-blue-200 hover:border-blue-400">
            <div class="flex items-center mb-4">
              <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <i class="fas fa-home text-white text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  생활가전
                </h3>
                <p class="text-sm text-gray-600">전문 렌탈 서비스</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-droplet text-blue-500 mr-1"></i>제습기
              </span>
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-snowflake text-cyan-500 mr-1"></i>제빙기
              </span>
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-bed text-purple-500 mr-1"></i>매트리스
              </span>
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-spa text-green-500 mr-1"></i>안마기
              </span>
            </div>
            <div class="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
              상품 보기 <i class="fas fa-arrow-right ml-2"></i>
            </div>
          </a>

          <!-- 파트너점 모집 -->
          <a href="#partner" 
             class="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-green-200 hover:border-green-400">
            <div class="flex items-center mb-4">
              <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <i class="fas fa-handshake text-white text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  파트너점 모집
                </h3>
                <p class="text-sm text-gray-600">고수익 사업 기회</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-building text-green-500 mr-1"></i>단체건
              </span>
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-landmark text-yellow-500 mr-1"></i>관공서 공략
              </span>
              <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                <i class="fas fa-users text-blue-500 mr-1"></i>대량 렌탈
              </span>
            </div>
            <div class="mt-6 flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
              자세히 보기 <i class="fas fa-arrow-right ml-2"></i>
            </div>
          </a>
        </div>
      </div>
    </section>
  `;
}

// 제품 섹션
function renderProductSection() {
  return `
    <section id="products" class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <!-- 제품 필터 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-2">
              <label class="text-sm font-semibold text-gray-700">카테고리:</label>
              <select id="filter-category" onchange="filterProducts()" 
                      class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="all">전체</option>
                ${categories.map(cat => `
                  <option value="${cat.name}">${cat.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="flex items-center space-x-2">
              <label class="text-sm font-semibold text-gray-700">정렬:</label>
              <select id="filter-sort" onchange="filterProducts()" 
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
        <p class="text-lg">해당 조건의 제품이 없습니다.</p>
      </div>
    `;
  }

  return productList.map(product => `
    <a href="/product/${product.id}" 
       class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group">
      <div class="relative aspect-square bg-gray-100">
        ${product.promotionTag ? `
          <span class="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full z-10">
            ${product.promotionTag}
          </span>
        ` : ''}
        <img src="${product.image}" 
             alt="${product.name}" 
             class="w-full h-full object-contain p-4 group-hover:scale-105 transition"
             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
      </div>
      <div class="p-4">
        <div class="text-xs text-gray-500 mb-1">${product.category}</div>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-1">${product.description}</p>
        <div class="flex items-baseline justify-between">
          <div>
            <span class="text-xl font-bold text-blue-600">${calculateDiscountedPrice(product).toLocaleString()}</span>
            <span class="text-sm text-gray-600">원/월</span>
          </div>
          ${product.cardPrice && product.cardPrice !== '0' ? `
            <div class="text-right">
              <div class="text-xs text-gray-500">제휴카드</div>
              <div class="text-sm font-bold text-red-600">${formatPrice(product.cardPrice)}원</div>
            </div>
          ` : ''}
        </div>
      </div>
    </a>
  `).join('');
}

// 하단 고정 퀵메뉴 (간편상담신청)
function renderBottomQuickMenu() {
  const bottomMenu = settings.bottomMenuSettings || {};
  const pcLabel = bottomMenu.pcLabel || '렌탈 전화상담';
  const submitBtnText = bottomMenu.submitButtonText || '빠른상담신청';
  const mobileLeftIcon = bottomMenu.mobileLeftIcon || '✉️';
  const mobileLeftTitle = bottomMenu.mobileLeftTitle || '간편상담';
  const mobileLeftSubtitle = bottomMenu.mobileLeftSubtitle || '정보기입 / 문의내용 남기기';
  const mobileRightIcon = bottomMenu.mobileRightIcon || '📞';
  const mobileRightTitle = bottomMenu.mobileRightTitle || '공식 상담 채널';
  const mobileRightSubtitle = bottomMenu.mobileRightSubtitle || '바로 통화 연결';
  const consultationTitle = bottomMenu.consultationTitle || '청호나이스 렌탈상담';
  
  return `
    <!-- PC 하단 고정 빠른 상담 바 (항상 표시) -->
    <div id="pc-bottom-quick-bar" class="hidden lg:block fixed bottom-0 left-0 right-0 bg-blue-900 shadow-2xl z-50">
      <div class="container mx-auto px-4 py-3">
        <form id="quick-consultation-form-desktop" class="flex items-center justify-center gap-4">
          <!-- 전화 상담 영역 (왼쪽) -->
          <div class="flex items-center space-x-3 text-white pr-6 border-r border-white border-opacity-30">
            <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i class="fas fa-phone text-white text-lg"></i>
            </div>
            <div>
              <div class="text-xs opacity-80">${pcLabel}</div>
              <div class="font-bold text-base">${settings.phoneNumber}</div>
            </div>
          </div>

          <!-- 입력 필드 영역 (4개 필드) -->
          <input type="text" name="name" placeholder="이름" required
                 class="px-3 py-2 bg-white border-0 rounded focus:ring-2 focus:ring-blue-300 w-24 text-gray-900 placeholder-gray-400 text-sm">
          
          <input type="tel" name="phone" placeholder="연락처" required
                 class="px-3 py-2 bg-white border-0 rounded focus:ring-2 focus:ring-blue-300 w-32 text-gray-900 placeholder-gray-400 text-sm">
          
          <div class="relative">
            <select name="preferredTime"
                    class="px-3 py-2 bg-white border-0 rounded focus:ring-2 focus:ring-blue-300 w-44 text-gray-900 text-sm appearance-none cursor-pointer pr-8">
              <option value="" class="text-gray-400">연락받기 편한 시간대</option>
              <option value="오전 (9시~12시)">오전 (9시~12시)</option>
              <option value="오후 (12시~18시)">오후 (12시~18시)</option>
              <option value="저녁 (18시~21시)">저녁 (18시~21시)</option>
              <option value="언제든 가능">언제든 가능</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
          </div>
          
          <div class="relative">
            <select name="category" required
                    class="px-3 py-2 bg-white border-0 rounded focus:ring-2 focus:ring-blue-300 w-32 text-gray-900 text-sm appearance-none cursor-pointer pr-8">
              <option value="">관심 제품</option>
              <option value="정수기">정수기</option>
              <option value="공기청정기">공기청정기</option>
              <option value="비데·연수기">비데·연수기</option>
              <option value="생활가전">생활가전</option>
              <option value="전체">전체</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
          </div>

          <!-- 빠른상담신청 버튼 -->
          <button type="submit" 
                  class="bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded font-bold whitespace-nowrap transition-all text-sm flex items-center gap-1">
            <i class="fas fa-paper-plane"></i>${submitBtnText}
          </button>
          
          <!-- 개인정보 동의 (버튼 바로 옆) -->
          <label class="flex items-center space-x-2 text-white text-xs cursor-pointer whitespace-nowrap">
            <input type="checkbox" name="privacy" required 
                   class="w-4 h-4 rounded border-2 border-white bg-transparent checked:bg-blue-500">
            <span>개인정보 동의</span>
          </label>
          <button type="button" onclick="openPrivacyModal()" 
                  class="text-xs text-blue-300 hover:text-white hover:underline whitespace-nowrap transition">
            자세히
          </button>
        </form>
      </div>
    </div>

    <!-- PC 하단 바를 위한 바디 패딩 추가 -->
    <style>
      @media (min-width: 1024px) {
        body {
          padding-bottom: 80px;
        }
      }
    </style>

    <!-- 모바일용 하단 고정 CTA (전체폭 2분할) -->
    <div id="mobile-cta-bar" class="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 border-t-2 border-blue-600" 
         style="padding-bottom: env(safe-area-inset-bottom, 0px);">
      <div class="grid grid-cols-2 divide-x divide-gray-200">
        <!-- 좌측: 간편상담 버튼 -->
        <button onclick="openMobileConsultationForm()" 
                class="flex flex-col items-center justify-center py-4 px-4 hover:bg-blue-50 active:bg-blue-100 transition-colors">
          <div class="text-2xl mb-1">${mobileLeftIcon}</div>
          <div class="font-bold text-gray-900 text-base">${mobileLeftTitle}</div>
          <div class="text-xs text-gray-600 mt-0.5">${mobileLeftSubtitle}</div>
        </button>

        <!-- 우측: 전화상담 버튼 -->
        <a href="tel:${settings.phoneNumber}" 
           class="flex flex-col items-center justify-center py-4 px-4 hover:bg-green-50 active:bg-green-100 transition-colors">
          <div class="text-2xl mb-1">${mobileRightIcon}</div>
          <div class="font-bold text-gray-900 text-base">${mobileRightTitle}</div>
          <div class="text-xs text-gray-600 mt-0.5">${mobileRightSubtitle}</div>
        </a>
      </div>
    </div>

    <!-- 모바일 간편상담 폼 모달 -->
    <div id="mobile-consultation-modal" class="lg:hidden hidden fixed inset-0 bg-black bg-opacity-50 z-[100]" onclick="if(event.target === this) closeMobileConsultationForm();">
      <div class="bg-white w-full h-full overflow-y-auto overscroll-contain">
        <div class="min-h-full p-6" style="padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 300px);">
          <!-- 헤더 -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-2">
              <i class="fas fa-water text-blue-600 text-2xl"></i>
              <div>
                <div class="font-bold text-gray-900 text-lg">${consultationTitle}</div>
                <div class="text-sm text-gray-600">${settings.phoneNumber}</div>
              </div>
            </div>
            <button onclick="closeMobileConsultationForm()" 
                    class="text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- 상담신청 폼 -->
          <form id="quick-consultation-form-mobile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input type="text" name="name" placeholder="홍길동" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
              <input type="tel" name="phone" placeholder="010-1234-5678" required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">관심 제품 *</label>
              <select name="category" required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">카테고리를 선택해주세요</option>
                ${categories.filter(c => c.id <= 6).map(cat => `
                  <option value="${cat.name}">${cat.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">문의사항 (선택)</label>
              <textarea name="message" rows="3" placeholder="문의하실 내용을 입력해주세요"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
            </div>
            
            <div class="flex items-start space-x-2">
              <input type="checkbox" name="privacy" id="mobile-privacy" required 
                     class="mt-1 rounded">
              <label for="mobile-privacy" class="text-sm text-gray-600 flex-1">
                개인정보 수집 및 이용에 동의합니다.
                <button type="button" onclick="openPrivacyModal()" 
                        class="text-blue-600 hover:underline ml-1">
                  자세히보기
                </button>
              </label>
            </div>

            <button type="submit" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg transition">
              <i class="fas fa-paper-plane mr-2"></i>상담 신청하기
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// 퀵패널 토글 기능 (전역 함수)
window.toggleQuickPanel = function() {
  const content = document.getElementById('quick-panel-content');
  const toggle = document.getElementById('quick-panel-toggle');
  const icon = toggle.querySelector('i');
  
  if (content.classList.contains('hidden')) {
    // 펼치기
    content.classList.remove('hidden');
    icon.classList.remove('fa-chevron-left');
    icon.classList.add('fa-chevron-right');
  } else {
    // 숨기기
    content.classList.add('hidden');
    icon.classList.remove('fa-chevron-right');
    icon.classList.add('fa-chevron-left');
  }
}

// 우측 고정 퀵패널 (PC)
function renderRightQuickMenu() {
  const quickPanelLogo = settings.quickPanelLogo || '';
  const quickPanelSettings = settings.quickPanelSettings || {};
  const managerImage = quickPanelSettings.managerImage || '';
  const managerName = quickPanelSettings.managerName || '착한렌탈 매니저';
  
  return `
    <div id="right-quick-menu" class="fixed right-2 top-1/2 -translate-y-1/2 z-30 hidden lg:block transition-all duration-500">
      <!-- 토글 버튼 -->
      <button id="quick-panel-toggle" 
         class="absolute -left-8 top-0 bg-gray-800 text-white rounded-l-lg shadow-lg p-2 hover:bg-gray-700 transition w-8 h-10 flex items-center justify-center z-40"
         onclick="window.toggleQuickPanel()">
        <i class="fas fa-chevron-right text-sm"></i>
      </button>

      <div id="quick-panel-content" class="space-y-2 transition-all duration-500">
        <!-- 담당자 프로필 (고정 크기) -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition" style="width: 160px;">
          <div class="text-center">
            <div class="p-px">
              ${managerImage ? `
                <img src="${managerImage}" alt="${managerName}" class="object-cover rounded-t-lg" style="width: 158px; height: 158px;">
              ` : `
                <div class="bg-gray-200 rounded-t-lg flex items-center justify-center" style="width: 158px; height: 158px;">
                  <i class="fas fa-user text-5xl text-gray-400"></i>
                </div>
              `}
            </div>
            <div class="py-3">
              <div class="text-base font-bold text-gray-800 bg-gray-100 rounded px-4 py-1.5 inline-block whitespace-pre-line">${managerName}</div>
            </div>
          </div>
        </div>

        <!-- 청호나이스 + 전화상담 (더 작게) -->
        <div class="block bg-white rounded-lg shadow-lg p-2 hover:shadow-xl transition">
          <div class="text-center">
            ${quickPanelLogo ? `
              <img src="${quickPanelLogo}" alt="청호나이스" class="w-10 h-10 mx-auto mb-1 object-contain">
            ` : `
              <i class="fas fa-water text-2xl text-blue-600 mb-1"></i>
            `}
            <div class="text-sm font-bold text-gray-900">청호나이스</div>
            <div class="text-xs text-gray-500">공식 렌탈</div>
          </div>
          <div class="flex items-center justify-center mt-1.5">
            <i class="fas fa-phone text-blue-600 mr-1 text-sm"></i>
            <a href="tel:${settings.phoneNumber}" 
               class="text-blue-600 hover:text-blue-700 text-sm font-bold transition lg:pointer-events-none">
              ${settings.phoneNumber}
            </a>
          </div>
        </div>

        <!-- 사은품 안내 -->
        <a href="/gifts"
           class="block bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition group">
          <div class="text-center">
            <i class="fas fa-gift text-2xl text-pink-600 mb-1"></i>
            <div class="text-xs font-semibold text-gray-900">사은품 안내</div>
            <div class="text-xs text-gray-500">혜택 확인</div>
          </div>
        </a>

        <!-- 제휴카드 할인 -->
        <a href="/card"
           class="block bg-white rounded-lg shadow-lg p-3 hover:shadow-xl transition group">
          <div class="text-center">
            <i class="fas fa-credit-card text-2xl text-purple-600 mb-1"></i>
            <div class="text-xs font-semibold text-gray-900">제휴카드 할인</div>
            <div class="text-xs text-gray-500">추가 할인</div>
          </div>
        </a>

        <!-- TOP 버튼 -->
        <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" 
           class="block w-full bg-gray-100 text-gray-600 rounded-lg shadow p-2 hover:bg-gray-200 transition text-center">
          <i class="fas fa-arrow-up text-sm"></i>
        </button>
      </div>
    </div>
  `;
}

// 실시간 알림 (접수/설치 현황)
function renderRealtimeNotification() {
  return `
    <div id="realtime-notification" 
         class="fixed top-24 right-4 bg-white rounded-lg shadow-lg p-4 z-30 opacity-0 invisible transition-all duration-300 max-w-sm">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-check text-blue-600"></i>
          </div>
        </div>
        <div class="flex-1">
          <div class="font-bold text-gray-900 mb-1" id="notification-title">
            [접수완료]
          </div>
          <div class="text-sm text-gray-600" id="notification-content">
            2024-12-13 | 김*수 님 | 슈퍼아이스트리
          </div>
        </div>
        <button onclick="closeNotification()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
}

// 하단 Footer
function renderFooter() {
  return `
    <footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 mt-16">
      <div class="container mx-auto px-4">
        <!-- 상단 메뉴 -->
        <div class="flex flex-wrap items-center justify-center gap-4 pb-6 mb-6 border-b border-gray-700">
          <a href="#" onclick="openCompanyModal(); return false;" 
             class="text-gray-300 hover:text-white transition text-sm">
            회사소개
          </a>
          <span class="text-gray-600">|</span>
          <a href="#" onclick="openTermsModal(); return false;" 
             class="text-gray-300 hover:text-white transition text-sm">
            이용약관
          </a>
          <span class="text-gray-600">|</span>
          <a href="#" onclick="openPrivacyModal(); return false;" 
             class="text-gray-300 hover:text-white transition font-bold text-sm">
            개인정보 처리방침
          </a>
          <span class="text-gray-600">|</span>
          <a href="#" onclick="openUsageGuideModal(); return false;" 
             class="text-gray-300 hover:text-white transition text-sm">
            이용안내
          </a>
        </div>

        <!-- 회사 정보 - 3열 레이아웃 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <!-- 좌측: 회사 기본 정보 -->
          <div>
            <div class="flex items-center space-x-2 mb-4">
              ${settings.footerLogoIcon ? 
                `<img src="${settings.footerLogoIcon}" alt="Logo" class="w-8 h-8 object-contain">` :
                `<i class="fas fa-water text-blue-500 text-2xl"></i>`
              }
              <h3 class="text-xl font-bold">${settings.siteName || '청호나이스 렌탈 총판'}</h3>
            </div>
            
            <div class="space-y-2 text-sm text-gray-400">
              <p>
                <i class="fas fa-map-marker-alt mr-2 text-blue-500"></i>
                <strong class="text-gray-300">주소:</strong> ${settings.companyAddress || '대전광역시 동구 한밭대로 1245, 4F'}
              </p>
              <p>
                <i class="fas fa-phone mr-2 text-blue-500"></i>
                <strong class="text-gray-300">대표전화:</strong> ${settings.phoneNumber || '1660-3128'}
              </p>
              <p>
                <i class="fas fa-envelope mr-2 text-blue-500"></i>
                <strong class="text-gray-300">이메일:</strong> ${settings.companyEmail || 'chinhok@chungho.co.kr'}
              </p>
              <p>
                <i class="fas fa-id-card mr-2 text-blue-500"></i>
                <strong class="text-gray-300">사업자등록번호:</strong> ${settings.businessNumber || '348539'}
              </p>
              <p>
                <i class="fas fa-building mr-2 text-blue-500"></i>
                ${settings.companyName || '데이카이씨코리아(주)'} 대표이사: ${settings.ceoName || '하마타 타카유키'}
              </p>
              <p>
                <i class="fas fa-certificate mr-2 text-blue-500"></i>
                <strong class="text-gray-300">통신판매신고:</strong> ${settings.salesReportNumber || '제 2017-대전동구-0133 호'}
              </p>
              <p class="text-xs text-gray-500 mt-4">
                ${settings.footerNotice || '* 사용 빈도 등에 따라 제품 교환 시 차등 비용 발생 가능'}
              </p>
            </div>
          </div>

          <!-- 중앙: 본인인증 버튼 -->
          <div class="flex flex-col items-center justify-center">
            <button onclick="openSafekeyPopup()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-4">
              <i class="fas fa-shield-alt text-3xl"></i>
              <div class="text-left">
                <div class="text-xl">본인인증</div>
                <div class="text-sm font-normal opacity-90">(Safe-key발급)</div>
              </div>
            </button>
          </div>

          <!-- 우측: QR코드 & 인증마크 -->
          <div class="flex flex-col items-center lg:items-end space-y-3">
            <!-- QR 코드 -->
            ${settings.qrCode ? `
              <div class="bg-white p-3 rounded-lg shadow-lg">
                <div class="text-center mb-2">
                  <div class="text-blue-600 font-bold">${settings.qrCode.title || '청호나이스'}</div>
                  <div class="text-gray-600 text-xs">${settings.qrCode.subtitle || '공식 렌탈 브랜드'}</div>
                </div>
                <div class="w-24 h-24 bg-gray-200 flex items-center justify-center rounded">
                  ${settings.qrCode.imageUrl ? 
                    `<img src="${settings.qrCode.imageUrl}" alt="QR Code" class="w-full h-full object-contain">` :
                    `<i class="fas fa-qrcode text-5xl text-gray-400"></i>`
                  }
                </div>
                <p class="text-xs text-gray-600 text-center mt-1">${settings.qrCode.description || 'QR코드 스캔'}</p>
              </div>
            ` : ''}
            
            <!-- 인증 마크 -->
            <div class="flex flex-wrap justify-center lg:justify-end gap-2">
              ${(settings.certificationBadges || []).map(badge => `
                ${badge.link ? `<a href="${badge.link}" target="_blank" rel="noopener">` : ''}
                  <div class="bg-white px-3 py-2 rounded-lg shadow hover:shadow-lg transition">
                    ${badge.imageUrl ? 
                      `<img src="${badge.imageUrl}" alt="${badge.title}" class="h-12 object-contain">` :
                      `<div class="text-center">
                        <div class="text-blue-600 font-bold text-sm">${badge.title || ''}</div>
                        <div class="text-gray-600 text-xs">${badge.subtitle || ''}</div>
                      </div>`
                    }
                  </div>
                ${badge.link ? `</a>` : ''}
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 저작권 -->
        <div class="text-center pt-6 border-t border-gray-700">
          <p class="text-gray-500 text-sm">
            Copyright © ${new Date().getFullYear()} ${settings.siteName || '청호나이스 렌탈'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  `;
}

// Safe-key 발급 팝업 열기
function openSafekeyPopup() {
  const width = 600;
  const height = 700;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    'https://www.chungho.co.kr/nais/safekey.php',
    'SafekeyPopup',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );
}

// 회사소개 모달
function openCompanyModal() {
  const modal = document.createElement('div');
  modal.id = 'company-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold text-gray-900">회사소개</h3>
          <button onclick="document.getElementById('company-modal').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div class="prose max-w-none">
          <h4 class="font-bold text-lg mb-2">청호나이스 렌탈 총판</h4>
          <p class="text-gray-600 mb-4">
            청호나이스는 대한민국 1위 생활가전 렌탈 브랜드로, 정수기, 공기청정기, 비데, 매트리스 등 
            다양한 생활가전 제품을 렌탈 서비스로 제공하고 있습니다.
          </p>
          <h4 class="font-bold text-lg mb-2">주요 사업</h4>
          <ul class="list-disc pl-5 text-gray-600 mb-4">
            <li>정수기 렌탈 서비스</li>
            <li>공기청정기 렌탈 서비스</li>
            <li>비데 렌탈 서비스</li>
            <li>매트리스 렌탈 서비스</li>
            <li>생활가전 렌탈 서비스</li>
          </ul>
          <h4 class="font-bold text-lg mb-2">연락처</h4>
          <p class="text-gray-600">
            전화: ${settings.phoneNumber || '1660-3128'}<br>
            이메일: ${settings.companyEmail || 'chinhok@chungho.co.kr'}
          </p>
        </div>
      </div>
    </div>
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}

// 이용약관 모달
function openTermsModal() {
  const modal = document.createElement('div');
  modal.id = 'terms-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold text-gray-900">이용약관</h3>
          <button onclick="document.getElementById('terms-modal').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div class="prose max-w-none text-sm text-gray-600">
          <h4 class="font-bold text-lg mb-2">제1조 (목적)</h4>
          <p class="mb-4">
            본 약관은 청호나이스 렌탈 총판(이하 "회사")이 제공하는 렌탈 서비스의 이용과 관련하여 
            회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
          <h4 class="font-bold text-lg mb-2">제2조 (정의)</h4>
          <p class="mb-4">
            1. "렌탈 서비스"라 함은 회사가 제공하는 생활가전 제품의 대여 서비스를 말합니다.<br>
            2. "이용자"라 함은 본 약관에 따라 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
          </p>
          <h4 class="font-bold text-lg mb-2">제3조 (약관의 효력 및 변경)</h4>
          <p class="mb-4">
            1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.<br>
            2. 회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위에서 본 약관을 변경할 수 있습니다.
          </p>
          <h4 class="font-bold text-lg mb-2">제4조 (서비스의 제공)</h4>
          <p class="mb-4">
            회사는 이용자에게 다음과 같은 서비스를 제공합니다:<br>
            1. 생활가전 제품 렌탈 서비스<br>
            2. 정기적인 제품 관리 및 필터 교체 서비스<br>
            3. 고객 상담 및 A/S 서비스
          </p>
        </div>
      </div>
    </div>
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}

// 이용안내 모달
function openUsageGuideModal() {
  const modal = document.createElement('div');
  modal.id = 'usage-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold text-gray-900">이용안내</h3>
          <button onclick="document.getElementById('usage-modal').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div class="prose max-w-none">
          <h4 class="font-bold text-lg mb-2">렌탈 신청 방법</h4>
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <ol class="list-decimal pl-5 text-gray-700 space-y-2">
              <li>홈페이지 또는 전화(<strong class="text-blue-600">${settings.phoneNumber || '1660-3128'}</strong>)로 상담 신청</li>
              <li>전문 상담사와 제품 및 요금제 상담</li>
              <li>렌탈 계약 체결</li>
              <li>설치 일정 협의 및 제품 설치</li>
              <li>정기 관리 서비스 시작</li>
            </ol>
          </div>

          <h4 class="font-bold text-lg mb-2">렌탈 요금 안내</h4>
          <p class="text-gray-600 mb-4">
            - 제품별로 다양한 요금제가 제공됩니다<br>
            - 제휴카드 사용 시 추가 할인 혜택<br>
            - 의무 사용 기간: 제품별 상이 (3년/5년)<br>
            - 월 렌탈료에는 정기 관리 서비스 포함
          </p>

          <h4 class="font-bold text-lg mb-2">고객 센터</h4>
          <div class="bg-gray-100 p-4 rounded-lg">
            <p class="text-gray-700">
              <i class="fas fa-phone text-blue-600 mr-2"></i>
              전화: <strong>${settings.phoneNumber || '1660-3128'}</strong><br>
              <i class="fas fa-clock text-blue-600 mr-2"></i>
              운영시간: 평일 09:00 ~ 18:00 (점심시간 12:00~13:00)<br>
              <i class="fas fa-envelope text-blue-600 mr-2"></i>
              이메일: ${settings.companyEmail || 'chinhok@chungho.co.kr'}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}

// 개인정보처리방침 모달
function renderPrivacyModal() {
  return `
    <div id="privacy-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-gray-900">개인정보 처리방침</h3>
            <button onclick="closePrivacyModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="prose max-w-none">
            <h4 class="font-bold text-lg mb-2">1. 개인정보의 수집 및 이용 목적</h4>
            <p class="text-sm text-gray-600 mb-4">
              회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
              이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>

            <h4 class="font-bold text-lg mb-2">2. 개인정보의 처리 및 보유 기간</h4>
            <p class="text-sm text-gray-600 mb-4">
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 
              개인정보를 처리·보유합니다.
            </p>

            <h4 class="font-bold text-lg mb-2">3. 정보주체의 권리·의무 및 그 행사방법</h4>
            <p class="text-sm text-gray-600 mb-4">
              정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.
            </p>

            <h4 class="font-bold text-lg mb-2">4. 개인정보의 파기</h4>
            <p class="text-sm text-gray-600 mb-4">
              회사는 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체 없이 해당 개인정보를 파기합니다.
            </p>

            <h4 class="font-bold text-lg mb-2">5. 개인정보 보호책임자</h4>
            <p class="text-sm text-gray-600 mb-4">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 
              아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>

            <div class="text-sm text-gray-600 mb-4">
              <strong>개인정보 보호책임자</strong><br>
              - 이름: 신동석<br>
              - 전화: ${settings.phoneNumber}<br>
            </div>
          </div>

          <button onclick="closePrivacyModal()" 
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-4">
            확인
          </button>
        </div>
      </div>
    </div>
  `;
}

// 마케팅 활용 동의 모달
function renderMarketingModal() {
  return `
    <div id="marketing-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-gray-900">마케팅 활용 동의</h3>
            <button onclick="closeMarketingModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="prose max-w-none">
            <h4 class="font-bold text-lg mb-2">1. 마케팅 정보 수신 동의</h4>
            <p class="text-sm text-gray-600 mb-4">
              회사는 서비스 이용자에게 다양한 혜택 정보 및 이벤트 안내 등의 광고성 정보를 전자우편, SMS, 전화 등을 통해 전달할 수 있습니다.
            </p>

            <h4 class="font-bold text-lg mb-2">2. 수집 항목</h4>
            <p class="text-sm text-gray-600 mb-4">
              - 이름, 연락처, 이메일 주소<br>
              - 서비스 이용 기록, 상담 내역
            </p>

            <h4 class="font-bold text-lg mb-2">3. 이용 목적</h4>
            <p class="text-sm text-gray-600 mb-4">
              - 신규 서비스 및 이벤트 정보 안내<br>
              - 맞춤형 상품 추천 및 프로모션 제공<br>
              - 고객 만족도 조사 및 마케팅 분석
            </p>

            <h4 class="font-bold text-lg mb-2">4. 보유 기간</h4>
            <p class="text-sm text-gray-600 mb-4">
              동의일로부터 회원 탈퇴 또는 동의 철회 시까지 보유합니다.
            </p>

            <h4 class="font-bold text-lg mb-2">5. 동의 거부 권리</h4>
            <p class="text-sm text-gray-600 mb-4">
              위 마케팅 정보 수신 동의를 거부할 수 있으며, 거부 시에도 서비스 이용에는 제한이 없습니다. 
              다만 각종 혜택 및 이벤트 안내를 받지 못할 수 있습니다.
            </p>
          </div>

          <button onclick="closeMarketingModal()" 
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-4">
            확인
          </button>
        </div>
      </div>
    </div>
  `;
}

// 첫 방문 팝업 (지원금 안내)
function renderWelcomePopup() {
  const popup = settings.popupSettings || {};
  const badge = popup.badge || '특별 혜택';
  const title = popup.title || '청호나이스 렌탈 지원금';
  const subtitle = popup.subtitle || '지금 상담신청하고 최대 혜택 받으세요!';
  const benefitText = popup.benefitText || '최대 30만원';
  const benefitSubText = popup.benefitSubText || '지원금 혜택';
  const benefitNote = popup.benefitNote || '* 제품 및 약정기간에 따라 지원금이 상이합니다';
  const formTitle = popup.formTitle || '3초만에 내 지원금 확인하기';
  const formSubtitle = popup.formSubtitle || '전화번호를 입력해 주세요';
  const buttonText = popup.buttonText || '내 최대 지원금 안내 받기';
  
  return `
    <div id="welcome-popup" class="hidden fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-2 sm:p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-popup">
        <!-- 헤더 영역 -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white relative">
          <button onclick="closeWelcomePopup()" class="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition w-8 h-8 flex items-center justify-center bg-black bg-opacity-20 rounded-full z-10">
            <i class="fas fa-times text-lg"></i>
          </button>
          <div class="flex items-center gap-2 sm:gap-3 mb-2 pr-8">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i class="fas fa-gift text-lg sm:text-xl"></i>
            </div>
            <span class="text-xs sm:text-sm bg-yellow-400 text-yellow-900 px-2 sm:px-3 py-1 rounded-full font-bold">${badge}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold mb-1">${title}</h2>
          <p class="text-blue-100 text-xs sm:text-sm">${subtitle}</p>
        </div>
        
        <!-- 혜택 안내 -->
        <div class="p-4 sm:p-6 bg-gradient-to-b from-blue-50 to-white">
          <div class="text-center mb-4 sm:mb-6">
            <p class="text-gray-600 text-xs sm:text-sm mb-2">렌탈 가입 시 받을 수 있는</p>
            <div class="flex items-center justify-center gap-2">
              <span class="text-3xl sm:text-4xl font-black text-blue-600">${benefitText}</span>
              <span class="text-base sm:text-lg text-gray-700 font-bold">${benefitSubText}</span>
            </div>
            <p class="text-xs text-gray-500 mt-2">${benefitNote}</p>
          </div>
          
          <!-- 아이콘 영역 -->
          <div class="flex justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div class="text-center">
              <div class="w-10 h-10 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <i class="fas fa-tint text-blue-600 text-base sm:text-xl"></i>
              </div>
              <span class="text-xs text-gray-600">정수기</span>
            </div>
            <div class="text-center">
              <div class="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <i class="fas fa-wind text-green-600 text-base sm:text-xl"></i>
              </div>
              <span class="text-xs text-gray-600">공기청정기</span>
            </div>
            <div class="text-center">
              <div class="w-10 h-10 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <i class="fas fa-toilet text-purple-600 text-base sm:text-xl"></i>
              </div>
              <span class="text-xs text-gray-600">비데</span>
            </div>
            <div class="text-center">
              <div class="w-10 h-10 sm:w-14 sm:h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <i class="fas fa-couch text-orange-600 text-base sm:text-xl"></i>
              </div>
              <span class="text-xs text-gray-600">생활가전</span>
            </div>
          </div>
        </div>
        
        <!-- 입력 폼 -->
        <div class="p-4 sm:p-6 pt-0">
          <form id="popup-consultation-form" class="space-y-2 sm:space-y-3">
            <div class="text-center mb-3 sm:mb-4">
              <p class="text-blue-600 font-bold text-sm sm:text-base"><i class="fas fa-bell mr-1"></i> ${formTitle}</p>
              <p class="text-gray-500 text-xs sm:text-sm">${formSubtitle}</p>
            </div>
            
            <input type="text" name="name" placeholder="이름을 입력해주세요" required
                   class="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base">
            
            <input type="tel" name="phone" placeholder="연락처를 -없이 입력해주세요" required
                   class="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base">
            
            <!-- 동의 체크박스 -->
            <div class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <label class="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" id="popup-privacy-all" onchange="togglePopupAllAgree()" class="mt-1 w-4 h-4 rounded">
                <span class="font-bold text-gray-900">전체 동의</span>
              </label>
              <div class="pl-6 space-y-1 text-gray-600">
                <label class="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="privacy1" class="popup-privacy-item mt-0.5 w-4 h-4 rounded" required>
                  <span>(필수) 개인정보 수집 및 활용 동의 <button type="button" onclick="openPrivacyModal()" class="text-blue-500 hover:underline">></button></span>
                </label>
                <label class="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="privacy2" class="popup-privacy-item mt-0.5 w-4 h-4 rounded" required>
                  <span>(필수) 개인정보 제3자 제공 및 활용 동의 <button type="button" onclick="openPrivacyModal()" class="text-blue-500 hover:underline">></button></span>
                </label>
                <label class="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="marketing" class="popup-privacy-item mt-0.5 w-4 h-4 rounded">
                  <span>(선택) 마케팅 정보 수신 동의 <button type="button" onclick="openMarketingModal()" class="text-blue-500 hover:underline">></button></span>
                </label>
              </div>
            </div>
            
            <button type="submit" 
                    class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 rounded-lg transition-all shadow-lg text-sm sm:text-lg">
              <i class="fas fa-paper-plane mr-2"></i>${buttonText}
            </button>
          </form>
        </div>
        
        <!-- 하단 옵션 -->
        <div class="bg-gray-100 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input type="checkbox" id="popup-dont-show-today" class="w-4 h-4 rounded">
            <span>오늘 하루 보지 않기</span>
          </label>
          <button onclick="closeWelcomePopup()" class="text-sm text-gray-500 hover:text-gray-700">
            닫기
          </button>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes popupSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-popup {
        animation: popupSlideUp 0.3s ease-out;
      }
    </style>
  `;
}

// 팝업 표시 함수
function showWelcomePopup() {
  // 팝업 활성화 여부 확인
  const popupSettings = settings.popupSettings || {};
  if (popupSettings.enabled === false) {
    return; // 팝업이 비활성화됨
  }
  
  // 오늘 하루 보지 않기 체크 확인
  const hideUntil = localStorage.getItem('hideWelcomePopupUntil');
  if (hideUntil && new Date().getTime() < parseInt(hideUntil)) {
    return; // 아직 숨김 기간이 지나지 않음
  }
  
  // 0.5초 후 팝업 표시
  setTimeout(() => {
    const popup = document.getElementById('welcome-popup');
    if (popup) {
      popup.classList.remove('hidden');
    }
  }, 500);
}

// 팝업 닫기
window.closeWelcomePopup = function() {
  const popup = document.getElementById('welcome-popup');
  const dontShowToday = document.getElementById('popup-dont-show-today');
  
  if (dontShowToday && dontShowToday.checked) {
    // 오늘 자정까지 숨김
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    localStorage.setItem('hideWelcomePopupUntil', tomorrow.getTime().toString());
  }
  
  if (popup) {
    popup.classList.add('hidden');
  }
};

// 전체 동의 토글
window.togglePopupAllAgree = function() {
  const allCheckbox = document.getElementById('popup-privacy-all');
  const items = document.querySelectorAll('.popup-privacy-item');
  items.forEach(item => {
    item.checked = allCheckbox.checked;
  });
};

// ====================  이벤트 핸들러 ====================

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

// 배너 슬라이더
function startBannerSlider() {
  const banners = settings.mainBannerImages || ['https://via.placeholder.com/1920x600'];
  if (banners.length <= 1) return;
  
  bannerInterval = setInterval(() => {
    currentBannerIndex = (currentBannerIndex + 1) % banners.length;
    updateBannerDisplay();
  }, 5000);
}

window.nextBanner = function() {
  const banners = settings.mainBannerImages || [];
  currentBannerIndex = (currentBannerIndex + 1) % banners.length;
  updateBannerDisplay();
  resetBannerInterval();
};

window.prevBanner = function() {
  const banners = settings.mainBannerImages || [];
  currentBannerIndex = (currentBannerIndex - 1 + banners.length) % banners.length;
  updateBannerDisplay();
  resetBannerInterval();
};

window.goToBanner = function(index) {
  currentBannerIndex = index;
  updateBannerDisplay();
  resetBannerInterval();
};

function updateBannerDisplay() {
  document.querySelectorAll('.banner-slide').forEach((slide, idx) => {
    if (idx === currentBannerIndex) {
      slide.style.opacity = '1';
      slide.style.pointerEvents = 'auto';
    } else {
      slide.style.opacity = '0';
      slide.style.pointerEvents = 'none';
    }
  });
  
  document.querySelectorAll('.banner-indicator').forEach((indicator, idx) => {
    if (idx === currentBannerIndex) {
      indicator.classList.remove('bg-opacity-50');
      indicator.classList.add('bg-white');
    } else {
      indicator.classList.add('bg-opacity-50');
      indicator.classList.remove('bg-white');
    }
  });
}

function resetBannerInterval() {
  if (bannerInterval) {
    clearInterval(bannerInterval);
    startBannerSlider();
  }
}

// 이벤트 배너 슬라이더 제어
let currentEventBannerIndex = 0;
let eventBannerInterval = null;

function startEventBannerSlider() {
  const eventBanners = settings.eventBannerImages || [];
  if (eventBanners.length <= 1) return;
  
  eventBannerInterval = setInterval(() => {
    currentEventBannerIndex = (currentEventBannerIndex + 1) % eventBanners.length;
    updateEventBannerDisplay();
  }, 5000);
}

window.nextEventBanner = function() {
  const eventBanners = settings.eventBannerImages || [];
  currentEventBannerIndex = (currentEventBannerIndex + 1) % eventBanners.length;
  updateEventBannerDisplay();
  resetEventBannerInterval();
};

window.prevEventBanner = function() {
  const eventBanners = settings.eventBannerImages || [];
  currentEventBannerIndex = (currentEventBannerIndex - 1 + eventBanners.length) % eventBanners.length;
  updateEventBannerDisplay();
  resetEventBannerInterval();
};

window.goToEventBanner = function(index) {
  currentEventBannerIndex = index;
  updateEventBannerDisplay();
  resetEventBannerInterval();
};

function updateEventBannerDisplay() {
  document.querySelectorAll('.event-banner-slide').forEach((slide, idx) => {
    slide.style.opacity = idx === currentEventBannerIndex ? '1' : '0';
  });
  
  document.querySelectorAll('.event-banner-indicator').forEach((indicator, idx) => {
    if (idx === currentEventBannerIndex) {
      indicator.classList.remove('bg-opacity-50');
      indicator.classList.add('bg-white');
    } else {
      indicator.classList.add('bg-opacity-50');
      indicator.classList.remove('bg-white');
    }
  });
}

function resetEventBannerInterval() {
  if (eventBannerInterval) {
    clearInterval(eventBannerInterval);
    startEventBannerSlider();
  }
}

// 제품 필터링
window.filterProducts = async function() {
  const category = document.getElementById('filter-category').value;
  const sort = document.getElementById('filter-sort').value;
  
  try {
    let url = '/api/products?';
    if (category !== 'all') url += `category=${encodeURIComponent(category)}&`;
    if (sort) url += `sort=${sort}`;
    
    const response = await axios.get(url);
    const filtered = response.data;
    
    document.getElementById('products-grid').innerHTML = renderProductCards(filtered);
  } catch (error) {
    console.error('필터링 실패:', error);
  }
};

// 카테고리별 필터링 (메뉴 클릭용)
window.filterByCategory = async function(categoryName) {
  // 제품 섹션으로 스크롤
  const productsSection = document.getElementById('products');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // 필터 드롭다운 값 설정
  const categorySelect = document.getElementById('filter-category');
  if (categorySelect) {
    categorySelect.value = categoryName;
    // 필터 적용
    await filterProducts();
  }
};

// 하단 퀵메뉴
window.openBottomQuickMenu = function() {
  const menu = document.getElementById('bottom-quick-menu');
  const button = document.getElementById('open-bottom-quick');
  menu.classList.remove('translate-y-full');
  button.classList.add('hidden');
};

window.closeBottomQuickMenu = function() {
  const menu = document.getElementById('bottom-quick-menu');
  const button = document.getElementById('open-bottom-quick');
  menu.classList.add('translate-y-full');
  button.classList.remove('hidden');
};

// 개인정보처리방침 모달
window.openPrivacyModal = function() {
  document.getElementById('privacy-modal').classList.remove('hidden');
};

window.closePrivacyModal = function() {
  document.getElementById('privacy-modal').classList.add('hidden');
};

// 마케팅 모달 열기/닫기
window.openMarketingModal = function() {
  document.getElementById('marketing-modal').classList.remove('hidden');
};

window.closeMarketingModal = function() {
  document.getElementById('marketing-modal').classList.add('hidden');
};

// 실시간 접수 현황 데이터 저장
let realtimeStatusList = [];

// 실시간 접수 현황 업데이트 (3초마다 하나씩 아래에서 추가)
function startRealtimeStatusUpdate() {
  // 초기 5개 항목 생성
  for (let i = 0; i < 5; i++) {
    realtimeStatusList.push(generateRealtimeStatus());
  }
  renderRealtimeStatusList(); // 즉시 첫 렌더링
  
  // 3초마다 새 항목 추가 (맨 아래에 추가, 맨 위 제거 - 위로 올라가는 효과)
  setInterval(() => {
    addNewRealtimeStatus();
  }, 3000);
}

// 새 항목 추가 (애니메이션 효과)
function addNewRealtimeStatus() {
  const container = document.getElementById('realtime-status-list');
  if (!container) return;
  
  // 새 항목 생성
  const newStatus = generateRealtimeStatus();
  
  // 맨 위에 추가, 맨 아래 제거 (위에서 아래로 흐르는 효과)
  realtimeStatusList.unshift(newStatus); // 맨 앞(위)에 추가
  if (realtimeStatusList.length > 5) {
    realtimeStatusList.pop(); // 맨 뒤(아래) 제거
  }
  
  // 애니메이션과 함께 렌더링
  renderRealtimeStatusListWithAnimation();
}

// 랜덤 접수 현황 데이터 생성
function generateRealtimeStatus() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // 랜덤 이름 생성 (중간 * 처리)
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '전', '송', '문', '양'];
  const names = ['민수', '지훈', '서연', '지우', '예은', '도윤', '시우', '하은', '준서', '수빈', '은우', '서준', '하윤', '지호', '예진', '현우', '가은', '승현'];
  const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const customerName = `${randomSurname}*${randomName.charAt(1)}`;
  
  // 실제 제품 데이터에서 랜덤 선택
  let randomProduct = '청호나이스 제품';
  if (products && products.length > 0) {
    const randomIndex = Math.floor(Math.random() * products.length);
    randomProduct = products[randomIndex].name;
  }
  
  return {
    date: dateStr,
    name: customerName,
    product: randomProduct,
    id: Date.now() + Math.random()
  };
}

// 실시간 접수 현황 리스트 렌더링 (초기)
function renderRealtimeStatusList() {
  const container = document.getElementById('realtime-status-list');
  if (!container) return;
  
  // 고정된 5개의 슬롯 생성 (각 슬롯에 2개의 내용 레이어 - 현재/다음)
  container.innerHTML = `
    <div class="realtime-slot relative py-2 px-3 bg-gray-50 rounded-lg overflow-hidden" style="height: 40px;">
      <div class="realtime-current absolute inset-0 flex items-center justify-between py-2 px-3" data-index="0"></div>
      <div class="realtime-next absolute inset-0 flex items-center justify-between py-2 px-3 opacity-0" style="transform: translateY(-100%)" data-index="0"></div>
    </div>
    <div class="realtime-slot relative py-2 px-3 bg-gray-50 rounded-lg overflow-hidden" style="height: 40px;">
      <div class="realtime-current absolute inset-0 flex items-center justify-between py-2 px-3" data-index="1"></div>
      <div class="realtime-next absolute inset-0 flex items-center justify-between py-2 px-3 opacity-0" style="transform: translateY(-100%)" data-index="1"></div>
    </div>
    <div class="realtime-slot relative py-2 px-3 bg-gray-50 rounded-lg overflow-hidden" style="height: 40px;">
      <div class="realtime-current absolute inset-0 flex items-center justify-between py-2 px-3" data-index="2"></div>
      <div class="realtime-next absolute inset-0 flex items-center justify-between py-2 px-3 opacity-0" style="transform: translateY(-100%)" data-index="2"></div>
    </div>
    <div class="realtime-slot relative py-2 px-3 bg-gray-50 rounded-lg overflow-hidden" style="height: 40px;">
      <div class="realtime-current absolute inset-0 flex items-center justify-between py-2 px-3" data-index="3"></div>
      <div class="realtime-next absolute inset-0 flex items-center justify-between py-2 px-3 opacity-0" style="transform: translateY(-100%)" data-index="3"></div>
    </div>
    <div class="realtime-slot relative py-2 px-3 bg-gray-50 rounded-lg overflow-hidden" style="height: 40px;">
      <div class="realtime-current absolute inset-0 flex items-center justify-between py-2 px-3" data-index="4"></div>
      <div class="realtime-next absolute inset-0 flex items-center justify-between py-2 px-3 opacity-0" style="transform: translateY(-100%)" data-index="4"></div>
    </div>
  `;
  
  // 초기 내용 채우기
  updateSlotContents();
}

// 슬롯 내용 업데이트
function updateSlotContents() {
  const currentSlots = document.querySelectorAll('.realtime-current');
  currentSlots.forEach((slot, index) => {
    if (realtimeStatusList[index]) {
      const item = realtimeStatusList[index];
      slot.innerHTML = getStatusItemHTML(item);
    }
  });
}

// 상태 항목 HTML 생성
function getStatusItemHTML(item) {
  return `
    <div class="flex items-center space-x-2 text-sm">
      <span class="font-medium text-gray-700">${item.name}</span>
      <span class="text-gray-400">|</span>
      <span class="text-blue-600">${item.product}</span>
    </div>
    <span class="text-xs text-gray-500">${item.date}</span>
  `;
}

// 실시간 접수 현황 리스트 렌더링 (위에서 새 항목 추가, 아래로 밀려나는 애니메이션)
function renderRealtimeStatusListWithAnimation() {
  const slots = document.querySelectorAll('.realtime-slot');
  if (slots.length === 0) return;
  
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const duration = '0.6s';
  
  // 각 슬롯에 다음 내용 준비
  slots.forEach((slot, index) => {
    const currentLayer = slot.querySelector('.realtime-current');
    const nextLayer = slot.querySelector('.realtime-next');
    
    if (index === 0) {
      // 첫 번째 슬롯: 새 항목이 위에서 내려옴
      nextLayer.innerHTML = getStatusItemHTML(realtimeStatusList[0]);
      nextLayer.style.transition = 'none';
      nextLayer.style.transform = 'translateY(-100%)';
      nextLayer.style.opacity = '1';
    } else {
      // 나머지 슬롯: 이전 슬롯의 내용이 위에서 내려옴
      nextLayer.innerHTML = getStatusItemHTML(realtimeStatusList[index]);
      nextLayer.style.transition = 'none';
      nextLayer.style.transform = 'translateY(-100%)';
      nextLayer.style.opacity = '1';
    }
  });
  
  // 약간의 지연 후 애니메이션 시작
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      slots.forEach((slot, index) => {
        const currentLayer = slot.querySelector('.realtime-current');
        const nextLayer = slot.querySelector('.realtime-next');
        
        if (index === slots.length - 1) {
          // 마지막 슬롯: 현재 내용이 아래로 사라짐 (페이드 아웃)
          currentLayer.style.transition = `transform ${duration} ${easing}, opacity ${duration} ${easing}`;
          currentLayer.style.transform = 'translateY(100%)';
          currentLayer.style.opacity = '0';
        } else {
          // 나머지 슬롯: 현재 내용이 아래로 밀려남
          currentLayer.style.transition = `transform ${duration} ${easing}`;
          currentLayer.style.transform = 'translateY(100%)';
        }
        
        // 새 내용이 위에서 내려옴
        nextLayer.style.transition = `transform ${duration} ${easing}, opacity ${duration} ${easing}`;
        nextLayer.style.transform = 'translateY(0)';
        nextLayer.style.opacity = '1';
      });
    });
  });
  
  // 애니메이션 완료 후 레이어 교체
  setTimeout(() => {
    slots.forEach((slot, index) => {
      const currentLayer = slot.querySelector('.realtime-current');
      const nextLayer = slot.querySelector('.realtime-next');
      
      // 현재 레이어에 새 내용 복사
      if (realtimeStatusList[index]) {
        currentLayer.innerHTML = getStatusItemHTML(realtimeStatusList[index]);
      }
      
      // 레이어 위치 리셋 (애니메이션 없이)
      currentLayer.style.transition = 'none';
      currentLayer.style.transform = 'translateY(0)';
      currentLayer.style.opacity = '1';
      
      nextLayer.style.transition = 'none';
      nextLayer.style.transform = 'translateY(-100%)';
      nextLayer.style.opacity = '0';
    });
  }, 650);
}

// 실시간 알림
function startRealtimeNotifications() {
  setInterval(showRandomNotification, 15000); // 15초마다
}

function showRandomNotification() {
  const types = ['접수완료', '설치완료'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  // 한국 이름 목록 (마스킹 형태)
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황'];
  const names = ['민수', '지훈', '서연', '지우', '예은', '도윤', '시우', '하은', '준서', '수빈', '은우', '서준', '하윤', '지호'];
  const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const customerName = `${randomSurname}*${randomName.charAt(1)}`;
  
  // 금일 날짜로 자동 업데이트
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // 지정된 제품 리스트에서 랜덤 선택
  const heroProducts = [
    '제습기', '제빙기', '매트리스', '안마기',
    '정수기', '공기청정기', '비데', '연수기'
  ];
  
  // 실제 제품이 있으면 우선 사용, 없으면 heroProducts 사용
  let productName;
  if (products && products.length > 0) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    productName = randomProduct.name;
  } else {
    productName = heroProducts[Math.floor(Math.random() * heroProducts.length)];
  }
  
  const notification = document.getElementById('realtime-notification');
  document.getElementById('notification-title').textContent = `[${type}]`;
  document.getElementById('notification-content').textContent = `${dateStr} | ${customerName} 님 | ${productName}`;
  
  notification.classList.remove('opacity-0', 'invisible');
  notification.classList.add('opacity-100', 'visible');
  
  setTimeout(() => {
    notification.classList.remove('opacity-100', 'visible');
    notification.classList.add('opacity-0', 'invisible');
  }, 5000);
}

window.closeNotification = function() {
  const notification = document.getElementById('realtime-notification');
  notification.classList.remove('opacity-100', 'visible');
  notification.classList.add('opacity-0', 'invisible');
};

// 모바일 간편상담 모달
window.openMobileConsultationForm = function() {
  const modal = document.getElementById('mobile-consultation-modal');
  modal.classList.remove('hidden');
  // body 스크롤은 잠그지 않음 (모달 내부 스크롤 허용)
};

window.closeMobileConsultationForm = function() {
  const modal = document.getElementById('mobile-consultation-modal');
  modal.classList.add('hidden');
};

// Input 포커스 시 자동 스크롤 (키보드 대응)
function setupInputFocusScroll() {
  const modal = document.getElementById('mobile-consultation-modal');
  if (!modal) return;
  
  const inputs = modal.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      // 약간의 딜레이를 두고 스크롤 (키보드 애니메이션 대응)
      setTimeout(() => {
        // 입력칸이 모달 컨테이너 안에서 보이도록 스크롤
        const modalContainer = modal.querySelector('.overflow-y-auto');
        if (modalContainer) {
          const rect = this.getBoundingClientRect();
          const modalRect = modalContainer.getBoundingClientRect();
          
          // 입력칸이 화면 중앙~상단에 오도록 스크롤
          if (rect.top < modalRect.top + 100 || rect.bottom > modalRect.bottom - 100) {
            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 300);
    });
  });
}

// 스크롤 효과
function setupScrollEffects() {
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
      header.classList.add('shadow-lg');
    } else {
      header.classList.remove('shadow-lg');
    }
  });
}

// 폼 제출
function setupEventListeners() {
  // 모바일 Input 포커스 스크롤 설정
  setupInputFocusScroll();
  
  // 메인 배너 아래 간편상담신청 폼 (새 버전)
  const quickConsultationFormV2 = document.getElementById('quick-consultation-form-v2');
  if (quickConsultationFormV2) {
    quickConsultationFormV2.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('quick-customer-name-v2').value;
      const phone = document.getElementById('quick-customer-phone-v2').value;
      const privacyConsent = document.getElementById('quick-privacy-consent-v2').checked;
      const marketingConsent = document.getElementById('quick-marketing-consent-v2').checked;
      
      if (!privacyConsent) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return;
      }
      
      // 전화번호 형식 검증 (숫자만)
      const phonePattern = /^[0-9-]+$/;
      if (!phonePattern.test(phone)) {
        alert('연락처는 숫자만 입력해주세요.');
        return;
      }
      
      try {
        await axios.post('/api/applications', {
          name,
          phone,
          productId: null,
          productName: '[빠른상담] 메인배너',
          address: '',
          message: `렌탈 상담 신청 (마케팅동의: ${marketingConsent ? '예' : '아니오'})`
        });
        
        alert('상담 신청이 완료되었습니다!\n담당자가 곧 연락드리겠습니다.');
        quickConsultationFormV2.reset();
      } catch (error) {
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
  }
  
  // 데스크톱 간편상담 폼
  const quickFormDesktop = document.getElementById('quick-consultation-form-desktop');
  if (quickFormDesktop) {
    quickFormDesktop.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(quickFormDesktop);
      const name = formData.get('name');
      const phone = formData.get('phone');
      const category = formData.get('category');
      const preferredTime = formData.get('preferredTime') || '';
      const privacy = formData.get('privacy');
      
      if (!privacy) {
        alert('개인정보 처리방침에 동의해주세요.');
        return;
      }
      
      try {
        await axios.post('/api/applications', {
          name,
          phone,
          productId: null,
          productName: `[빠른상담] ${category}`,
          address: '',
          message: preferredTime ? `연락 희망 시간: ${preferredTime}` : ''
        });
        
        alert('상담 신청이 완료되었습니다!\n담당자가 곧 연락드리겠습니다.');
        quickFormDesktop.reset();
      } catch (error) {
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
  }

  // 모바일 간편상담 폼
  const quickFormMobile = document.getElementById('quick-consultation-form-mobile');
  if (quickFormMobile) {
    quickFormMobile.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(quickFormMobile);
      const name = formData.get('name');
      const phone = formData.get('phone');
      const category = formData.get('category');
      const message = formData.get('message') || '';
      const privacy = formData.get('privacy');
      
      if (!privacy) {
        alert('개인정보 처리방침에 동의해주세요.');
        return;
      }
      
      try {
        await axios.post('/api/applications', {
          name,
          phone,
          productId: null,
          productName: `[빠른상담] ${category}`,
          address: '',
          message: message || ''
        });
        
        alert('상담 신청이 완료되었습니다!\n담당자가 곧 연락드리겠습니다.');
        quickFormMobile.reset();
        closeMobileConsultationForm();
      } catch (error) {
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
  }

  // 팝업 상담신청 폼
  const popupForm = document.getElementById('popup-consultation-form');
  if (popupForm) {
    popupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(popupForm);
      const name = formData.get('name');
      const phone = formData.get('phone');
      const privacy1 = formData.get('privacy1');
      const privacy2 = formData.get('privacy2');
      
      if (!privacy1 || !privacy2) {
        alert('필수 개인정보 동의에 체크해주세요.');
        return;
      }
      
      try {
        const popupSettings = settings.popupSettings || {};
        const productName = popupSettings.productName || '[지원금 안내] 전체';
        
        await axios.post('/api/applications', {
          name,
          phone,
          productId: null,
          productName: productName,
          address: '',
          message: '팝업 지원금 안내 신청'
        });
        
        alert('신청이 완료되었습니다!\n담당자가 최대 지원금 안내를 위해 곧 연락드리겠습니다.');
        popupForm.reset();
        closeWelcomePopup();
      } catch (error) {
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    });
  }
}

// 제품 이미지 슬라이더 자동 전환 (베스트 상품용)
function startBestProductSliders() {
  const sliderIntervals = [];
  
  document.querySelectorAll('[id^="best-product-slider-"]').forEach((sliderEl, idx) => {
    const images = sliderEl.querySelectorAll('[data-slider-img^="' + idx + '-"]');
    const indicators = document.querySelectorAll('[data-slider-indicator^="' + idx + '-"]');
    
    if (images.length <= 1) return; // 이미지가 1개면 슬라이더 불필요
    
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      // 현재 이미지 숨기기
      images[currentIdx].classList.remove('opacity-100');
      images[currentIdx].classList.add('opacity-0');
      indicators[currentIdx].classList.remove('bg-blue-600');
      indicators[currentIdx].classList.add('bg-gray-300');
      
      // 다음 이미지로 이동
      currentIdx = (currentIdx + 1) % images.length;
      
      // 다음 이미지 표시
      images[currentIdx].classList.remove('opacity-0');
      images[currentIdx].classList.add('opacity-100');
      indicators[currentIdx].classList.remove('bg-gray-300');
      indicators[currentIdx].classList.add('bg-blue-600');
    }, 3000); // 3초마다 전환
    
    sliderIntervals.push(interval);
  });
  
  return sliderIntervals;
}

// ==================== 리뷰 슬라이더 제어 ====================

// 화면 크기에 따른 슬라이드 퍼센트 계산
function getReviewSlidePercent() {
  const width = window.innerWidth;
  if (width >= 1024) {
    return 100 / 3; // lg: 33.333% (3개 표시)
  } else if (width >= 640) {
    return 50; // sm: 50% (2개 표시)
  } else {
    return 85; // mobile: 85% (1개 + 다음 일부 표시)
  }
}

// 화면 크기에 따른 한 번에 보이는 슬라이드 수
function getVisibleSlides() {
  const width = window.innerWidth;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

// 리뷰 슬라이더 시작
function startReviewSlider() {
  const slider = document.getElementById('review-slider');
  if (!slider) return;
  
  // 전체 리뷰 개수
  totalReviewSlides = slider.children.length;
  if (totalReviewSlides <= 1) return;
  
  // 5초마다 자동 슬라이드 (1개씩)
  reviewSlideInterval = setInterval(() => {
    nextReviewSlide();
  }, 5000);
  
  // 화면 크기 변경 시 슬라이더 업데이트
  window.addEventListener('resize', () => {
    updateReviewSlider();
  });
}

// 다음 리뷰 슬라이드 (1개씩 이동)
window.nextReviewSlide = function() {
  const visibleSlides = getVisibleSlides();
  const maxSlide = Math.max(0, totalReviewSlides - visibleSlides);
  if (maxSlide === 0) return;
  
  currentReviewSlide = (currentReviewSlide + 1) % (maxSlide + 1);
  updateReviewSlider();
  resetReviewSlideTimer();
};

// 이전 리뷰 슬라이드 (1개씩 이동)
window.prevReviewSlide = function() {
  const visibleSlides = getVisibleSlides();
  const maxSlide = Math.max(0, totalReviewSlides - visibleSlides);
  if (maxSlide === 0) return;
  
  currentReviewSlide = (currentReviewSlide - 1 + maxSlide + 1) % (maxSlide + 1);
  updateReviewSlider();
  resetReviewSlideTimer();
};

// 특정 리뷰 슬라이드로 이동
window.goToReviewSlide = function(index) {
  if (index === currentReviewSlide) return;
  currentReviewSlide = index;
  updateReviewSlider();
  resetReviewSlideTimer();
};

// 리뷰 슬라이더 UI 업데이트
function updateReviewSlider() {
  const slider = document.getElementById('review-slider');
  if (!slider) return;
  
  // 화면 크기에 맞는 슬라이드 퍼센트로 이동
  const slidePercent = getReviewSlidePercent();
  slider.style.transform = `translateX(-${currentReviewSlide * slidePercent}%)`;
  
  // 인디케이터 업데이트
  document.querySelectorAll('.review-indicator').forEach((indicator, idx) => {
    if (idx === currentReviewSlide) {
      indicator.classList.remove('bg-gray-300', 'w-3');
      indicator.classList.add('bg-blue-600', 'w-6');
    } else {
      indicator.classList.remove('bg-blue-600', 'w-6');
      indicator.classList.add('bg-gray-300', 'w-3');
    }
  });
}

// 리뷰 슬라이더 타이머 리셋
function resetReviewSlideTimer() {
  if (reviewSlideInterval) {
    clearInterval(reviewSlideInterval);
  }
  reviewSlideInterval = setInterval(() => {
    nextReviewSlide();
  }, 5000);
}

// 초기화 실행
init();
