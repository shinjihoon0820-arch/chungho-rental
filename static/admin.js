// 청호나이스 렌탈 CMS - 관리자 대시보드 (완전판)

// 토큰 가져오기
function getAuthToken() {
  return localStorage.getItem('admin-token');
}

// 인증 헤더 생성
function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 인증 확인 및 리다이렉트
async function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = '/admin/login';
    return false;
  }
  
  try {
    const response = await axios.get('/api/admin/verify', {
      headers: getAuthHeaders()
    });
    if (!response.data.valid) {
      localStorage.removeItem('admin-token');
      window.location.href = '/admin/login';
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem('admin-token');
    window.location.href = '/admin/login';
    return false;
  }
}

// 로그아웃
function logout() {
  localStorage.removeItem('admin-token');
  window.location.href = '/admin/login';
}

// 금액 포맷팅 유틸리티 함수 (숫자에 콤마 추가)
function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '';
  // 문자열에서 숫자만 추출
  const numStr = String(price).replace(/[^0-9]/g, '');
  if (!numStr) return price; // 숫자가 없으면 원본 반환
  // 숫자에 콤마 추가
  return parseInt(numStr, 10).toLocaleString('ko-KR');
}

let currentTab = 'settings';
let siteSettings = {};
let products = [];
let applications = [];
let reviews = [];
let editingProduct = null;
let editingReview = null;

// Axios 인터셉터 설정 - 모든 요청에 인증 헤더 추가
axios.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 응답 인터셉터 - 401 에러 시 로그인 페이지로 리다이렉트
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && error.response?.data?.requireAuth) {
      localStorage.removeItem('admin-token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// 초기화
async function init() {
  // 인증 확인
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;
  
  await loadData();
  renderPage();
}

// 데이터 로드
async function loadData() {
  try {
    const [settingsRes, productsRes, appsRes, reviewsRes] = await Promise.all([
      axios.get('/api/admin/settings'),
      axios.get('/api/admin/products'),
      axios.get('/api/admin/applications'),
      axios.get('/api/admin/reviews')
    ]);
    siteSettings = settingsRes.data;
    products = productsRes.data;
    applications = appsRes.data;
    reviews = reviewsRes.data;
  } catch (error) {
    console.error('데이터 로딩 실패:', error);
    alert('데이터 로딩에 실패했습니다.');
  }
}

// 페이지 렌더링
function renderPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <!-- 헤더 -->
    <header class="bg-white shadow-md">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-blue-600">
            <i class="fas fa-cog mr-2"></i>청호나이스 CMS
          </h1>
          <div class="flex items-center space-x-4">
            <a href="/" target="_blank" class="text-gray-600 hover:text-gray-800">
              <i class="fas fa-external-link-alt mr-1"></i>사이트 보기
            </a>
            <button onclick="logout()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 탭 네비게이션 -->
    <div class="bg-gray-100 border-b">
      <div class="container mx-auto px-4">
        <div class="flex space-x-1">
          <button onclick="switchTab('settings')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'settings' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-sliders-h mr-2"></i>사이트 설정
          </button>
          <button onclick="switchTab('products')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'products' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-box mr-2"></i>제품 관리 (${products.length})
          </button>
          <button onclick="switchTab('applications')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'applications' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-clipboard-list mr-2"></i>렌탈 신청 (${applications.length})
          </button>
          <button onclick="switchTab('reviews')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'reviews' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-star mr-2"></i>고객 리뷰 (${reviews.length})
          </button>
          <button onclick="switchTab('popup')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'popup' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-window-restore mr-2"></i>팝업 관리
          </button>
          <button onclick="switchTab('bottomMenu')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'bottomMenu' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-bars mr-2"></i>하단 메뉴
          </button>
          <button onclick="switchTab('rentalGuide')" class="tab-btn px-6 py-3 font-medium ${currentTab === 'rentalGuide' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}">
            <i class="fas fa-info-circle mr-2"></i>렌탈 안내
          </button>
        </div>
      </div>
    </div>

    <!-- 컨텐츠 영역 -->
    <main class="container mx-auto px-4 py-8">
      <div id="tab-content"></div>
    </main>

    <!-- 제품 편집 모달 -->
    <div id="product-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900" id="modal-title">제품 편집</h3>
            <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <form id="product-form" class="space-y-6">
            <input type="hidden" id="edit-product-id">
            
            <div class="grid md:grid-cols-2 gap-6">
              <!-- 기본 정보 -->
              <div class="md:col-span-2 border-b pb-4">
                <h4 class="font-bold text-lg mb-4 text-gray-700">기본 정보</h4>
                <div class="grid md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
                    <select id="edit-category" required 
                            onchange="updateSubCategoryOptions()"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="정수기">정수기</option>
                      <option value="공기청정기">공기청정기</option>
                      <option value="비데">비데</option>
                      <option value="생활가전">생활가전</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">세부 카테고리</label>
                    <select id="edit-subCategory" 
                            onchange="updateOptionUIForCategory()"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">선택 안함</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">메뉴에서 세부 분류로 표시됩니다</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">제품명 *</label>
                    <input type="text" id="edit-name" required 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">모델명 *</label>
                    <input type="text" id="edit-modelName" required 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">설명 *</label>
                    <input type="text" id="edit-description" required 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>

              <!-- 가격 정보 -->
              <div class="md:col-span-2 border-b pb-4">
                <h4 class="font-bold text-lg mb-4 text-gray-700">가격 정보</h4>
                <div class="grid md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">대표 월 렌탈료 *</label>
                    <input type="text" id="edit-price" required placeholder="예: 39,900"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">홈페이지 목록에 표시되는 기준 가격</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">제휴카드 가격</label>
                    <input type="text" id="edit-cardPrice" placeholder="예: 26,900 (없으면 0)"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">프로모션 태그</label>
                    <select id="edit-promotionTag" 
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">없음</option>
                      <option value="HOT">HOT</option>
                      <option value="NEW">NEW</option>
                      <option value="BEST">BEST</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 제품 대표 이미지 -->
              <div class="md:col-span-2 border-b pb-4">
                <h4 class="font-bold text-lg mb-4 text-gray-700">제품 대표 이미지</h4>
                <p class="text-sm text-gray-600 mb-3">제품 카드와 목록에 표시될 이미지를 입력하세요 (최소 1개, 최대 8개). 여러 색상/옵션이 있는 경우 추가하세요.</p>
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-1" placeholder="대표 이미지 URL 1 (필수)" required
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-2" placeholder="대표 이미지 URL 2"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-3" placeholder="대표 이미지 URL 3"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-4" placeholder="대표 이미지 URL 4"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-5" placeholder="대표 이미지 URL 5"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-6" placeholder="대표 이미지 URL 6"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-7" placeholder="대표 이미지 URL 7"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-image-8" placeholder="대표 이미지 URL 8"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 자동 슬라이드: 2개 이상 등록하면 제품 카드에서 자동으로 슬라이드됩니다</p>
              </div>

              <!-- 상세 스펙 (확장형) -->
              <div class="md:col-span-2 border-b pb-4">
                <h4 class="font-bold text-lg mb-4 text-gray-700">
                  <i class="fas fa-list-alt mr-2"></i>상세 스펙 (제품정보 테이블)
                </h4>
                <p class="text-sm text-gray-600 mb-4">제품 상세페이지에 표 형태로 표시됩니다. 입력하지 않은 항목은 표시되지 않습니다.</p>
                
                <div class="grid md:grid-cols-3 gap-4">
                  <!-- 기본 정보 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">크기/치수</label>
                    <input type="text" id="edit-size" placeholder="예: (W)430 X (D)498 X (H)1,490 mm"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">색상</label>
                    <input type="text" id="edit-colorList" placeholder="예: 화이트, 블랙, 실버"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">용량/면적</label>
                    <input type="text" id="edit-specs" placeholder="예: 정수 15.0ℓ / 온수 3.8ℓ"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  
                  <!-- 정수기 관련 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">정수방식</label>
                    <input type="text" id="edit-purificationMethod" placeholder="예: 역삼투압(RO) 방식"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">필터 타입</label>
                    <input type="text" id="edit-filterType" placeholder="예: AT-W 프리카본"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">냉각방식</label>
                    <input type="text" id="edit-coolingMethod" placeholder="예: 직수 냉각방식"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  
                  <!-- 추가 스펙 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">온수온도</label>
                    <input type="text" id="edit-hotWaterTemp" placeholder="예: 85℃ ~ 90℃"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">냉수온도</label>
                    <input type="text" id="edit-coldWaterTemp" placeholder="예: 4℃ ~ 8℃"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">소비전력</label>
                    <input type="text" id="edit-powerConsumption" placeholder="예: 냉각 100W / 온수 500W"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  
                  <!-- 공기청정기 관련 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">적용면적</label>
                    <input type="text" id="edit-coverageArea" placeholder="예: 99.2㎡ (약 30평)"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">청정방식</label>
                    <input type="text" id="edit-cleaningMethod" placeholder="예: HEPA 필터 + UV 살균"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">CADR</label>
                    <input type="text" id="edit-cadr" placeholder="예: 430㎥/h"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  
                  <!-- 기타 공통 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">무게</label>
                    <input type="text" id="edit-weight" placeholder="예: 18.5kg"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">설치방식</label>
                    <input type="text" id="edit-installationType" placeholder="예: 스탠드형 / 언더싱크"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">에너지등급</label>
                    <input type="text" id="edit-energyRating" placeholder="예: 1등급"
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
                
                <p class="text-xs text-blue-600 mt-4">💡 팁: 해당 제품에 맞는 항목만 입력하세요. 정수기는 정수방식, 공기청정기는 적용면적 등을 입력하시면 됩니다.</p>
              </div>

              <!-- 상품 옵션 관리 (NEW) -->
              <div class="md:col-span-2 border-b pb-4 bg-gray-50 p-4 rounded-lg">
                <h4 class="font-bold text-lg mb-4 text-gray-700">
                  <i class="fas fa-list-ul mr-2"></i>상품 옵션 관리
                </h4>
                <p class="text-sm text-gray-600 mb-4">고객이 선택할 수 있는 옵션과 가격 변동을 설정하세요. (가격은 기본 월 렌탈료에 더해집니다)</p>

                <!-- 색상 관리 (매트리스일 때는 사이즈로 변경) -->
                <div id="color-option-section" class="mb-6 border-b pb-6">
                  <div class="flex justify-between items-center mb-2">
                    <label id="color-option-label" class="block text-sm font-medium text-gray-700">🎨 색상 옵션</label>
                    <button type="button" onclick="addOptionRow('colors')" class="text-sm text-blue-600 hover:text-blue-800">
                      <i class="fas fa-plus"></i> <span id="color-option-add-text">색상 추가</span>
                    </button>
                  </div>
                  <div id="options-colors-container" class="space-y-2">
                    <!-- 동적 생성 -->
                  </div>
                </div>
                
                <!-- 사이즈별 상세 설정 (매트리스 전용) -->
                <div id="size-details-section" class="mb-6 border-b pb-6 hidden">
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">📐 사이즈별 상세 설정</label>
                  </div>
                  <p class="text-xs text-gray-500 mb-3">각 사이즈별로 가격, 스펙 등을 다르게 설정할 수 있습니다.</p>
                  <div id="size-details-container" class="space-y-3">
                    <!-- 동적 생성 -->
                  </div>
                </div>

                <!-- 가격 정책 관리 (조합형) -->
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">💰 상세 요금표 (관리유형 + 약정기간 조합)</label>
                    <button type="button" onclick="addOptionRow('pricePolicies')" class="text-sm text-blue-600 hover:text-blue-800">
                      <i class="fas fa-plus"></i> 요금 추가
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 mb-2">관리유형, 의무기간, 월 렌탈료, 제휴카드 할인시 가격을 입력하세요.</p>
                  
                  <!-- 헤더 -->
                  <div class="flex gap-2 mb-2 text-xs font-bold text-gray-500 text-center">
                    <div class="flex-1">관리</div>
                    <div class="flex-1">의무기간</div>
                    <div class="w-28">월 렌탈료</div>
                    <div class="w-28">제휴카드 할인시</div>
                    <div class="w-8"></div>
                  </div>
                  
                  <div id="options-pricePolicies-container" class="space-y-2">
                    <!-- 동적 생성 -->
                  </div>
                  <p class="text-xs text-blue-600 mt-3">💡 팁: 관리유형(셀프(12개월), 방문(2개월), 방문(3개월), 방문(4개월), 방문(6개월), 방문(8개월))과 약정기간(6년, 5년, 4년, 3년)을 조합하세요</p>
                </div>
              </div>

              <!-- 주요 특징 -->
              <div class="md:col-span-2 border-b pb-4">
                <h4 class="font-bold text-lg mb-4 text-gray-700">주요 특징</h4>
                <div class="space-y-3">
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-feature-1" placeholder="특징 1"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-feature-2" placeholder="특징 2"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div class="flex items-center space-x-2">
                    <input type="text" id="edit-feature-3" placeholder="특징 3"
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>

              <!-- 물 타입 (정수기만) -->
              <div class="md:col-span-2 border-b pb-4">
                <h4 class="font-bold text-lg mb-4 text-gray-700">물 타입 (정수기만 해당)</h4>
                <div class="flex flex-wrap gap-3">
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" id="edit-water-정수" value="정수" class="rounded">
                    <span>💧 정수</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" id="edit-water-냉수" value="냉수" class="rounded">
                    <span>❄️ 냉수</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" id="edit-water-온수" value="온수" class="rounded">
                    <span>🔥 온수</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" id="edit-water-얼음" value="얼음" class="rounded">
                    <span>🧊 얼음</span>
                  </label>
                </div>
              </div>

              <!-- 상세 이미지 -->
              <div class="md:col-span-2">
                <h4 class="font-bold text-lg mb-4 text-gray-700">제품 상세 이미지</h4>
                <p class="text-sm text-gray-600 mb-3">제품 상세 페이지 하단에 표시될 이미지 URL을 입력하세요 (최대 30개)</p>
                <div id="detail-images-container" class="space-y-3 max-h-96 overflow-y-auto pr-2">
                  <!-- 동적으로 생성됨 -->
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 청호나이스 공식 사이트의 이미지 URL을 직접 링크하세요</p>
                <p class="text-xs text-blue-600 mt-1">📌 스크롤하여 30개까지 입력 가능합니다</p>
              </div>
            </div>

            <div class="flex space-x-4 pt-6">
              <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
                <i class="fas fa-save mr-2"></i>저장
              </button>
              <button type="button" onclick="closeProductModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition">
                <i class="fas fa-times mr-2"></i>취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  renderTabContent();
  setupEventListeners();
  initDetailImageFields();
}

// 이벤트 리스너 설정 (중복 방지)
let listenersSetup = false;
function setupEventListeners() {
  // 이미 설정되었으면 중복 실행 방지
  if (listenersSetup) return;
  listenersSetup = true;
  
  // 설정 폼 제출
  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await axios.post('/api/admin/settings', data);
      alert('기본 설정이 저장되었습니다!');
      await loadData();
    } catch (error) {
      alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
  });

  // 최상단 배너 폼 제출
  document.getElementById('top-banner-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    const updatedSettings = { ...siteSettings, ...data };
    
    try {
      await axios.put('/api/admin/settings', updatedSettings);
      alert('최상단 배너가 저장되었습니다!');
      await loadData();
      renderTabContent();
    } catch (error) {
      alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
  });

  // Footer 정보 폼 제출
  document.getElementById('footer-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedSettings = {
      companyAddress: formData.get('companyAddress'),
      companyEmail: formData.get('companyEmail'),
      businessNumber: formData.get('businessNumber'),
      companyName: formData.get('companyName'),
      ceoName: formData.get('ceoName'),
      salesReportNumber: formData.get('salesReportNumber'),
      footerNotice: formData.get('footerNotice'),
      footerLogoIcon: formData.get('footerLogoIcon'),
      quickPanelLogo: formData.get('quickPanelLogo')
    };

    try {
      await axios.put('/api/admin/settings', updatedSettings);
      alert('Footer 회사 정보 및 퀵패널 로고가 저장되었습니다!');
      await loadData();
      renderTabContent();
    } catch (error) {
      alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
  });

  // 베스트 상품 폼 제출
  document.getElementById('best-products-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedIds = formData.getAll('bestProducts').map(id => parseInt(id));

    if (selectedIds.length > 4) {
      alert('베스트 상품은 최대 4개까지 선택 가능합니다.');
      return;
    }

    try {
      await axios.put('/api/admin/settings', { bestProductIds: selectedIds });
      alert('베스트 주력상품이 저장되었습니다!');
      await loadData();
      renderTabContent();
    } catch (error) {
      alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
  });

  // 제품 폼 제출
  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('edit-product-id').value;
    const productData = {
      category: document.getElementById('edit-category').value,
      subCategory: document.getElementById('edit-subCategory').value || '',
      name: document.getElementById('edit-name').value,
      modelName: document.getElementById('edit-modelName').value,
      description: document.getElementById('edit-description').value,
      price: formatPrice(document.getElementById('edit-price').value),
      cardPrice: formatPrice(document.getElementById('edit-cardPrice').value) || '0',
      images: Array.from({ length: 8 }, (_, i) => 
        document.getElementById(`edit-image-${i+1}`).value
      ).filter(url => url),
      size: document.getElementById('edit-size').value,
      specs: document.getElementById('edit-specs').value,
      filterType: document.getElementById('edit-filterType').value || '-',
      // 확장 상세 스펙 필드
      colorList: document.getElementById('edit-colorList').value,
      purificationMethod: document.getElementById('edit-purificationMethod').value,
      coolingMethod: document.getElementById('edit-coolingMethod').value,
      hotWaterTemp: document.getElementById('edit-hotWaterTemp').value,
      coldWaterTemp: document.getElementById('edit-coldWaterTemp').value,
      powerConsumption: document.getElementById('edit-powerConsumption').value,
      coverageArea: document.getElementById('edit-coverageArea').value,
      cleaningMethod: document.getElementById('edit-cleaningMethod').value,
      cadr: document.getElementById('edit-cadr').value,
      weight: document.getElementById('edit-weight').value,
      installationType: document.getElementById('edit-installationType').value,
      energyRating: document.getElementById('edit-energyRating').value,
      promotionTag: document.getElementById('edit-promotionTag').value,
      features: [
        document.getElementById('edit-feature-1').value,
        document.getElementById('edit-feature-2').value,
        document.getElementById('edit-feature-3').value
      ].filter(f => f),
      waterTypes: ['정수', '냉수', '온수', '얼음']
        .filter(type => document.getElementById(`edit-water-${type}`)?.checked),
      detailImages: Array.from({ length: 30 }, (_, i) => 
        document.getElementById(`edit-detailImage-${i+1}`).value
      ).filter(url => url),
      // 옵션 데이터 수집
      options: {
        colors: Array.from(document.querySelectorAll('.option-row-colors')).map(row => {
          const imgIdxInput = row.querySelector('.opt-image-index').value;
          return {
            name: row.querySelector('.opt-name').value,
            code: row.querySelector('.opt-value').value,
            imageIndex: imgIdxInput !== "" ? parseInt(imgIdxInput) : undefined
          };
        }).filter(o => o.name),
        // 조합형 가격 정책 (관리유형 + 약정기간 + 월렌탈료 + 제휴카드 할인)
        pricePolicies: Array.from(document.querySelectorAll('.option-row-pricePolicies')).map(row => ({
          managementType: row.querySelector('.opt-management-type').value,
          period: row.querySelector('.opt-period').value,
          price: parseInt(row.querySelector('.opt-price').value.replace(/,/g, '') || 0),
          cardPrice: parseInt(row.querySelector('.opt-card-price').value.replace(/,/g, '') || 0) || null
        })).filter(o => o.managementType && o.period && o.price > 0),
        // 사이즈별 상세 설정 (매트리스용) - 스펙 + 요금표 포함
        sizeDetails: (() => {
          const details = {};
          document.querySelectorAll('.size-detail-item').forEach(item => {
            const sizeName = item.dataset.sizeName;
            if (sizeName) {
              // 사이즈별 요금 정책 수집
              const pricePolicies = [];
              item.querySelectorAll('.size-price-row').forEach(row => {
                const price = parseInt((row.querySelector('.size-row-price')?.value || '0').replace(/,/g, '')) || 0;
                if (price > 0) {
                  pricePolicies.push({
                    managementType: row.querySelector('.size-mgmt-type')?.value || '셀프',
                    period: row.querySelector('.size-period')?.value || '6년',
                    price: price,
                    cardPrice: parseInt((row.querySelector('.size-row-card-price')?.value || '0').replace(/,/g, '')) || 0
                  });
                }
              });
              
              details[sizeName] = {
                specs: item.querySelector('.size-specs')?.value || '',
                description: item.querySelector('.size-description')?.value || '',
                pricePolicies: pricePolicies
              };
            }
          });
          return Object.keys(details).length > 0 ? details : undefined;
        })()
      }
    };

    try {
      if (productId) {
        // 수정
        await axios.put(`/api/admin/products/${productId}`, productData);
        alert('제품이 수정되었습니다!');
      } else {
        // 추가
        await axios.post('/api/admin/products', productData);
        alert('제품이 추가되었습니다!');
      }
      
      await loadData();
      closeProductModal();
      renderTabContent();
    } catch (error) {
      alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
  });
}

// 탭 전환
window.switchTab = function(tab) {
  currentTab = tab;
  renderTabContent();
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-white', 'text-blue-600', 'border-b-2', 'border-blue-600');
    btn.classList.add('text-gray-600');
  });
  event.target.closest('button').classList.add('bg-white', 'text-blue-600', 'border-b-2', 'border-blue-600');
  event.target.closest('button').classList.remove('text-gray-600');
};

// 탭 컨텐츠 렌더링
function renderTabContent() {
  const content = document.getElementById('tab-content');
  
  if (currentTab === 'settings') {
    content.innerHTML = renderSettingsTab();
    setupEventListeners();
  } else if (currentTab === 'products') {
    content.innerHTML = renderProductsTab();
  } else if (currentTab === 'applications') {
    content.innerHTML = renderApplicationsTab();
  } else if (currentTab === 'reviews') {
    content.innerHTML = renderReviewsTab();
  } else if (currentTab === 'popup') {
    content.innerHTML = renderPopupTab();
  } else if (currentTab === 'bottomMenu') {
    content.innerHTML = renderBottomMenuTab();
  } else if (currentTab === 'rentalGuide') {
    content.innerHTML = renderRentalGuideTab();
    setupRentalGuideListeners();
  }
}

// 설정 탭
function renderSettingsTab() {
  const banners = siteSettings.mainBannerImages || [];
  const quickImages = siteSettings.quickMenuImages || [];
  
  return `
    <div class="space-y-8">
      <!-- 전체 데이터 백업/복구 -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border-2 border-blue-200">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-database mr-2"></i>전체 데이터 백업 & 복구
        </h2>
        <p class="text-sm text-gray-600 mb-4">
          ⚠️ 서버 재시작 시 모든 데이터가 초기화됩니다. 정기적으로 백업하세요!<br>
          📦 <strong>백업에 포함되는 내용:</strong> 사이트 설정, 배너, 제품 데이터, 제품 이미지, 베스트 상품, 렌탈 신청 내역
        </p>
        <div class="flex gap-4">
          <button onclick="exportSettings()" 
                  class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            <i class="fas fa-download mr-2"></i>전체 백업 다운로드 (JSON)
          </button>
          <button onclick="document.getElementById('import-file-input').click()" 
                  class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition">
            <i class="fas fa-upload mr-2"></i>백업 파일로 복구 (JSON)
          </button>
          <input type="file" id="import-file-input" accept=".json" style="display: none" onchange="importSettings(event)">
        </div>
        <p class="text-xs text-gray-500 mt-3">
          💡 팁: 데이터를 수정한 후 반드시 백업 파일을 다운로드하여 안전하게 보관하세요.<br>
          🔄 복구 시 모든 기존 데이터가 백업 파일로 완전히 교체됩니다.
        </p>
      </div>

      <!-- 기본 사이트 설정 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-sliders-h mr-2"></i>기본 설정
        </h2>
        <form id="settings-form" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">사이트명</label>
            <input type="text" name="siteName" value="${siteSettings.siteName || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">로고 이미지 URL</label>
            <input type="text" name="logoImage" value="${siteSettings.logoImage || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <p class="text-xs text-gray-500 mt-1">권장 크기: 높이 48px, 투명 배경 PNG 권장 (비어있으면 텍스트 로고 사용)</p>
            ${siteSettings.logoImage ? `
              <div class="mt-2 p-4 bg-gray-100 rounded-lg">
                <img src="${siteSettings.logoImage}" alt="Logo Preview" class="h-12 w-auto">
              </div>
            ` : ''}
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">사이트 설명</label>
            <input type="text" name="siteDescription" value="${siteSettings.siteDescription || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">메인 프로모션 문구</label>
            <input type="text" name="mainPromotion" value="${siteSettings.mainPromotion || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <p class="text-xs text-gray-500 mt-1">예: 🎉 신규 가입 시 첫 달 50% 할인!</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">고객센터 전화번호</label>
            <input type="text" name="phoneNumber" value="${siteSettings.phoneNumber || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">카카오톡 ID</label>
            <input type="text" name="kakaoId" value="${siteSettings.kakaoId || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">📱 카카오톡 상담 링크</label>
            <input type="text" name="kakaoLink" value="${siteSettings.kakaoLink || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="https://pf.kakao.com/...">
            <p class="text-xs text-gray-500 mt-1">제품 상세페이지의 '카카오톡 상담' 버튼 클릭 시 이동할 링크</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">입금 계좌 정보</label>
            <input type="text" name="bankInfo" value="${siteSettings.bankInfo || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">푸터 텍스트</label>
            <input type="text" name="footerText" value="${siteSettings.footerText || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>기본 설정 저장
          </button>
        </form>
      </div>

      <!-- 최상단 배너 설정 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-image mr-2"></i>최상단 배너 설정
        </h2>
        <form id="top-banner-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">배너 타이틀</label>
            <input type="text" name="topBannerTitle" value="${siteSettings.topBannerTitle || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">배너 이미지 URL</label>
            <input type="text" name="topBannerImage" value="${siteSettings.topBannerImage || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <p class="text-xs text-gray-500 mt-1">권장 크기: 1920 x 80px</p>
          </div>
          ${siteSettings.topBannerImage ? `
            <div class="mt-2">
              <img src="${siteSettings.topBannerImage}" alt="Top Banner Preview" class="w-full h-auto border rounded">
            </div>
          ` : ''}
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>최상단 배너 저장
          </button>
        </form>
      </div>

      <!-- 메인 배너 슬라이더 설정 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-images mr-2"></i>메인 배너 슬라이더
          </h2>
          <button onclick="addBannerSlide()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>배너 추가
          </button>
        </div>
        
        <div id="banner-slides-container" class="space-y-4">
          ${banners.map((banner, idx) => `
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold">배너 ${idx + 1}</h4>
                <button onclick="removeBannerSlide(${idx})" class="text-red-600 hover:text-red-800">
                  <i class="fas fa-trash"></i> 삭제
                </button>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-desktop mr-1"></i>PC 이미지 URL (1920x600px 권장) <span class="text-red-500">*</span>
                  </label>
                  <input type="text" value="${banner.pcUrl || banner.url || banner || ''}" 
                         onchange="updateBannerSlide(${idx}, 'pcUrl', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="https://example.com/pc-banner.jpg">
                  <p class="text-xs text-gray-500 mt-1">💻 PC 화면용 가로 배너 (필수)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-mobile-alt mr-1"></i>모바일 이미지 URL (800x800px 권장)
                  </label>
                  <input type="text" value="${banner.mobileUrl || ''}" 
                         onchange="updateBannerSlide(${idx}, 'mobileUrl', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="https://example.com/mobile-banner.jpg">
                  <p class="text-xs text-gray-500 mt-1">📱 모바일 화면용 정사각형 배너 (선택, 없으면 PC 이미지 사용)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">배너 제목 (선택사항)</label>
                  <input type="text" value="${banner.title || ''}" 
                         onchange="updateBannerSlide(${idx}, 'title', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="제목을 입력하세요 (선택사항)">
                  <p class="text-xs text-gray-500 mt-1">비워두면 이미지만 표시됩니다</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">배너 부제목 (선택사항)</label>
                  <input type="text" value="${banner.subtitle || ''}" 
                         onchange="updateBannerSlide(${idx}, 'subtitle', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="부제목을 입력하세요 (선택사항)">
                  <p class="text-xs text-gray-500 mt-1">비워두면 이미지만 표시됩니다</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-link mr-1"></i>링크 URL (선택사항)
                  </label>
                  <input type="text" value="${banner.link || ''}" 
                         onchange="updateBannerSlide(${idx}, 'link', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="/product/1 또는 https://example.com">
                  <p class="text-xs text-gray-500 mt-1">배너 클릭 시 이동할 링크를 입력하세요</p>
                </div>
                ${(banner.pcUrl || banner.url || banner) ? `
                  <div class="mt-3">
                    <p class="text-sm font-medium text-gray-700 mb-2">미리보기:</p>
                    <div class="grid md:grid-cols-2 gap-3">
                      <div>
                        <p class="text-xs text-gray-600 mb-1">💻 PC 버전</p>
                        <img src="${banner.pcUrl || banner.url || banner}" alt="PC Banner ${idx + 1}" 
                             class="w-full h-auto border rounded"
                             onerror="this.style.display='none'">
                      </div>
                      ${banner.mobileUrl ? `
                        <div>
                          <p class="text-xs text-gray-600 mb-1">📱 모바일 버전</p>
                          <img src="${banner.mobileUrl}" alt="Mobile Banner ${idx + 1}" 
                               class="w-full h-auto border rounded"
                               onerror="this.style.display='none'">
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        <button onclick="saveBannerSlides()" class="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
          <i class="fas fa-save mr-2"></i>배너 슬라이더 저장
        </button>
      </div>

      <!-- Footer 회사 정보 설정 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-building mr-2"></i>Footer 회사 정보
        </h2>
        <form id="footer-form" class="space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">회사 주소</label>
              <input type="text" name="companyAddress" value="${siteSettings.companyAddress || ''}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">회사 이메일</label>
              <input type="email" name="companyEmail" value="${siteSettings.companyEmail || ''}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">사업자등록번호</label>
              <input type="text" name="businessNumber" value="${siteSettings.businessNumber || ''}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">회사명</label>
              <input type="text" name="companyName" value="${siteSettings.companyName || ''}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">대표이사</label>
              <input type="text" name="ceoName" value="${siteSettings.ceoName || ''}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">통신판매신고번호</label>
            <input type="text" name="salesReportNumber" value="${siteSettings.salesReportNumber || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">하단 안내문구</label>
            <input type="text" name="footerNotice" value="${siteSettings.footerNotice || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="* 사용 빈도 등에 따라 제품 교환 시 차등 비용 발생 가능">
            <p class="text-xs text-gray-500 mt-1">Footer 하단에 표시될 안내 문구</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-water mr-1"></i>Footer 로고 아이콘 이미지 URL
            </label>
            <input type="text" name="footerLogoIcon" value="${siteSettings.footerLogoIcon || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="https://example.com/logo-icon.png">
            <p class="text-xs text-gray-500 mt-1">회사명 앞에 표시될 로고 아이콘 이미지 (비어있으면 물결 아이콘 표시)</p>
            ${siteSettings.footerLogoIcon ? `
              <div class="mt-2">
                <img src="${siteSettings.footerLogoIcon}" alt="Footer Logo Icon" class="w-8 h-8 border rounded">
              </div>
            ` : ''}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-columns mr-1"></i>우측 퀵패널 로고 이미지 URL
            </label>
            <input type="text" name="quickPanelLogo" value="${siteSettings.quickPanelLogo || ''}" 
                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="https://example.com/quick-panel-logo.png">
            <p class="text-xs text-gray-500 mt-1">우측 고정 퀵패널 상단에 표시될 로고 이미지 (비어있으면 물방울 아이콘 표시, 권장: 64x64px)</p>
            ${siteSettings.quickPanelLogo ? `
              <div class="mt-2">
                <img src="${siteSettings.quickPanelLogo}" alt="Quick Panel Logo" class="w-16 h-16 border rounded">
              </div>
            ` : ''}
          </div>

          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>Footer 정보 저장
          </button>
        </form>
      </div>
      
      <!-- Footer QR코드 & 인증마크 설정 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-qrcode mr-2"></i>Footer QR코드 & 인증마크
        </h2>
        
        <!-- QR 코드 설정 -->
        <div class="border rounded-lg p-4 bg-gray-50 mb-6">
          <h3 class="font-bold text-lg mb-4">QR 코드</h3>
          <div class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input type="text" id="qr-title" value="${(siteSettings.qrCode || {}).title || '청호나이스'}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">부제목</label>
                <input type="text" id="qr-subtitle" value="${(siteSettings.qrCode || {}).subtitle || '공식 렌탈 브랜드'}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">QR코드 이미지 URL</label>
              <input type="text" id="qr-image" value="${(siteSettings.qrCode || {}).imageUrl || ''}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                     placeholder="https://example.com/qrcode.png">
              <p class="text-xs text-gray-500 mt-1">비어있으면 기본 QR 아이콘이 표시됩니다</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <input type="text" id="qr-description" value="${(siteSettings.qrCode || {}).description || 'QR코드 스캔'}" 
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            ${(siteSettings.qrCode || {}).imageUrl ? `
              <div class="mt-2">
                <img src="${siteSettings.qrCode.imageUrl}" alt="QR Code Preview" class="w-32 h-32 border rounded">
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- 인증 마크 설정 -->
        <div class="border rounded-lg p-4 bg-gray-50 mb-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg">인증 마크 / 배지</h3>
            <button onclick="addCertificationBadge()" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
              <i class="fas fa-plus mr-1"></i>배지 추가
            </button>
          </div>
          
          <div id="certification-badges-container" class="space-y-4">
            ${(siteSettings.certificationBadges || []).map((badge, idx) => `
              <div class="border rounded-lg p-4 bg-white">
                <div class="flex justify-between items-center mb-3">
                  <h4 class="font-semibold">배지 ${idx + 1}</h4>
                  <button onclick="removeCertificationBadge(${idx})" class="text-red-600 hover:text-red-800 text-sm">
                    <i class="fas fa-trash"></i> 삭제
                  </button>
                </div>
                <div class="space-y-3">
                  <div class="grid md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">제목</label>
                      <input type="text" value="${badge.title || ''}" 
                             onchange="updateCertificationBadge(${idx}, 'title', this.value)"
                             class="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">부제목</label>
                      <input type="text" value="${badge.subtitle || ''}" 
                             onchange="updateCertificationBadge(${idx}, 'subtitle', this.value)"
                             class="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">이미지 URL</label>
                    <input type="text" value="${badge.imageUrl || ''}" 
                           onchange="updateCertificationBadge(${idx}, 'imageUrl', this.value)"
                           class="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                           placeholder="https://example.com/badge.png">
                    <p class="text-xs text-gray-500 mt-1">비어있으면 제목/부제목 텍스트가 표시됩니다</p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">링크 URL (선택사항)</label>
                    <input type="text" value="${badge.link || ''}" 
                           onchange="updateCertificationBadge(${idx}, 'link', this.value)"
                           class="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                           placeholder="https://example.com">
                  </div>
                  ${badge.imageUrl ? `
                    <div class="mt-2">
                      <img src="${badge.imageUrl}" alt="Badge Preview" class="h-16 border rounded">
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          ${(siteSettings.certificationBadges || []).length === 0 ? `
            <div class="text-center py-4 text-gray-500 text-sm">
              등록된 인증 마크가 없습니다. '배지 추가' 버튼을 클릭하세요.
            </div>
          ` : ''}
        </div>
        
        <button onclick="saveFooterExtras()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
          <i class="fas fa-save mr-2"></i>QR코드 & 인증마크 저장
        </button>
      </div>

      <!-- 베스트 주력상품 선택 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-star mr-2 text-yellow-500"></i>베스트 주력상품 선택
        </h2>
        <p class="text-sm text-gray-600 mb-4">첫 페이지에 표시할 베스트 상품 4개를 선택하세요</p>
        <form id="best-products-form" class="space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            ${products.map(product => {
              const isSelected = (siteSettings.bestProductIds || []).includes(product.id);
              return `
                <label class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition ${isSelected ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}">
                  <input type="checkbox" 
                         name="bestProducts" 
                         value="${product.id}" 
                         ${isSelected ? 'checked' : ''}
                         onchange="handleBestProductChange(this)"
                         class="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                  <div class="ml-3 flex-1">
                    <div class="flex items-center">
                      ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" class="w-12 h-12 object-cover rounded mr-3">` : ''}
                      <div>
                        <p class="font-semibold text-gray-900">${product.name}</p>
                        <p class="text-xs text-gray-500">${product.category}</p>
                      </div>
                    </div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>베스트 상품 저장
          </button>
        </form>
      </div>

      <!-- 페이지 관리 (파트너점 모집, 제휴카드, 사은품) -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-file-alt mr-2"></i>페이지 관리
        </h2>
        <p class="text-sm text-gray-600 mb-6">파트너점 모집, 제휴카드, 사은품 페이지의 이미지를 관리하세요</p>
        
        <!-- 파트너점 모집 페이지 -->
        <div class="border rounded-lg p-6 bg-gray-50 mb-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-800">
                <i class="fas fa-handshake mr-2"></i>파트너점 모집
              </h3>
              <a href="/partner.html" target="_blank" class="text-blue-600 text-sm hover:underline">
                <i class="fas fa-external-link-alt mr-1"></i>페이지 미리보기
              </a>
            </div>
            <button onclick="addPageImage('partner')" class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
              <i class="fas fa-plus mr-1"></i>이미지 추가
            </button>
          </div>
          
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">페이지 제목</label>
              <input type="text" id="partner-title" value="${(siteSettings.partnerPage || {}).title || '파트너점 모집'}" 
                     class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">페이지 부제목</label>
              <input type="text" id="partner-subtitle" value="${(siteSettings.partnerPage || {}).subtitle || '함께 성장할 파트너를 찾습니다'}" 
                     class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div id="partner-images-container" class="space-y-3">
            ${((siteSettings.partnerPage || {}).images || []).map((img, idx) => `
              <div class="flex gap-2">
                <input type="text" value="${img}" 
                       onchange="updatePageImage('partner', ${idx}, this.value)"
                       class="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                       placeholder="https://example.com/partner${idx + 1}.jpg">
                <button onclick="removePageImage('partner', ${idx})" class="text-red-600 hover:text-red-800 px-3">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `).join('')}
          </div>
          
          ${((siteSettings.partnerPage || {}).images || []).length === 0 ? `
            <p class="text-gray-500 text-sm text-center py-4">등록된 이미지가 없습니다.</p>
          ` : ''}
        </div>
        
        <!-- 제휴카드 페이지 -->
        <div class="border rounded-lg p-6 bg-gray-50 mb-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-800">
                <i class="fas fa-credit-card mr-2"></i>제휴카드
              </h3>
              <a href="/card" target="_blank" class="text-blue-600 text-sm hover:underline">
                <i class="fas fa-external-link-alt mr-1"></i>페이지 미리보기
              </a>
            </div>
            <button onclick="addPageImage('card')" class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
              <i class="fas fa-plus mr-1"></i>이미지 추가
            </button>
          </div>
          
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">페이지 제목</label>
              <input type="text" id="card-title" value="${(siteSettings.cardPage || {}).title || '제휴카드 혜택'}" 
                     class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">페이지 부제목</label>
              <input type="text" id="card-subtitle" value="${(siteSettings.cardPage || {}).subtitle || '제휴카드로 더 큰 할인 혜택을 받으세요'}" 
                     class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div id="card-images-container" class="space-y-3">
            ${((siteSettings.cardPage || {}).images || []).map((img, idx) => `
              <div class="flex gap-2">
                <input type="text" value="${img}" 
                       onchange="updatePageImage('card', ${idx}, this.value)"
                       class="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                       placeholder="https://example.com/card${idx + 1}.jpg">
                <button onclick="removePageImage('card', ${idx})" class="text-red-600 hover:text-red-800 px-3">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `).join('')}
          </div>
          
          ${((siteSettings.cardPage || {}).images || []).length === 0 ? `
            <p class="text-gray-500 text-sm text-center py-4">등록된 이미지가 없습니다.</p>
          ` : ''}
        </div>
        
        <!-- 사은품 페이지 -->
        <div class="border rounded-lg p-6 bg-gray-50 mb-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-800">
                <i class="fas fa-gift mr-2"></i>사은품
              </h3>
              <a href="/gifts" target="_blank" class="text-blue-600 text-sm hover:underline">
                <i class="fas fa-external-link-alt mr-1"></i>페이지 미리보기
              </a>
            </div>
            <button onclick="addPageImage('gift')" class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
              <i class="fas fa-plus mr-1"></i>이미지 추가
            </button>
          </div>
          
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">페이지 제목</label>
              <input type="text" id="gift-title" value="${(siteSettings.giftPage || {}).title || '사은품 안내'}" 
                     class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">페이지 부제목</label>
              <input type="text" id="gift-subtitle" value="${(siteSettings.giftPage || {}).subtitle || '렌탈 신청 시 다양한 사은품을 드립니다'}" 
                     class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div id="gift-images-container" class="space-y-3">
            ${((siteSettings.giftPage || {}).images || []).map((img, idx) => `
              <div class="flex gap-2">
                <input type="text" value="${img}" 
                       onchange="updatePageImage('gift', ${idx}, this.value)"
                       class="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                       placeholder="https://example.com/gift${idx + 1}.jpg">
                <button onclick="removePageImage('gift', ${idx})" class="text-red-600 hover:text-red-800 px-3">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `).join('')}
          </div>
          
          ${((siteSettings.giftPage || {}).images || []).length === 0 ? `
            <p class="text-gray-500 text-sm text-center py-4">등록된 이미지가 없습니다.</p>
          ` : ''}
        </div>
        
        <button onclick="savePageManagement()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
          <i class="fas fa-save mr-2"></i>페이지 정보 저장
        </button>
      </div>

      <!-- 이벤트 배너 슬라이더 설정 (새로운!) -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-images mr-2"></i>이벤트 배너 슬라이더
            </h2>
            <p class="text-sm text-gray-600 mt-2">메인 배너 아래 이벤트 섹션에 표시될 배너를 관리하세요</p>
          </div>
          <button onclick="addEventBanner()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>배너 추가
          </button>
        </div>
        
        <div id="event-banner-slides-container" class="space-y-4">
          ${(siteSettings.eventBannerImages || []).map((banner, idx) => {
            // 하위 호환성: 문자열이면 객체로 변환
            const bannerObj = typeof banner === 'string' ? { url: banner, link: '' } : banner;
            return `
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-bold">이벤트 배너 ${idx + 1}</h4>
                <button onclick="removeEventBanner(${idx})" class="text-red-600 hover:text-red-800">
                  <i class="fas fa-trash"></i> 삭제
                </button>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-desktop mr-1"></i>PC 이미지 URL (1920x400px 권장) <span class="text-red-500">*</span>
                  </label>
                  <input type="text" value="${bannerObj.pcUrl || bannerObj.url || ''}" 
                         onchange="updateEventBanner(${idx}, 'pcUrl', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="https://example.com/pc-event-banner.jpg">
                  <p class="text-xs text-gray-500 mt-1">💻 PC 화면용 가로 배너 (필수)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-mobile-alt mr-1"></i>모바일 이미지 URL (800x600px 권장)
                  </label>
                  <input type="text" value="${bannerObj.mobileUrl || ''}" 
                         onchange="updateEventBanner(${idx}, 'mobileUrl', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="https://example.com/mobile-event-banner.jpg">
                  <p class="text-xs text-gray-500 mt-1">📱 모바일 화면용 배너 (선택, 없으면 PC 이미지 사용)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-link mr-1"></i>링크 URL (선택사항)
                  </label>
                  <input type="text" value="${bannerObj.link || ''}" 
                         onchange="updateEventBanner(${idx}, 'link', this.value)"
                         class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="/product/1 또는 https://example.com">
                  <p class="text-xs text-gray-500 mt-1">배너 클릭 시 이동할 링크를 입력하세요</p>
                </div>
                ${(bannerObj.pcUrl || bannerObj.url) ? `
                  <div class="mt-3">
                    <p class="text-sm font-medium text-gray-700 mb-2">미리보기:</p>
                    <div class="grid md:grid-cols-2 gap-3">
                      <div>
                        <p class="text-xs text-gray-600 mb-1">💻 PC 버전</p>
                        <img src="${bannerObj.pcUrl || bannerObj.url}" alt="PC Event Banner ${idx + 1}" 
                             class="w-full h-auto border rounded"
                             onerror="this.style.display='none'">
                      </div>
                      ${bannerObj.mobileUrl ? `
                        <div>
                          <p class="text-xs text-gray-600 mb-1">📱 모바일 버전</p>
                          <img src="${bannerObj.mobileUrl}" alt="Mobile Event Banner ${idx + 1}" 
                               class="w-full h-auto border rounded"
                               onerror="this.style.display='none'">
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
            `;
          }).join('')}
        </div>
        
        ${(siteSettings.eventBannerImages || []).length === 0 ? `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-image text-4xl mb-2"></i>
            <p>등록된 이벤트 배너가 없습니다. '배너 추가' 버튼을 클릭하세요.</p>
          </div>
        ` : ''}
        
        <button onclick="saveEventBanners()" class="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
          <i class="fas fa-save mr-2"></i>이벤트 배너 저장
        </button>
      </div>
    </div>
  `;
}

// 제품 관리 탭
function renderProductsTab() {
  // 홈페이지와 일치하는 카테고리 구조 (메인 카테고리 + 세부 카테고리)
  const siteCategories = [
    { 
      name: '정수기', 
      icon: 'fa-tint', 
      dataCategory: '정수기',
      subCategories: ['얼음정수기', '냉온정수기', '냉정수기', '일반정수기']
    },
    { 
      name: '공기청정기', 
      icon: 'fa-wind', 
      dataCategory: '공기청정기',
      subCategories: ['10평형', '20평형', '30평형', '40평형', '제습공기청정기']
    },
    { 
      name: '비데·연수기', 
      icon: 'fa-toilet', 
      dataCategory: '비데',
      subCategories: ['비데', '연수기']
    },
    { 
      name: '생활가전', 
      icon: 'fa-couch', 
      dataCategory: '생활가전',
      subCategories: ['제빙기', '매트리스', '안마의자', '패키지']
    },
    { 
      name: '기타', 
      icon: 'fa-box', 
      dataCategory: '기타',
      subCategories: []
    }
  ];
  
  // 카테고리별로 제품 그룹핑
  const productsByCategory = {};
  siteCategories.forEach(cat => {
    const catProducts = products.filter(p => p.category === cat.dataCategory);
    productsByCategory[cat.name] = {
      all: catProducts,
      bySubCategory: {}
    };
    
    // 세부 카테고리별 분류
    if (cat.subCategories.length > 0) {
      cat.subCategories.forEach(subCat => {
        productsByCategory[cat.name].bySubCategory[subCat] = catProducts.filter(p => p.subCategory === subCat);
      });
      // 미분류 (세부 카테고리가 없는 제품)
      const classified = catProducts.filter(p => cat.subCategories.includes(p.subCategory));
      const unclassifiedInCat = catProducts.filter(p => !cat.subCategories.includes(p.subCategory));
      if (unclassifiedInCat.length > 0) {
        productsByCategory[cat.name].bySubCategory['미분류'] = unclassifiedInCat;
      }
    }
  });
  
  // 미분류 제품 확인 (기타에 포함)
  const classifiedCategories = siteCategories.map(c => c.dataCategory);
  const unclassified = products.filter(p => !classifiedCategories.includes(p.category));
  if (unclassified.length > 0) {
    productsByCategory['기타'].all = [...(productsByCategory['기타'].all || []), ...unclassified];
  }
  
  const globalDetailImages = siteSettings.globalProductDetailImages || { image1: '', image2: '', image3: '', image4: '' };
  
  return `
    <div class="space-y-6">
      <!-- 전체 제품 공통 상세 이미지 설정 -->
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">
            <i class="fas fa-images mr-2 text-purple-600"></i>전체 제품 공통 상세 이미지
          </h3>
          <button onclick="saveGlobalDetailImages()" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
            <i class="fas fa-save mr-2"></i>이미지 저장
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          아래 이미지들은 <strong>모든 제품</strong>의 상세 페이지 하단에 공통으로 표시됩니다. (예: 회사 소개, 서비스 안내, 렌탈 혜택 등)
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공통 이미지 1</label>
            <input type="text" id="global-detail-image-1" value="${globalDetailImages.image1 || ''}" 
                   placeholder="이미지 URL 입력"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm">
            <div class="mt-2 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              ${globalDetailImages.image1 ? 
                `<img src="${globalDetailImages.image1}" class="max-h-full max-w-full object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <span class="text-gray-400 text-xs hidden"><i class="fas fa-image"></i></span>` : 
                `<span class="text-gray-400 text-xs"><i class="fas fa-image mr-1"></i>미리보기</span>`}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공통 이미지 2</label>
            <input type="text" id="global-detail-image-2" value="${globalDetailImages.image2 || ''}" 
                   placeholder="이미지 URL 입력"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm">
            <div class="mt-2 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              ${globalDetailImages.image2 ? 
                `<img src="${globalDetailImages.image2}" class="max-h-full max-w-full object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <span class="text-gray-400 text-xs hidden"><i class="fas fa-image"></i></span>` : 
                `<span class="text-gray-400 text-xs"><i class="fas fa-image mr-1"></i>미리보기</span>`}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공통 이미지 3</label>
            <input type="text" id="global-detail-image-3" value="${globalDetailImages.image3 || ''}" 
                   placeholder="이미지 URL 입력"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm">
            <div class="mt-2 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              ${globalDetailImages.image3 ? 
                `<img src="${globalDetailImages.image3}" class="max-h-full max-w-full object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <span class="text-gray-400 text-xs hidden"><i class="fas fa-image"></i></span>` : 
                `<span class="text-gray-400 text-xs"><i class="fas fa-image mr-1"></i>미리보기</span>`}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공통 이미지 4</label>
            <input type="text" id="global-detail-image-4" value="${globalDetailImages.image4 || ''}" 
                   placeholder="이미지 URL 입력"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm">
            <div class="mt-2 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              ${globalDetailImages.image4 ? 
                `<img src="${globalDetailImages.image4}" class="max-h-full max-w-full object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <span class="text-gray-400 text-xs hidden"><i class="fas fa-image"></i></span>` : 
                `<span class="text-gray-400 text-xs"><i class="fas fa-image mr-1"></i>미리보기</span>`}
            </div>
          </div>
        </div>
      </div>

      <!-- 제품 관리 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-box mr-2"></i>제품 관리 (${products.length}개)
          </h2>
          <div class="flex gap-2">
            <button onclick="openProductOrderModal()" class="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm">
              <i class="fas fa-sort mr-1"></i>순서 관리
            </button>
            <button onclick="toggleAllCategories(true)" class="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm">
              <i class="fas fa-expand-alt mr-1"></i>전체 펼치기
            </button>
            <button onclick="toggleAllCategories(false)" class="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm">
              <i class="fas fa-compress-alt mr-1"></i>전체 접기
            </button>
            <button onclick="openProductModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>제품 추가
            </button>
          </div>
        </div>

      <!-- 카테고리별 드롭다운 (홈페이지 메뉴 순서와 동일) -->
      <div class="space-y-4" id="category-accordion">
        ${siteCategories.map((cat, idx) => {
          const catData = productsByCategory[cat.name];
          const productCount = catData.all.length;
          const safeCatName = cat.name.replace(/[^a-zA-Z0-9가-힣]/g, '');
          const hasSubCategories = cat.subCategories.length > 0;
          
          // 세부 카테고리 목록 (제품이 있는 것만)
          const activeSubCategories = hasSubCategories 
            ? [...cat.subCategories, ...(catData.bySubCategory['미분류']?.length > 0 ? ['미분류'] : [])]
                .filter(sub => (catData.bySubCategory[sub] || []).length > 0)
            : [];
          
          return `
          <div class="border rounded-lg overflow-hidden">
            <!-- 메인 카테고리 헤더 -->
            <button onclick="toggleCategory('${safeCatName}')" 
                    class="w-full flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition border-b">
              <div class="flex items-center">
                <i class="fas fa-chevron-down mr-3 text-blue-500 transition-transform category-icon-${safeCatName}"></i>
                <i class="fas ${cat.icon} mr-2 text-blue-600"></i>
                <span class="font-bold text-blue-800">${cat.name}</span>
                <span class="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">${productCount}개</span>
              </div>
              <div class="text-sm text-blue-600">
                ${productCount > 0 ? `클릭하여 ${productCount}개 제품 보기` : '등록된 제품 없음'}
              </div>
            </button>
            
            <!-- 메인 카테고리 내용 -->
            <div id="category-content-${safeCatName}" class="hidden">
              ${productCount > 0 ? `
                ${hasSubCategories && activeSubCategories.length > 0 ? `
                  <!-- 세부 카테고리별 드롭다운 -->
                  <div class="bg-gray-50">
                    ${activeSubCategories.map(subCat => {
                      const subProducts = catData.bySubCategory[subCat] || [];
                      const safeSubCatName = (safeCatName + subCat).replace(/[^a-zA-Z0-9가-힣]/g, '');
                      return `
                      <div class="border-b last:border-b-0">
                        <!-- 세부 카테고리 헤더 -->
                        <button onclick="toggleSubCategory('${safeSubCatName}')" 
                                class="w-full flex justify-between items-center px-6 py-2 bg-gray-100 hover:bg-gray-200 transition">
                          <div class="flex items-center">
                            <i class="fas fa-chevron-right mr-2 text-gray-400 text-sm transition-transform subcategory-icon-${safeSubCatName}"></i>
                            <span class="font-medium text-gray-700">${subCat}</span>
                            <span class="ml-2 px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">${subProducts.length}개</span>
                          </div>
                        </button>
                        
                        <!-- 세부 카테고리 제품 목록 -->
                        <div id="subcategory-content-${safeSubCatName}" class="hidden">
                          <div class="overflow-x-auto">
                            <table class="w-full">
                              <thead class="bg-gray-50 border-b">
                                <tr>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">모델명</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">월렌탈료</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">제휴카드</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">태그</th>
                                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y bg-white">
                                ${renderProductRows(subProducts)}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      `;
                    }).join('')}
                  </div>
                ` : `
                  <!-- 세부 카테고리 없는 경우 전체 목록 표시 -->
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-gray-50 border-b">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">모델명</th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">월렌탈료</th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제휴카드</th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">태그</th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y">
                        ${renderProductRows(catData.all)}
                      </tbody>
                    </table>
                  </div>
                `}
              ` : `
                <div class="p-8 text-center text-gray-500">
                  <i class="fas fa-inbox text-4xl mb-2"></i>
                  <p>등록된 제품이 없습니다.</p>
                  <button onclick="openProductModal()" class="mt-3 text-blue-600 hover:text-blue-800">
                    <i class="fas fa-plus mr-1"></i>제품 추가하기
                  </button>
                </div>
              `}
            </div>
          </div>
        `}).join('')}
      </div>
    </div>
  `;
}

// 제품 행 렌더링
function renderProductRows(productList) {
  return productList.map(p => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-500">${p.id}</td>
      <td class="px-4 py-3 text-sm font-medium">${p.name}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${p.modelName}</td>
      <td class="px-4 py-3 text-sm font-semibold">${formatPrice(p.price)}원</td>
      <td class="px-4 py-3 text-sm text-red-600 font-semibold">${p.cardPrice && p.cardPrice !== '0' ? formatPrice(p.cardPrice) + '원' : '-'}</td>
      <td class="px-4 py-3 text-sm">
        ${p.promotionTag ? `<span class="px-2 py-1 bg-red-500 text-white rounded text-xs">${p.promotionTag}</span>` : '-'}
      </td>
      <td class="px-4 py-3 text-sm space-x-2">
        <button onclick="editProduct(${p.id})" class="text-blue-600 hover:text-blue-800" title="편집">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteProduct(${p.id})" class="text-red-600 hover:text-red-800" title="삭제">
          <i class="fas fa-trash"></i>
        </button>
        <a href="/product/${p.id}" target="_blank" class="text-green-600 hover:text-green-800" title="사이트에서 보기">
          <i class="fas fa-external-link-alt"></i>
        </a>
      </td>
    </tr>
  `).join('');
}

// 메인 카테고리 토글
window.toggleCategory = function(safeCatName) {
  const content = document.getElementById(`category-content-${safeCatName}`);
  const icon = document.querySelector(`.category-icon-${safeCatName}`);
  
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  } else {
    content.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(-90deg)';
  }
};

// 세부 카테고리 토글
window.toggleSubCategory = function(safeSubCatName) {
  const content = document.getElementById(`subcategory-content-${safeSubCatName}`);
  const icon = document.querySelector(`.subcategory-icon-${safeSubCatName}`);
  
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(90deg)';
  } else {
    content.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

// 전체 제품 공통 상세 이미지 저장
window.saveGlobalDetailImages = async function() {
  const globalDetailImages = {
    image1: document.getElementById('global-detail-image-1').value.trim(),
    image2: document.getElementById('global-detail-image-2').value.trim(),
    image3: document.getElementById('global-detail-image-3').value.trim(),
    image4: document.getElementById('global-detail-image-4').value.trim()
  };
  
  try {
    await axios.put('/api/admin/settings', {
      ...siteSettings,
      globalProductDetailImages: globalDetailImages
    });
    
    siteSettings.globalProductDetailImages = globalDetailImages;
    alert('전체 제품 공통 상세 이미지가 저장되었습니다!');
    renderTabContent(); // 미리보기 업데이트
  } catch (error) {
    console.error('이미지 저장 실패:', error);
    alert('이미지 저장에 실패했습니다.');
  }
};

// 전체 카테고리 펼치기/접기
window.toggleAllCategories = function(expand) {
  // 메인 카테고리
  const siteCategories = ['정수기', '공기청정기', '비데연수기', '생활가전', '기타'];
  siteCategories.forEach(safeCat => {
    const content = document.getElementById(`category-content-${safeCat}`);
    const icon = document.querySelector(`.category-icon-${safeCat}`);
    
    if (content) {
      if (expand) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
      } else {
        content.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(-90deg)';
      }
    }
  });
  
  // 세부 카테고리도 함께 처리
  document.querySelectorAll('[id^="subcategory-content-"]').forEach(content => {
    const iconClass = content.id.replace('subcategory-content-', 'subcategory-icon-');
    const icon = document.querySelector(`.${iconClass}`);
    
    if (expand) {
      content.classList.remove('hidden');
      if (icon) icon.style.transform = 'rotate(90deg)';
    } else {
      content.classList.add('hidden');
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  });
};

// 렌탈 신청 탭
function renderApplicationsTab() {
  // 제품ID로 제품명을 찾는 헬퍼 함수
  function getProductName(productId) {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `제품 #${productId}`;
  }

  return `
    <div class="bg-white rounded-xl shadow-lg p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-clipboard-list mr-2"></i>렌탈 신청 내역 (${applications.length}건)
      </h2>
      
      ${applications.length === 0 ? `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-6xl mb-4"></i>
          <p class="text-lg">아직 렌탈 신청이 없습니다.</p>
        </div>
      ` : `
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">주소</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${applications.map(app => `
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm">${app.id}</td>
                  <td class="px-4 py-3 text-sm font-medium text-blue-600">${app.productName || getProductName(app.productId)}</td>
                  <td class="px-4 py-3 text-sm font-medium">${app.name}</td>
                  <td class="px-4 py-3 text-sm">${app.phone}</td>
                  <td class="px-4 py-3 text-sm">${app.address || '-'}</td>
                  <td class="px-4 py-3 text-sm">
                    <select onchange="updateApplicationStatus(${app.id}, this.value)" 
                            class="px-2 py-1 border rounded ${app.status === '대기중' ? 'bg-yellow-100' : app.status === '처리완료' ? 'bg-green-100' : 'bg-red-100'}">
                      <option value="대기중" ${app.status === '대기중' ? 'selected' : ''}>대기중</option>
                      <option value="처리완료" ${app.status === '처리완료' ? 'selected' : ''}>처리완료</option>
                      <option value="취소" ${app.status === '취소' ? 'selected' : ''}>취소</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-sm">${new Date(app.createdAt).toLocaleDateString()}</td>
                  <td class="px-4 py-3 text-sm space-x-2">
                    <button onclick="viewApplication(${app.id})" class="text-blue-600 hover:text-blue-800" title="상세보기">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteApplication(${app.id})" class="text-red-600 hover:text-red-800" title="삭제">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// 제품 모달 열기 (추가/편집)
window.openProductModal = function(productId = null) {
  document.getElementById('product-modal').classList.remove('hidden');
  
  if (productId) {
    // 편집 모드
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modal-title').textContent = '제품 편집';
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-category').value = product.category;
    updateSubCategoryOptions(); // 세부 카테고리 옵션 업데이트
    document.getElementById('edit-subCategory').value = product.subCategory || '';
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-modelName').value = product.modelName;
    document.getElementById('edit-description').value = product.description;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-cardPrice').value = product.cardPrice;
    // 대표 이미지 배열 처리
    const images = product.images || [product.image] || [];
    for (let i = 1; i <= 8; i++) {
      const input = document.getElementById(`edit-image-${i}`);
      if (input) {
        input.value = images[i-1] || '';
      }
    }
    document.getElementById('edit-size').value = product.size || '';
    document.getElementById('edit-specs').value = product.specs || '';
    document.getElementById('edit-filterType').value = product.filterType || '';
    // 확장 상세 스펙 필드 로드
    document.getElementById('edit-colorList').value = product.colorList || '';
    document.getElementById('edit-purificationMethod').value = product.purificationMethod || '';
    document.getElementById('edit-coolingMethod').value = product.coolingMethod || '';
    document.getElementById('edit-hotWaterTemp').value = product.hotWaterTemp || '';
    document.getElementById('edit-coldWaterTemp').value = product.coldWaterTemp || '';
    document.getElementById('edit-powerConsumption').value = product.powerConsumption || '';
    document.getElementById('edit-coverageArea').value = product.coverageArea || '';
    document.getElementById('edit-cleaningMethod').value = product.cleaningMethod || '';
    document.getElementById('edit-cadr').value = product.cadr || '';
    document.getElementById('edit-weight').value = product.weight || '';
    document.getElementById('edit-installationType').value = product.installationType || '';
    document.getElementById('edit-energyRating').value = product.energyRating || '';
    document.getElementById('edit-promotionTag').value = product.promotionTag || '';
    
    // 특징
    const features = product.features || [];
    document.getElementById('edit-feature-1').value = features[0] || '';
    document.getElementById('edit-feature-2').value = features[1] || '';
    document.getElementById('edit-feature-3').value = features[2] || '';
    
    // 물 타입
    ['정수', '냉수', '온수', '얼음'].forEach(type => {
      const checkbox = document.getElementById(`edit-water-${type}`);
      if (checkbox) {
        checkbox.checked = product.waterTypes && product.waterTypes.includes(type);
      }
    });
    
    // 상세 이미지
    const detailImages = product.detailImages || [];
    for (let i = 1; i <= 30; i++) {
      const input = document.getElementById(`edit-detailImage-${i}`);
      if (input) {
        input.value = detailImages[i-1] || '';
      }
    }

    // 옵션 데이터 로드
    const options = product.options || { colors: [], pricePolicies: [] };
    
    // 컨테이너 초기화
    document.getElementById('options-colors-container').innerHTML = '';
    document.getElementById('options-pricePolicies-container').innerHTML = '';

    // 매트리스 여부에 따라 UI 업데이트
    updateOptionUIForCategory();
    
    // 색상/사이즈
    if (options.colors && options.colors.length > 0) {
      options.colors.forEach(opt => addOptionRow('colors', opt));
    } else {
      // 매트리스면 기본 사이즈, 아니면 기본 색상
      if (product.subCategory === '매트리스') {
        addOptionRow('colors', { name: 'SS', code: '#FFFFFF' });
      } else {
        addOptionRow('colors', { name: '화이트', code: '#FFFFFF' });
      }
    }
    
    // 사이즈별 상세 설정 로드 (매트리스)
    if (product.subCategory === '매트리스' && options.sizeDetails) {
      // 데이터를 전역 변수에 저장하여 UI 업데이트 시 사용
      window.mattressSizeDetailsData = options.sizeDetails;
      setTimeout(() => {
        updateSizeDetailsUI();
      }, 100);
    } else {
      window.mattressSizeDetailsData = {};
    }

    // 조합형 가격 정책 (새로운 구조)
    if (options.pricePolicies && options.pricePolicies.length > 0) {
      options.pricePolicies.forEach(opt => addOptionRow('pricePolicies', opt));
    } else {
      // 기본 6개 조합 예시 (셀프/방문 x 6년/5년/3년)
      const basePrice = parseInt(product.price.replace(/[^0-9]/g, '')) || 0;
      addOptionRow('pricePolicies', { managementType: '셀프', period: '6년', price: basePrice });
      addOptionRow('pricePolicies', { managementType: '셀프', period: '5년', price: basePrice + 2000 });
      addOptionRow('pricePolicies', { managementType: '셀프', period: '3년', price: basePrice + 8000 });
      addOptionRow('pricePolicies', { managementType: '방문', period: '6년', price: basePrice + 2000 });
      addOptionRow('pricePolicies', { managementType: '방문', period: '5년', price: basePrice + 4000 });
      addOptionRow('pricePolicies', { managementType: '방문', period: '3년', price: basePrice + 11000 });
    }

  } else {
    // 추가 모드
    document.getElementById('modal-title').textContent = '제품 추가';
    document.getElementById('product-form').reset();
    document.getElementById('edit-product-id').value = '';
    
    // 컨테이너 초기화
    document.getElementById('options-colors-container').innerHTML = '';
    document.getElementById('options-pricePolicies-container').innerHTML = '';
    
    addOptionRow('colors', { name: '화이트', code: '#FFFFFF' });
    // 기본 6개 조합 (셀프/방문 x 6년/5년/3년)
    addOptionRow('pricePolicies', { managementType: '셀프', period: '6년', price: 0 });
    addOptionRow('pricePolicies', { managementType: '셀프', period: '5년', price: 0 });
    addOptionRow('pricePolicies', { managementType: '셀프', period: '3년', price: 0 });
    addOptionRow('pricePolicies', { managementType: '방문', period: '6년', price: 0 });
    addOptionRow('pricePolicies', { managementType: '방문', period: '5년', price: 0 });
    addOptionRow('pricePolicies', { managementType: '방문', period: '3년', price: 0 });
  }
};

// 숫자 포맷팅 (콤마 추가)
window.inputNumberFormat = function(obj) {
  obj.value = comma(uncomma(obj.value));
}

function comma(str) {
  str = String(str);
  return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}

function uncomma(str) {
  str = String(str);
  return str.replace(/[^\d]+/g, '');
}

// 매트리스 사이즈 옵션인지 확인
function isMattressProduct() {
  const category = document.getElementById('edit-category')?.value;
  const subCategory = document.getElementById('edit-subCategory')?.value;
  return category === '생활가전' && subCategory === '매트리스';
}

// 카테고리 변경 시 색상/사이즈 옵션 UI 전환
window.updateOptionUIForCategory = function() {
  const isMattress = isMattressProduct();
  const label = document.getElementById('color-option-label');
  const addText = document.getElementById('color-option-add-text');
  const sizeDetailsSection = document.getElementById('size-details-section');
  
  if (isMattress) {
    if (label) label.innerHTML = '📐 사이즈 옵션';
    if (addText) addText.textContent = '사이즈 추가';
    if (sizeDetailsSection) sizeDetailsSection.classList.remove('hidden');
  } else {
    if (label) label.innerHTML = '🎨 색상 옵션';
    if (addText) addText.textContent = '색상 추가';
    if (sizeDetailsSection) sizeDetailsSection.classList.add('hidden');
  }
  
  // 기존 옵션 행들의 placeholder 업데이트
  document.querySelectorAll('.option-row-colors .opt-name').forEach(input => {
    input.placeholder = isMattress ? '사이즈 (예: SS, S, Q, K, LK)' : '색상명 (예: 화이트)';
  });
  
  // 색상 선택기 숨김/표시 (매트리스는 색상 불필요)
  document.querySelectorAll('.option-row-colors .opt-value').forEach(colorInput => {
    colorInput.style.display = isMattress ? 'none' : 'block';
  });
  
  // 사이즈별 상세 설정 업데이트
  updateSizeDetailsUI();
}

// 사이즈별 상세 설정 UI 업데이트
function updateSizeDetailsUI() {
  const container = document.getElementById('size-details-container');
  if (!container || !isMattressProduct()) return;
  
  // 현재 사이즈 목록 가져오기
  const sizes = Array.from(document.querySelectorAll('.option-row-colors .opt-name')).map(input => input.value).filter(v => v);
  
  // 기존 사이즈 상세 데이터 보존
  const existingData = window.mattressSizeDetailsData || {};
  
  // 현재 입력된 값들도 보존
  container.querySelectorAll('.size-detail-item').forEach(item => {
    const sizeName = item.dataset.sizeName;
    if (sizeName) {
      // 요금 정책 데이터 수집
      const pricePolicies = [];
      item.querySelectorAll('.size-price-row').forEach(row => {
        pricePolicies.push({
          managementType: row.querySelector('.size-mgmt-type')?.value || '셀프',
          period: row.querySelector('.size-period')?.value || '6년',
          price: parseInt((row.querySelector('.size-row-price')?.value || '0').replace(/,/g, '')) || 0,
          cardPrice: parseInt((row.querySelector('.size-row-card-price')?.value || '0').replace(/,/g, '')) || 0
        });
      });
      
      existingData[sizeName] = {
        specs: item.querySelector('.size-specs')?.value || '',
        description: item.querySelector('.size-description')?.value || '',
        pricePolicies: pricePolicies.length > 0 ? pricePolicies : (existingData[sizeName]?.pricePolicies || [])
      };
    }
  });
  
  window.mattressSizeDetailsData = existingData;
  
  // 사이즈별 상세 설정 폼 생성
  if (sizes.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400">위에서 사이즈를 먼저 추가해주세요.</p>';
    return;
  }
  
  container.innerHTML = sizes.map(size => {
    const data = existingData[size] || {};
    const policies = data.pricePolicies || [{ managementType: '셀프', period: '6년', price: 0, cardPrice: 0 }];
    
    return `
      <div class="size-detail-item bg-white p-4 rounded-lg border mb-4" data-size-name="${size}">
        <div class="font-semibold text-blue-600 mb-3 text-lg">📏 ${size} 사이즈</div>
        
        <!-- 스펙 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">스펙/규격</label>
            <input type="text" class="size-specs w-full px-3 py-2 border rounded text-sm" placeholder="예: 900x2000mm" value="${data.specs || ''}">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">설명</label>
            <input type="text" class="size-description w-full px-3 py-2 border rounded text-sm" placeholder="예: 슈퍼싱글" value="${data.description || ''}">
          </div>
        </div>
        
        <!-- 요금표 -->
        <div class="bg-gray-50 p-3 rounded">
          <div class="flex justify-between items-center mb-2">
            <label class="text-xs font-semibold text-gray-600">💰 ${size} 사이즈 요금표</label>
            <button type="button" onclick="addSizePriceRow('${size}')" class="text-xs text-blue-600 hover:text-blue-800">
              <i class="fas fa-plus"></i> 요금 추가
            </button>
          </div>
          <div class="text-xs text-gray-400 mb-2">관리유형, 의무기간, 월렌탈료, 제휴카드 할인가를 입력하세요</div>
          <div class="size-price-policies space-y-2">
            ${policies.map((p, idx) => renderSizePriceRow(size, p, idx)).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 사이즈별 요금 행 렌더링
function renderSizePriceRow(sizeName, policy, idx) {
  return `
    <div class="size-price-row flex items-center gap-2 bg-white p-2 rounded border">
      <select class="size-mgmt-type flex-1 px-2 py-1 border rounded text-xs">
        <option value="셀프" ${policy.managementType === '셀프' ? 'selected' : ''}>셀프</option>
        <option value="셀프(12개월)" ${policy.managementType === '셀프(12개월)' ? 'selected' : ''}>셀프(12개월)</option>
        <option value="방문(2개월)" ${policy.managementType === '방문(2개월)' ? 'selected' : ''}>방문(2개월)</option>
        <option value="방문(3개월)" ${policy.managementType === '방문(3개월)' ? 'selected' : ''}>방문(3개월)</option>
        <option value="방문(4개월)" ${policy.managementType === '방문(4개월)' ? 'selected' : ''}>방문(4개월)</option>
        <option value="방문(6개월)" ${policy.managementType === '방문(6개월)' ? 'selected' : ''}>방문(6개월)</option>
      </select>
      <select class="size-period w-16 px-2 py-1 border rounded text-xs">
        <option value="6년" ${policy.period === '6년' ? 'selected' : ''}>6년</option>
        <option value="5년" ${policy.period === '5년' ? 'selected' : ''}>5년</option>
        <option value="4년" ${policy.period === '4년' ? 'selected' : ''}>4년</option>
        <option value="3년" ${policy.period === '3년' ? 'selected' : ''}>3년</option>
      </select>
      <input type="text" class="size-row-price w-24 px-2 py-1 border rounded text-xs text-right" placeholder="월렌탈료" value="${policy.price ? policy.price.toLocaleString() : ''}" onkeyup="inputNumberFormat(this)">
      <input type="text" class="size-row-card-price w-24 px-2 py-1 border rounded text-xs text-right" placeholder="카드할인가" value="${policy.cardPrice ? policy.cardPrice.toLocaleString() : ''}" onkeyup="inputNumberFormat(this)">
      <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-1">
        <i class="fas fa-trash text-xs"></i>
      </button>
    </div>
  `;
}

// 사이즈별 요금 행 추가
window.addSizePriceRow = function(sizeName) {
  const container = document.querySelector(`.size-detail-item[data-size-name="${sizeName}"] .size-price-policies`);
  if (!container) return;
  
  const newRow = document.createElement('div');
  newRow.innerHTML = renderSizePriceRow(sizeName, { managementType: '셀프', period: '6년', price: 0, cardPrice: 0 }, 0);
  container.appendChild(newRow.firstElementChild);
}

// 옵션 행 추가 함수
window.addOptionRow = function(type, data = null) {
  const container = document.getElementById(`options-${type}-container`);
  const div = document.createElement('div');
  div.className = `flex items-center gap-2 option-row-${type}`;
  
  const isMattress = isMattressProduct();
  
  if (type === 'colors') {
    const placeholder = isMattress ? '사이즈 (예: SS, S, Q, K, LK)' : '색상명 (예: 화이트)';
    const colorDisplay = isMattress ? 'none' : 'block';
    div.innerHTML = `
      <input type="text" class="opt-name flex-1 px-3 py-2 border rounded" placeholder="${placeholder}" value="${data?.name || ''}" onchange="updateSizeDetailsUI()">
      <input type="color" class="opt-value h-10 w-10 border rounded cursor-pointer" style="display: ${colorDisplay}" value="${data?.code || '#FFFFFF'}">
      <select class="opt-image-index w-32 px-2 py-2 border rounded text-sm text-gray-600">
        <option value="">이미지 연동 안함</option>
        ${Array.from({length: 8}, (_, i) => `<option value="${i}" ${data?.imageIndex === i ? 'selected' : ''}>대표 이미지 ${i+1}</option>`).join('')}
      </select>
      <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2">
        <i class="fas fa-trash"></i>
      </button>
    `;
  } else if (type === 'pricePolicies') {
    // 조합형 가격 정책: 관리유형 + 의무기간 + 월렌탈료 + 제휴카드 할인
    const displayPrice = data?.price !== undefined ? data.price.toLocaleString() : '0';
    const displayCardPrice = data?.cardPrice !== undefined ? data.cardPrice.toLocaleString() : '';
    
    div.innerHTML = `
      <select class="opt-management-type flex-1 px-3 py-2 border rounded text-sm">
        <option value="셀프(12개월)" ${data?.managementType === '셀프(12개월)' ? 'selected' : ''}>셀프(12개월)</option>
        <option value="방문(2개월)" ${data?.managementType === '방문(2개월)' ? 'selected' : ''}>방문(2개월)</option>
        <option value="방문(3개월)" ${data?.managementType === '방문(3개월)' ? 'selected' : ''}>방문(3개월)</option>
        <option value="방문(4개월)" ${data?.managementType === '방문(4개월)' ? 'selected' : ''}>방문(4개월)</option>
        <option value="방문(6개월)" ${data?.managementType === '방문(6개월)' ? 'selected' : ''}>방문(6개월)</option>
        <option value="방문(8개월)" ${data?.managementType === '방문(8개월)' ? 'selected' : ''}>방문(8개월)</option>
      </select>
      <select class="opt-period flex-1 px-3 py-2 border rounded text-sm">
        <option value="6년" ${data?.period === '6년' ? 'selected' : ''}>6년</option>
        <option value="5년" ${data?.period === '5년' ? 'selected' : ''}>5년</option>
        <option value="4년" ${data?.period === '4년' ? 'selected' : ''}>4년</option>
        <option value="3년" ${data?.period === '3년' ? 'selected' : ''}>3년</option>
      </select>
      <div class="flex items-center w-28">
        <input type="text" class="opt-price w-full px-2 py-2 border rounded text-right text-sm" placeholder="월렌탈료" value="${displayPrice}" onkeyup="inputNumberFormat(this)">
      </div>
      <div class="flex items-center w-28">
        <input type="text" class="opt-card-price w-full px-2 py-2 border rounded text-right text-sm" placeholder="할인가" value="${displayCardPrice}" onkeyup="inputNumberFormat(this)">
      </div>
      <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 w-8 text-center">
        <i class="fas fa-trash"></i>
      </button>
    `;
  } else {
    // 기타 옵션 (호환성 유지)
    const placeholderName = type === 'periods' ? '기간명 (예: 3년 약정)' : '유형명 (예: 방문관리)';
    const pricePlaceholder = type === 'periods' ? '추가금액' : '기본금액';
    const displayPrice = data?.price !== undefined ? data.price.toLocaleString() : '0';
    
    div.innerHTML = `
      <input type="text" class="opt-name flex-1 px-3 py-2 border rounded" placeholder="${placeholderName}" value="${data?.name || ''}">
      <div class="flex items-center w-32">
        <input type="text" class="opt-price w-full px-3 py-2 border rounded text-right" placeholder="${pricePlaceholder}" value="${displayPrice}" onkeyup="inputNumberFormat(this)">
        <span class="text-sm text-gray-500 ml-1">원</span>
      </div>
      <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 w-8 text-center">
        <i class="fas fa-trash"></i>
      </button>
    `;
  }
  
  container.appendChild(div);
};

// 제품 모달 닫기
window.closeProductModal = function() {
  document.getElementById('product-modal').classList.add('hidden');
  document.getElementById('product-form').reset();
};

// 제품 편집
window.editProduct = function(productId) {
  openProductModal(productId);
};

// 제품 삭제
window.deleteProduct = async function(productId) {
  if (!confirm('정말 이 제품을 삭제하시겠습니까?')) return;
  
  try {
    await axios.delete(`/api/admin/products/${productId}`);
    alert('제품이 삭제되었습니다.');
    await loadData();
    renderTabContent();
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// 신청 상태 업데이트
window.updateApplicationStatus = async function(appId, newStatus) {
  try {
    await axios.patch(`/api/admin/applications/${appId}`, { status: newStatus });
    alert('상태가 업데이트되었습니다.');
    await loadData();
  } catch (error) {
    alert('업데이트 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// 신청 상세 보기
window.viewApplication = function(appId) {
  const app = applications.find(a => a.id === appId);
  if (!app) return;
  
  // 제품명 찾기
  const product = products.find(p => p.id === app.productId);
  const productName = app.productName || (product ? product.name : '제품명 없음');
  
  let optionsText = '';
  if (app.selectedOptions) {
    optionsText = `\n[선택 옵션]\n` +
      `- 색상: ${app.selectedOptions.color?.name || '-'}\n` +
      `- 관리유형: ${app.selectedOptions.managementType?.name || '-'} (${app.selectedOptions.managementType?.price > 0 ? '+' : ''}${app.selectedOptions.managementType?.price || 0}원)\n` +
      `- 약정기간: ${app.selectedOptions.contractPeriod?.name || '-'} (${app.selectedOptions.contractPeriod?.price > 0 ? '+' : ''}${app.selectedOptions.contractPeriod?.price || 0}원)\n` +
      `- 최종 월 렌탈료: ${app.selectedOptions.finalPrice || '-'}원\n`;
  }

  alert(`신청 상세 정보\n\n` +
    `ID: ${app.id}\n` +
    `제품명: ${productName}\n` +
    `제품ID: ${app.productId}\n` +
    `고객명: ${app.name}\n` +
    `연락처: ${app.phone}\n` +
    `문의사항: ${app.message || '없음'}\n` +
    `상태: ${app.status}\n` +
    `신청일: ${new Date(app.createdAt).toLocaleString()}\n` +
    optionsText
  );
};

// 신청 삭제
window.deleteApplication = async function(appId) {
  const app = applications.find(a => a.id === appId);
  if (!app) return;
  
  // 제품명 찾기
  const product = products.find(p => p.id === app.productId);
  const productName = app.productName || (product ? product.name : '제품');
  
  if (!confirm(`정말 이 렌탈 신청을 삭제하시겠습니까?\n\n고객명: ${app.name}\n제품: ${productName}\n연락처: ${app.phone}`)) {
    return;
  }
  
  try {
    await axios.delete(`/api/admin/applications/${appId}`);
    alert('렌탈 신청이 삭제되었습니다.');
    await loadData();
    renderTabContent();
  } catch (error) {
    alert('삭제 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// 배너 슬라이드 추가
window.addBannerSlide = function() {
  if (!siteSettings.mainBannerImages) {
    siteSettings.mainBannerImages = [];
  }
  siteSettings.mainBannerImages.push({
    url: 'https://via.placeholder.com/1920x600?text=New+Banner',
    title: '새 배너',
    subtitle: '배너 부제목'
  });
  renderTabContent();
};

// 배너 슬라이드 제거
window.removeBannerSlide = function(index) {
  if (confirm('이 배너를 삭제하시겠습니까?')) {
    siteSettings.mainBannerImages.splice(index, 1);
    renderTabContent();
  }
};

// 배너 슬라이드 업데이트
window.updateBannerSlide = function(index, field, value) {
  if (!siteSettings.mainBannerImages[index]) {
    siteSettings.mainBannerImages[index] = {};
  }
  if (typeof siteSettings.mainBannerImages[index] === 'string') {
    const oldUrl = siteSettings.mainBannerImages[index];
    siteSettings.mainBannerImages[index] = { url: oldUrl, title: '', subtitle: '' };
  }
  siteSettings.mainBannerImages[index][field] = value;
};

// 배너 슬라이드 저장
window.saveBannerSlides = async function() {
  try {
    await axios.put('/api/admin/settings', siteSettings);
    alert('메인 배너가 저장되었습니다!');
    await loadData();
  } catch (error) {
    alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// (좌측 퀵메뉴는 제거되었습니다 - 우측 퀵패널로 통합됨)

// 설정 내보내기 (JSON 다운로드)
window.exportSettings = function() {
  try {
    // 전체 데이터 백업 (사이트 설정 + 제품 + 렌탈 신청 + 리뷰)
    // siteSettings에 포함된 모든 항목:
    // - mainBannerImages: 메인 배너 (이미지, 링크 URL 포함)
    // - eventBannerImages: 이벤트 배너 (하단 배너)
    // - partnershipBannerImage: 파트너십 배너
    // - quickPanelSettings: 우측 퀵패널 (담당자 설정)
    // - quickPanelLogo: 퀵패널 로고
    // - topBannerImage/Title: 상단 띠 배너
    // - logoImage: 로고 이미지
    // - siteName, siteDescription: 사이트 기본 정보
    // - phoneNumber, kakaoId: 연락처
    // - companyName, ceoName, businessNumber 등: 회사 정보
    // - popupSettings: 팝업 설정
    // - privacyPolicy: 개인정보처리방침
    // - customerReviews: 고객 리뷰 (siteSettings 내부)
    // - bestProductIds: 베스트 제품 ID 목록
    // - certificationBadges: 인증 배지
    // - qrCode: QR 코드 설정
    // - bottomMenuSettings: 하단 메뉴 설정
    // - rentalGuide: 렌탈 가이드
    // - cardPage, giftPage, partnerPage: 특수 페이지 설정
    
    const fullBackup = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      siteSettings: siteSettings,
      products: products,
      applications: applications,
      reviews: reviews
    };
    
    // 백업 데이터 검증
    const settingsKeys = Object.keys(siteSettings || {});
    const hasBannerLinks = siteSettings.mainBannerImages && siteSettings.mainBannerImages.some(b => b.link);
    const hasQuickPanel = siteSettings.quickPanelSettings && siteSettings.quickPanelSettings.managerName;
    const hasEventBanner = siteSettings.eventBannerImages && siteSettings.eventBannerImages.length > 0;
    
    const dataStr = JSON.stringify(fullBackup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `webapp-full-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 상세 백업 내용 표시
    let backupDetails = '✅ 전체 데이터가 백업되었습니다!\n\n';
    backupDetails += '📦 백업 내용:\n';
    backupDetails += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
    backupDetails += '📋 사이트 설정 (' + settingsKeys.length + '개 항목)\n';
    backupDetails += '   • 메인 배너: ' + (siteSettings.mainBannerImages?.length || 0) + '개';
    backupDetails += (hasBannerLinks ? ' (링크 포함 ✓)' : '') + '\n';
    backupDetails += '   • 이벤트 배너: ' + (siteSettings.eventBannerImages?.length || 0) + '개';
    backupDetails += (hasEventBanner ? ' ✓' : '') + '\n';
    backupDetails += '   • 퀵패널 담당자: ' + (hasQuickPanel ? '설정됨 ✓' : '미설정') + '\n';
    backupDetails += '   • 팝업 설정: ' + (siteSettings.popupSettings ? '있음 ✓' : '없음') + '\n';
    backupDetails += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
    backupDetails += '🛒 제품: ' + products.length + '개\n';
    backupDetails += '📝 렌탈 신청: ' + applications.length + '건\n';
    backupDetails += '⭐ 고객 리뷰: ' + reviews.length + '개\n';
    backupDetails += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
    backupDetails += '\n📁 파일: webapp-full-backup-' + timestamp + '.json';
    
    alert(backupDetails);
  } catch (error) {
    alert('❌ 백업 실패: ' + error.message);
  }
};

// 전체 데이터 가져오기 (JSON 업로드)
window.importSettings = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // 백업 파일 미리 읽기
  const text = await file.text();
  let backup;
  try {
    backup = JSON.parse(text);
  } catch (e) {
    alert('❌ 잘못된 JSON 파일입니다.');
    event.target.value = '';
    return;
  }
  
  // 백업 내용 미리보기
  let previewMsg = '⚠️ 현재 데이터가 모두 덮어씌워집니다.\n\n';
  previewMsg += '📦 복구될 백업 파일 정보:\n';
  previewMsg += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  previewMsg += '📅 백업 날짜: ' + (backup.exportDate ? new Date(backup.exportDate).toLocaleString() : '알 수 없음') + '\n';
  previewMsg += '📋 버전: ' + (backup.version || '1.0 (구버전)') + '\n';
  previewMsg += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  if (backup.siteSettings) {
    previewMsg += '✓ 사이트 설정\n';
    previewMsg += '   • 메인 배너: ' + (backup.siteSettings.mainBannerImages?.length || 0) + '개\n';
    previewMsg += '   • 이벤트 배너: ' + (backup.siteSettings.eventBannerImages?.length || 0) + '개\n';
    previewMsg += '   • 퀵패널 담당자: ' + (backup.siteSettings.quickPanelSettings?.managerName || '미설정') + '\n';
  }
  previewMsg += '✓ 제품: ' + (backup.products?.length || 0) + '개\n';
  previewMsg += '✓ 렌탈 신청: ' + (backup.applications?.length || 0) + '건\n';
  previewMsg += '✓ 고객 리뷰: ' + (backup.reviews?.length || 0) + '개\n';
  previewMsg += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  previewMsg += '\n계속하시겠습니까?';
  
  if (!confirm(previewMsg)) {
    event.target.value = '';
    return;
  }
  
  try {
    // 전체 백업 형식인지 확인
    if (backup.version && backup.siteSettings && backup.products) {
      // 새로운 전체 백업 형식 - 일괄 복구 API 사용
      const response = await axios.post('/api/admin/restore', {
        siteSettings: backup.siteSettings,
        products: backup.products,
        applications: backup.applications || [],
        reviews: backup.reviews || []
      });
      
      if (response.data.success) {
        const restored = response.data.restored;
        let successMsg = '✅ 전체 데이터가 복구되었습니다!\n\n';
        successMsg += '📦 복구 완료:\n';
        successMsg += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
        successMsg += '✓ 사이트 설정 (배너 링크, 퀵패널 등 포함)\n';
        successMsg += '✓ 제품: ' + restored.products + '개\n';
        successMsg += '✓ 렌탈 신청: ' + restored.applications + '건\n';
        successMsg += '✓ 고객 리뷰: ' + (restored.reviews || 0) + '개\n';
        successMsg += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
        successMsg += '\n페이지를 새로고침합니다.';
        alert(successMsg);
      } else {
        throw new Error(response.data.error || '복구 실패');
      }
    } else {
      // 이전 형식 (설정만)
      await axios.put('/api/admin/settings', backup);
      alert('✅ 사이트 설정이 복구되었습니다.\n(제품 데이터는 포함되지 않은 이전 백업 파일입니다)');
    }
    
    await loadData();
    renderTabContent();
    window.location.reload();
  } catch (error) {
    alert('❌ 복구 실패: ' + (error.response?.data?.error || error.message));
    console.error('Import error:', error);
  }
  
  // 파일 입력 초기화
  event.target.value = '';
};

// 로그아웃
window.logout = function() {
  if (confirm('로그아웃하시겠습니까?')) {
    localStorage.removeItem('admin-token');
    window.location.href = '/admin/login';
  }
};

// 베스트 상품 선택 제한 (최대 4개)
window.handleBestProductChange = function(checkbox) {
  const checkedBoxes = document.querySelectorAll('input[name="bestProducts"]:checked');
  if (checkedBoxes.length > 4) {
    checkbox.checked = false;
    alert('베스트 상품은 최대 4개까지 선택 가능합니다.');
  }
};

// 이벤트 배너 추가
window.addEventBanner = function() {
  if (!siteSettings.eventBannerImages) {
    siteSettings.eventBannerImages = [];
  }
  siteSettings.eventBannerImages.push({
    url: 'https://via.placeholder.com/1920x400/FFB6C1/FFFFFF?text=New+Event+Banner',
    link: ''
  });
  renderTabContent();
};

// 이벤트 배너 삭제
window.removeEventBanner = function(index) {
  if (confirm('이 이벤트 배너를 삭제하시겠습니까?')) {
    siteSettings.eventBannerImages.splice(index, 1);
    renderTabContent();
  }
};

// 이벤트 배너 업데이트
window.updateEventBanner = function(index, field, value) {
  if (!siteSettings.eventBannerImages) {
    siteSettings.eventBannerImages = [];
  }
  // 하위 호환성: 문자열이면 객체로 변환
  if (typeof siteSettings.eventBannerImages[index] === 'string') {
    const oldUrl = siteSettings.eventBannerImages[index];
    siteSettings.eventBannerImages[index] = { url: oldUrl, link: '' };
  }
  if (!siteSettings.eventBannerImages[index]) {
    siteSettings.eventBannerImages[index] = { url: '', link: '' };
  }
  siteSettings.eventBannerImages[index][field] = value;
};

// 이벤트 배너 저장
window.saveEventBanners = async function() {
  try {
    await axios.put('/api/admin/settings', siteSettings);
    alert('이벤트 배너가 저장되었습니다!');
    await loadData();
    renderTabContent();
  } catch (error) {
    alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// 인증 마크 추가
window.addCertificationBadge = function() {
  if (!siteSettings.certificationBadges) {
    siteSettings.certificationBadges = [];
  }
  siteSettings.certificationBadges.push({
    title: '새 인증 마크',
    subtitle: '설명',
    imageUrl: '',
    link: ''
  });
  renderTabContent();
};

// 인증 마크 삭제
window.removeCertificationBadge = function(index) {
  if (confirm('이 인증 마크를 삭제하시겠습니까?')) {
    siteSettings.certificationBadges.splice(index, 1);
    renderTabContent();
  }
};

// 인증 마크 업데이트
window.updateCertificationBadge = function(index, field, value) {
  if (!siteSettings.certificationBadges) {
    siteSettings.certificationBadges = [];
  }
  if (!siteSettings.certificationBadges[index]) {
    siteSettings.certificationBadges[index] = { title: '', subtitle: '', imageUrl: '', link: '' };
  }
  siteSettings.certificationBadges[index][field] = value;
};

// Footer QR코드 & 인증마크 저장
window.saveFooterExtras = async function() {
  try {
    // QR 코드 정보 수집
    siteSettings.qrCode = {
      title: document.getElementById('qr-title').value,
      subtitle: document.getElementById('qr-subtitle').value,
      imageUrl: document.getElementById('qr-image').value,
      description: document.getElementById('qr-description').value
    };
    
    await axios.put('/api/admin/settings', siteSettings);
    alert('Footer QR코드 & 인증마크가 저장되었습니다!');
    await loadData();
    renderTabContent();
  } catch (error) {
    alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// 페이지 이미지 추가
window.addPageImage = function(pageType) {
  const pageKey = pageType === 'partner' ? 'partnerPage' : pageType === 'card' ? 'cardPage' : 'giftPage';
  
  if (!siteSettings[pageKey]) {
    siteSettings[pageKey] = { title: '', subtitle: '', images: [] };
  }
  if (!siteSettings[pageKey].images) {
    siteSettings[pageKey].images = [];
  }
  
  siteSettings[pageKey].images.push('');
  renderTabContent();
};

// 페이지 이미지 삭제
window.removePageImage = function(pageType, index) {
  if (confirm('이 이미지를 삭제하시겠습니까?')) {
    const pageKey = pageType === 'partner' ? 'partnerPage' : pageType === 'card' ? 'cardPage' : 'giftPage';
    
    if (siteSettings[pageKey] && siteSettings[pageKey].images) {
      siteSettings[pageKey].images.splice(index, 1);
      renderTabContent();
    }
  }
};

// 페이지 이미지 업데이트
window.updatePageImage = function(pageType, index, value) {
  const pageKey = pageType === 'partner' ? 'partnerPage' : pageType === 'card' ? 'cardPage' : 'giftPage';
  
  if (!siteSettings[pageKey]) {
    siteSettings[pageKey] = { title: '', subtitle: '', images: [] };
  }
  if (!siteSettings[pageKey].images) {
    siteSettings[pageKey].images = [];
  }
  
  siteSettings[pageKey].images[index] = value;
};

// 페이지 관리 저장
window.savePageManagement = async function() {
  try {
    // 파트너 페이지
    siteSettings.partnerPage = {
      title: document.getElementById('partner-title').value,
      subtitle: document.getElementById('partner-subtitle').value,
      images: siteSettings.partnerPage ? (siteSettings.partnerPage.images || []) : []
    };
    
    // 제휴카드 페이지
    siteSettings.cardPage = {
      title: document.getElementById('card-title').value,
      subtitle: document.getElementById('card-subtitle').value,
      images: siteSettings.cardPage ? (siteSettings.cardPage.images || []) : []
    };
    
    // 사은품 페이지
    siteSettings.giftPage = {
      title: document.getElementById('gift-title').value,
      subtitle: document.getElementById('gift-subtitle').value,
      images: siteSettings.giftPage ? (siteSettings.giftPage.images || []) : []
    };
    
    await axios.put('/api/admin/settings', siteSettings);
    alert('페이지 정보가 저장되었습니다!');
    await loadData();
    renderTabContent();
  } catch (error) {
    alert('저장 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
  }
};

// 세부 카테고리 옵션 업데이트
window.updateSubCategoryOptions = function() {
  const category = document.getElementById('edit-category').value;
  const subCategorySelect = document.getElementById('edit-subCategory');
  
  // 카테고리별 세부 카테고리 정의
  const subCategories = {
    '정수기': ['얼음정수기', '냉온정수기', '냉정수기', '일반정수기', '업소용정수기'],
    '공기청정기': ['10평형', '20평형', '30평형', '40평형', '제습공기청정기'],
    '비데': ['비데', '연수기'],
    '생활가전': ['제빙기', '매트리스', '안마의자', '패키지']
  };
  
  // 옵션 초기화
  subCategorySelect.innerHTML = '<option value="">선택 안함</option>';
  
  // 해당 카테고리의 세부 카테고리 추가
  if (subCategories[category]) {
    subCategories[category].forEach(subCat => {
      const option = document.createElement('option');
      option.value = subCat;
      option.textContent = subCat;
      subCategorySelect.appendChild(option);
    });
  }
  
  // 매트리스 여부에 따라 색상/사이즈 옵션 UI 전환
  updateOptionUIForCategory();
};

// 제품 상세 이미지 필드 동적 생성
function initDetailImageFields() {
  const container = document.getElementById('detail-images-container');
  if (!container) return;
  
  let html = '';
  for (let i = 1; i <= 30; i++) {
    html += `
      <div class="flex items-center space-x-2">
        <span class="text-gray-500 text-sm w-8">${i}</span>
        <input type="text" id="edit-detailImage-${i}" placeholder="상세 이미지 URL ${i}"
               class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
      </div>
    `;
  }
  container.innerHTML = html;
}

// ==================== 고객 리뷰 관리 ====================

// 리뷰 관리 탭
function renderReviewsTab() {
  return `
    <div class="bg-white rounded-xl shadow-lg p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-star mr-2 text-yellow-400"></i>고객 리뷰 관리 (${reviews.length}개)
        </h2>
        <button onclick="openReviewModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <i class="fas fa-plus mr-2"></i>리뷰 추가
        </button>
      </div>

      ${reviews.length === 0 ? `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-star text-6xl mb-4 text-gray-300"></i>
          <p class="text-lg">등록된 리뷰가 없습니다.</p>
          <p class="text-sm mt-2">위 '리뷰 추가' 버튼을 클릭하여 고객 리뷰를 추가하세요.</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${reviews.map(review => `
            <div class="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <!-- 리뷰 이미지 -->
              <div class="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img src="${review.image || 'https://via.placeholder.com/400x300/F5F5F5/999999?text=No+Image'}" 
                     alt="${review.title}"
                     class="w-full h-full object-cover"
                     onerror="this.src='https://via.placeholder.com/400x300/F5F5F5/999999?text=No+Image'">
              </div>
              
              <!-- 리뷰 내용 -->
              <div class="p-4">
                <!-- 구매제품 -->
                <div class="mb-2">
                  <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    ${review.productName || '제품 미지정'}
                  </span>
                </div>
                
                <!-- 제목 -->
                <h3 class="font-bold text-gray-900 mb-2 line-clamp-1">${review.title}</h3>
                
                <!-- 별점 -->
                <div class="flex items-center mb-2">
                  <span class="font-bold text-gray-900 mr-2">${review.rating}</span>
                  <div class="flex text-yellow-400 text-sm">
                    ${'<i class="fas fa-star"></i>'.repeat(Math.floor(review.rating))}
                    ${review.rating % 1 !== 0 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                    ${'<i class="far fa-star"></i>'.repeat(5 - Math.ceil(review.rating))}
                  </div>
                </div>
                
                <!-- 내용 미리보기 -->
                <p class="text-gray-600 text-sm line-clamp-2 mb-3">${review.content}</p>
                
                <!-- 관리 버튼 -->
                <div class="flex gap-2">
                  <button onclick="openReviewModal(${review.id})" 
                          class="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm">
                    <i class="fas fa-edit mr-1"></i>수정
                  </button>
                  <button onclick="deleteReview(${review.id})" 
                          class="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 text-sm">
                    <i class="fas fa-trash mr-1"></i>삭제
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- 리뷰 편집 모달 -->
    <div id="review-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900" id="review-modal-title">리뷰 추가</h3>
            <button onclick="closeReviewModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <form id="review-form" class="space-y-6">
            <input type="hidden" id="edit-review-id">
            
            <!-- 리뷰 이미지 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-image mr-1"></i>리뷰 이미지 URL *
              </label>
              <input type="text" id="edit-review-image" required 
                     placeholder="https://example.com/review-image.jpg"
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <div id="review-image-preview" class="mt-2 hidden">
                <img src="" alt="미리보기" class="w-full h-48 object-cover rounded-lg border">
              </div>
            </div>

            <!-- 제목 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-heading mr-1"></i>리뷰 제목 *
              </label>
              <input type="text" id="edit-review-title" required 
                     placeholder="예: 정수기 사용 후기가 너무 좋아요!"
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- 별점 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-star mr-1 text-yellow-400"></i>별점 *
              </label>
              <div class="flex items-center gap-4">
                <input type="range" id="edit-review-rating" min="1" max="5" step="0.5" value="5"
                       onchange="updateRatingDisplay()"
                       class="flex-1">
                <span id="rating-display" class="text-2xl font-bold text-gray-900">5.0</span>
                <div id="rating-stars" class="flex text-yellow-400">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </div>
              </div>
            </div>

            <!-- 내용 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-align-left mr-1"></i>리뷰 내용 *
              </label>
              <textarea id="edit-review-content" required rows="4"
                        placeholder="고객님의 리뷰 내용을 입력하세요..."
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <!-- 구매 제품 선택 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-shopping-cart mr-1"></i>구매 제품 *
              </label>
              <select id="edit-review-product" required
                      onchange="updateProductName()"
                      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">제품을 선택하세요</option>
                ${products.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.category})</option>`).join('')}
              </select>
            </div>

            <!-- 버튼 -->
            <div class="flex gap-4">
              <button type="button" onclick="closeReviewModal()" 
                      class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium">
                취소
              </button>
              <button type="submit" 
                      class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
                <i class="fas fa-save mr-2"></i>저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// 리뷰 모달 열기
window.openReviewModal = function(reviewId = null) {
  editingReview = reviewId ? reviews.find(r => r.id === reviewId) : null;
  
  document.getElementById('review-modal-title').textContent = editingReview ? '리뷰 수정' : '리뷰 추가';
  document.getElementById('edit-review-id').value = editingReview ? editingReview.id : '';
  document.getElementById('edit-review-image').value = editingReview ? editingReview.image : '';
  document.getElementById('edit-review-title').value = editingReview ? editingReview.title : '';
  document.getElementById('edit-review-rating').value = editingReview ? editingReview.rating : 5;
  document.getElementById('edit-review-content').value = editingReview ? editingReview.content : '';
  
  // 제품 선택
  const productSelect = document.getElementById('edit-review-product');
  if (editingReview && editingReview.productId) {
    productSelect.value = editingReview.productId;
  } else {
    productSelect.value = '';
  }
  
  // 별점 표시 업데이트
  updateRatingDisplay();
  
  // 이미지 미리보기
  updateReviewImagePreview();
  
  document.getElementById('review-modal').classList.remove('hidden');
};

// 리뷰 모달 닫기
window.closeReviewModal = function() {
  document.getElementById('review-modal').classList.add('hidden');
  editingReview = null;
};

// 별점 표시 업데이트
window.updateRatingDisplay = function() {
  const rating = parseFloat(document.getElementById('edit-review-rating').value);
  document.getElementById('rating-display').textContent = rating.toFixed(1);
  
  const starsContainer = document.getElementById('rating-stars');
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      starsHtml += '<i class="fas fa-star"></i>';
    } else if (i - 0.5 <= rating) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    } else {
      starsHtml += '<i class="far fa-star"></i>';
    }
  }
  starsContainer.innerHTML = starsHtml;
};

// 제품명 업데이트
window.updateProductName = function() {
  const select = document.getElementById('edit-review-product');
  const selectedOption = select.options[select.selectedIndex];
  // 제품명은 저장 시 사용
};

// 리뷰 이미지 미리보기 업데이트
window.updateReviewImagePreview = function() {
  const imageUrl = document.getElementById('edit-review-image').value;
  const previewContainer = document.getElementById('review-image-preview');
  const previewImg = previewContainer.querySelector('img');
  
  if (imageUrl) {
    previewImg.src = imageUrl;
    previewContainer.classList.remove('hidden');
  } else {
    previewContainer.classList.add('hidden');
  }
};

// 이미지 URL 입력 시 미리보기
document.addEventListener('input', function(e) {
  if (e.target.id === 'edit-review-image') {
    updateReviewImagePreview();
  }
});

// 리뷰 저장
document.addEventListener('submit', async function(e) {
  if (e.target.id === 'review-form') {
    e.preventDefault();
    
    const productSelect = document.getElementById('edit-review-product');
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    
    const reviewData = {
      image: document.getElementById('edit-review-image').value,
      title: document.getElementById('edit-review-title').value,
      rating: parseFloat(document.getElementById('edit-review-rating').value),
      content: document.getElementById('edit-review-content').value,
      productId: parseInt(productSelect.value),
      productName: selectedOption ? selectedOption.dataset.name : ''
    };
    
    try {
      const reviewId = document.getElementById('edit-review-id').value;
      
      if (reviewId) {
        // 수정
        await axios.put(`/api/admin/reviews/${reviewId}`, reviewData);
        alert('리뷰가 수정되었습니다.');
      } else {
        // 추가
        await axios.post('/api/admin/reviews', reviewData);
        alert('리뷰가 추가되었습니다.');
      }
      
      closeReviewModal();
      await loadData();
      renderTabContent();
    } catch (error) {
      console.error('리뷰 저장 실패:', error);
      alert('리뷰 저장에 실패했습니다.');
    }
  }
});

// 리뷰 삭제
window.deleteReview = async function(reviewId) {
  if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;
  
  try {
    await axios.delete(`/api/admin/reviews/${reviewId}`);
    alert('리뷰가 삭제되었습니다.');
    await loadData();
    renderTabContent();
  } catch (error) {
    console.error('리뷰 삭제 실패:', error);
    alert('리뷰 삭제에 실패했습니다.');
  }
};

// ==================== 팝업 관리 탭 ====================

function renderPopupTab() {
  const popup = siteSettings.popupSettings || {
    enabled: true,
    badge: '특별 혜택',
    title: '청호나이스 렌탈 지원금',
    subtitle: '지금 상담신청하고 최대 혜택 받으세요!',
    benefitText: '최대 30만원',
    benefitSubText: '지원금 혜택',
    benefitNote: '* 제품 및 약정기간에 따라 지원금이 상이합니다',
    formTitle: '3초만에 내 지원금 확인하기',
    formSubtitle: '전화번호를 입력해 주세요',
    buttonText: '내 최대 지원금 안내 받기',
    productName: '[지원금 안내] 전체'
  };
  
  return `
    <div class="space-y-8">
      <!-- 팝업 설정 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-window-restore mr-2 text-blue-600"></i>팝업창 설정
          </h2>
          <label class="flex items-center gap-3 cursor-pointer">
            <span class="text-sm font-medium text-gray-700">팝업 활성화</span>
            <div class="relative">
              <input type="checkbox" id="popup-enabled" ${popup.enabled ? 'checked' : ''} 
                     class="sr-only peer" onchange="togglePopupEnabled()">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>
        
        <p class="text-sm text-gray-500 mb-6">
          <i class="fas fa-info-circle mr-1"></i>
          방문자가 홈페이지에 처음 접속할 때 표시되는 팝업창입니다. "오늘 하루 보지 않기" 체크 시 하루 동안 표시되지 않습니다.
        </p>
        
        <form id="popup-settings-form" class="space-y-6">
          <!-- 헤더 영역 설정 -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4">
              <i class="fas fa-heading mr-2"></i>헤더 영역
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">배지 텍스트</label>
                <input type="text" id="popup-badge" value="${popup.badge || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 특별 혜택">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input type="text" id="popup-title" value="${popup.title || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 청호나이스 렌탈 지원금">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">부제목</label>
                <input type="text" id="popup-subtitle" value="${popup.subtitle || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 지금 상담신청하고 최대 혜택 받으세요!">
              </div>
            </div>
          </div>
          
          <!-- 혜택 안내 영역 -->
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4">
              <i class="fas fa-gift mr-2"></i>혜택 안내 영역
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">혜택 금액 (큰 텍스트)</label>
                <input type="text" id="popup-benefit-text" value="${popup.benefitText || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 최대 30만원">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">혜택 설명</label>
                <input type="text" id="popup-benefit-subtext" value="${popup.benefitSubText || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 지원금 혜택">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">하단 안내 문구</label>
                <input type="text" id="popup-benefit-note" value="${popup.benefitNote || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: * 제품 및 약정기간에 따라 지원금이 상이합니다">
              </div>
            </div>
          </div>
          
          <!-- 폼 영역 설정 -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 class="font-bold text-lg text-gray-800 mb-4">
              <i class="fas fa-edit mr-2"></i>입력 폼 영역
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">폼 제목</label>
                <input type="text" id="popup-form-title" value="${popup.formTitle || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 3초만에 내 지원금 확인하기">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">폼 부제목</label>
                <input type="text" id="popup-form-subtitle" value="${popup.formSubtitle || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 전화번호를 입력해 주세요">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">버튼 텍스트</label>
                <input type="text" id="popup-button-text" value="${popup.buttonText || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: 내 최대 지원금 안내 받기">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">신청 시 제품명 (CMS 표시용)</label>
                <input type="text" id="popup-product-name" value="${popup.productName || ''}" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="예: [지원금 안내] 전체">
              </div>
            </div>
          </div>
          
          <!-- 저장 버튼 -->
          <div class="flex justify-end gap-4">
            <button type="button" onclick="previewPopup()" 
                    class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
              <i class="fas fa-eye mr-2"></i>미리보기
            </button>
            <button type="submit" 
                    class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
              <i class="fas fa-save mr-2"></i>팝업 설정 저장
            </button>
          </div>
        </form>
      </div>
      
      <!-- 미리보기 영역 -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-desktop mr-2 text-green-600"></i>팝업 미리보기
        </h2>
        <div id="popup-preview" class="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
          <p class="text-gray-500">"미리보기" 버튼을 클릭하면 현재 설정으로 팝업을 확인할 수 있습니다.</p>
        </div>
      </div>
    </div>
  `;
}

// 팝업 활성화 토글
window.togglePopupEnabled = async function() {
  const enabled = document.getElementById('popup-enabled').checked;
  
  try {
    const popup = siteSettings.popupSettings || {};
    popup.enabled = enabled;
    
    await axios.put('/api/admin/settings', {
      ...siteSettings,
      popupSettings: popup
    });
    
    siteSettings.popupSettings = popup;
    alert(enabled ? '팝업이 활성화되었습니다.' : '팝업이 비활성화되었습니다.');
  } catch (error) {
    console.error('팝업 설정 저장 실패:', error);
    alert('설정 저장에 실패했습니다.');
  }
};

// 팝업 미리보기
window.previewPopup = function() {
  const preview = document.getElementById('popup-preview');
  
  const badge = document.getElementById('popup-badge').value || '특별 혜택';
  const title = document.getElementById('popup-title').value || '청호나이스 렌탈 지원금';
  const subtitle = document.getElementById('popup-subtitle').value || '지금 상담신청하고 최대 혜택 받으세요!';
  const benefitText = document.getElementById('popup-benefit-text').value || '최대 30만원';
  const benefitSubText = document.getElementById('popup-benefit-subtext').value || '지원금 혜택';
  const benefitNote = document.getElementById('popup-benefit-note').value || '* 제품 및 약정기간에 따라 지원금이 상이합니다';
  const formTitle = document.getElementById('popup-form-title').value || '3초만에 내 지원금 확인하기';
  const formSubtitle = document.getElementById('popup-form-subtitle').value || '전화번호를 입력해 주세요';
  const buttonText = document.getElementById('popup-button-text').value || '내 최대 지원금 안내 받기';
  
  preview.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mx-auto">
      <!-- 헤더 -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
        <div class="flex items-center gap-2 mb-2">
          <i class="fas fa-gift"></i>
          <span class="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">${badge}</span>
        </div>
        <h2 class="text-xl font-bold mb-1">${title}</h2>
        <p class="text-blue-100 text-sm">${subtitle}</p>
      </div>
      
      <!-- 혜택 -->
      <div class="p-5 bg-gradient-to-b from-blue-50 to-white text-center">
        <p class="text-gray-600 text-sm mb-1">렌탈 가입 시 받을 수 있는</p>
        <div class="flex items-center justify-center gap-2">
          <span class="text-3xl font-black text-blue-600">${benefitText}</span>
          <span class="text-base text-gray-700 font-bold">${benefitSubText}</span>
        </div>
        <p class="text-xs text-gray-500 mt-2">${benefitNote}</p>
        
        <!-- 아이콘 -->
        <div class="flex justify-center gap-4 mt-4">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-tint text-blue-600"></i>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-wind text-green-600"></i>
          </div>
          <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="fas fa-toilet text-purple-600"></i>
          </div>
          <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <i class="fas fa-couch text-orange-600"></i>
          </div>
        </div>
      </div>
      
      <!-- 폼 -->
      <div class="p-5 pt-0">
        <div class="text-center mb-3">
          <p class="text-blue-600 font-bold text-sm"><i class="fas fa-bell mr-1"></i>${formTitle}</p>
          <p class="text-gray-500 text-xs">${formSubtitle}</p>
        </div>
        <div class="space-y-2">
          <input type="text" placeholder="이름을 입력해주세요" disabled
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
          <input type="tel" placeholder="연락처를 -없이 입력해주세요" disabled
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
          <button disabled class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg text-sm">
            <i class="fas fa-paper-plane mr-2"></i>${buttonText}
          </button>
        </div>
      </div>
      
      <!-- 하단 -->
      <div class="bg-gray-100 px-5 py-2 flex items-center justify-between text-xs text-gray-600">
        <label class="flex items-center gap-1">
          <input type="checkbox" disabled class="w-3 h-3">
          <span>오늘 하루 보지 않기</span>
        </label>
        <span>닫기</span>
      </div>
    </div>
  `;
};

// 팝업 설정 폼 제출
document.addEventListener('submit', async function(e) {
  if (e.target.id === 'popup-settings-form') {
    e.preventDefault();
    
    const popupData = {
      enabled: document.getElementById('popup-enabled').checked,
      badge: document.getElementById('popup-badge').value,
      title: document.getElementById('popup-title').value,
      subtitle: document.getElementById('popup-subtitle').value,
      benefitText: document.getElementById('popup-benefit-text').value,
      benefitSubText: document.getElementById('popup-benefit-subtext').value,
      benefitNote: document.getElementById('popup-benefit-note').value,
      formTitle: document.getElementById('popup-form-title').value,
      formSubtitle: document.getElementById('popup-form-subtitle').value,
      buttonText: document.getElementById('popup-button-text').value,
      productName: document.getElementById('popup-product-name').value
    };
    
    try {
      await axios.put('/api/admin/settings', {
        ...siteSettings,
        popupSettings: popupData
      });
      
      siteSettings.popupSettings = popupData;
      alert('팝업 설정이 저장되었습니다!');
    } catch (error) {
      console.error('팝업 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  }
});

// ==================== 하단 메뉴 관리 탭 ====================

function renderBottomMenuTab() {
  const bottomMenu = siteSettings.bottomMenuSettings || {
    pcLabel: '렌탈 전화상담',
    mobileLeftTitle: '간편상담',
    mobileLeftSubtitle: '정보기입 / 문의내용 남기기',
    mobileLeftIcon: '✉️',
    mobileRightTitle: '공식 상담 채널',
    mobileRightSubtitle: '바로 통화 연결',
    mobileRightIcon: '📞',
    consultationTitle: '청호나이스 렌탈상담',
    submitButtonText: '빠른상담신청'
  };
  
  const quickPanel = siteSettings.quickPanelSettings || {
    managerImage: '',
    managerName: '착한렌탈 매니저'
  };
  
  return `
    <div class="space-y-8">
      <!-- 우측 퀵패널 설정 (담당자 정보) -->
      <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-lg p-6 border border-green-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-800">
            <i class="fas fa-user-tie mr-2 text-green-600"></i>우측 퀵패널 - 담당자 설정
          </h3>
          <button onclick="saveQuickPanelSettings()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            <i class="fas fa-save mr-2"></i>담당자 정보 저장
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          홈페이지 우측에 고정된 퀵패널 상단에 표시되는 담당자 정보를 설정합니다.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">담당자 이미지 URL</label>
            <input type="text" id="quick-panel-manager-image" value="${quickPanel.managerImage || ''}" 
                   placeholder="이미지 URL 입력"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
            <p class="text-xs text-gray-500 mt-1">정사각형 이미지 권장 (프로필 사진)</p>
            <div class="mt-3 flex justify-center">
              ${quickPanel.managerImage ? 
                `<img src="${quickPanel.managerImage}" class="w-20 h-20 object-cover rounded-full border-2 border-gray-200" onerror="this.style.display='none'">` : 
                `<div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <i class="fas fa-user text-3xl text-gray-400"></i>
                </div>`}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">담당자 이름/직함</label>
            <textarea id="quick-panel-manager-name" rows="2"
                   placeholder="예: 정수기대장&#10;신동석"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none">${quickPanel.managerName || '착한렌탈 매니저'}</textarea>
            <p class="text-xs text-gray-500 mt-1">퀵패널 상단에 표시될 이름 (Enter키로 줄바꿈 가능)</p>
            <div class="mt-3">
              <p class="text-sm text-gray-600 mb-1">미리보기:</p>
              <div class="bg-white rounded-lg shadow p-3 inline-block">
                <div class="text-xs font-bold text-gray-800 bg-gray-100 rounded px-2 py-1 whitespace-pre-line" id="preview-manager-name">${quickPanel.managerName || '착한렌탈 매니저'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 하단 메뉴 설정 폼 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900">
              <i class="fas fa-bars mr-2 text-blue-600"></i>하단 고정 메뉴 설정
          </h3>
        </div>
        <p class="text-sm text-gray-500 mb-6">
          홈페이지 하단에 항상 표시되는 고정 메뉴의 텍스트와 아이콘을 설정합니다.
        </p>
        
        <form id="bottom-menu-form" class="space-y-6">
          <!-- PC 하단바 설정 -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-desktop mr-2 text-blue-600"></i>PC 하단바 설정
            </h4>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">전화상담 라벨</label>
                <input type="text" id="bottom-pc-label" value="${bottomMenu.pcLabel || '렌탈 전화상담'}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <p class="text-xs text-gray-500 mt-1">예: 렌탈 전화상담, 고객센터 등</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input type="text" id="bottom-phone-number" value="${siteSettings.phoneNumber || '1588-0365'}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <p class="text-xs text-gray-500 mt-1">하단 메뉴 및 전화 연결에 사용되는 번호</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">상담신청 버튼 텍스트</label>
                <input type="text" id="bottom-submit-btn" value="${bottomMenu.submitButtonText || '빠른상담신청'}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
          </div>
          
          <!-- 모바일 하단바 설정 -->
          <div class="bg-green-50 rounded-lg p-4">
            <h4 class="font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-mobile-alt mr-2 text-green-600"></i>모바일 하단바 설정
            </h4>
            
            <div class="grid grid-cols-2 gap-4">
              <!-- 왼쪽 버튼 -->
              <div class="space-y-3">
                <p class="text-sm font-medium text-gray-700 border-b pb-1">왼쪽 버튼 (간편상담)</p>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">아이콘 (이모지)</label>
                  <input type="text" id="bottom-mobile-left-icon" value="${bottomMenu.mobileLeftIcon || '✉️'}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl">
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">제목</label>
                  <input type="text" id="bottom-mobile-left-title" value="${bottomMenu.mobileLeftTitle || '간편상담'}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">부제목</label>
                  <input type="text" id="bottom-mobile-left-subtitle" value="${bottomMenu.mobileLeftSubtitle || '정보기입 / 문의내용 남기기'}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
              </div>
              
              <!-- 오른쪽 버튼 -->
              <div class="space-y-3">
                <p class="text-sm font-medium text-gray-700 border-b pb-1">오른쪽 버튼 (전화상담)</p>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">아이콘 (이모지)</label>
                  <input type="text" id="bottom-mobile-right-icon" value="${bottomMenu.mobileRightIcon || '📞'}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl">
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">제목</label>
                  <input type="text" id="bottom-mobile-right-title" value="${bottomMenu.mobileRightTitle || '공식 상담 채널'}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">부제목</label>
                  <input type="text" id="bottom-mobile-right-subtitle" value="${bottomMenu.mobileRightSubtitle || '바로 통화 연결'}" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                </div>
              </div>
            </div>
          </div>
          
          <!-- 상담 모달 설정 -->
          <div class="bg-purple-50 rounded-lg p-4">
            <h4 class="font-bold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-comment-dots mr-2 text-purple-600"></i>상담 모달 설정
            </h4>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">상담 모달 제목</label>
              <input type="text" id="bottom-consultation-title" value="${bottomMenu.consultationTitle || '청호나이스 렌탈상담'}" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
            <i class="fas fa-save mr-2"></i>하단 메뉴 설정 저장
          </button>
        </form>
      </div>
      
      <!-- 미리보기 -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-6">
          <i class="fas fa-eye mr-2 text-green-600"></i>미리보기
        </h3>
        
        <!-- PC 미리보기 -->
        <div class="mb-6">
          <p class="text-sm font-medium text-gray-600 mb-2">PC 하단바</p>
          <div class="bg-blue-900 rounded-lg p-3">
            <div class="flex items-center justify-center gap-4">
              <div class="flex items-center space-x-2 text-white pr-4 border-r border-white border-opacity-30">
                <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <i class="fas fa-phone text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-xs opacity-80" id="preview-pc-label">${bottomMenu.pcLabel || '렌탈 전화상담'}</div>
                  <div class="font-bold text-sm" id="preview-phone-number">${siteSettings.phoneNumber || '1588-0365'}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <input type="text" placeholder="이름" disabled class="px-2 py-1 rounded text-xs w-16 bg-white">
                <input type="text" placeholder="연락처" disabled class="px-2 py-1 rounded text-xs w-20 bg-white">
                <button disabled class="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold" id="preview-submit-btn">
                  ${bottomMenu.submitButtonText || '빠른상담신청'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 모바일 미리보기 -->
        <div>
          <p class="text-sm font-medium text-gray-600 mb-2">모바일 하단바</p>
          <div class="bg-white border-2 border-blue-600 rounded-lg overflow-hidden">
            <div class="grid grid-cols-2 divide-x divide-gray-200">
              <div class="flex flex-col items-center justify-center py-3 px-2">
                <div class="text-xl mb-1" id="preview-mobile-left-icon">${bottomMenu.mobileLeftIcon || '✉️'}</div>
                <div class="font-bold text-gray-900 text-sm" id="preview-mobile-left-title">${bottomMenu.mobileLeftTitle || '간편상담'}</div>
                <div class="text-xs text-gray-600" id="preview-mobile-left-subtitle">${bottomMenu.mobileLeftSubtitle || '정보기입 / 문의내용 남기기'}</div>
              </div>
              <div class="flex flex-col items-center justify-center py-3 px-2">
                <div class="text-xl mb-1" id="preview-mobile-right-icon">${bottomMenu.mobileRightIcon || '📞'}</div>
                <div class="font-bold text-gray-900 text-sm" id="preview-mobile-right-title">${bottomMenu.mobileRightTitle || '공식 상담 채널'}</div>
                <div class="text-xs text-gray-600" id="preview-mobile-right-subtitle">${bottomMenu.mobileRightSubtitle || '바로 통화 연결'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <p class="text-xs text-gray-500 mt-4 text-center">
          * 실제 홈페이지에서 변경사항이 적용되려면 새로고침이 필요합니다.
        </p>
      </div>
      </div>
    </div>
  `;
}

// 우측 퀵패널 담당자 정보 저장
window.saveQuickPanelSettings = async function() {
  const quickPanelData = {
    managerImage: document.getElementById('quick-panel-manager-image').value.trim(),
    managerName: document.getElementById('quick-panel-manager-name').value.trim() || '착한렌탈 매니저'
  };
  
  try {
    await axios.put('/api/admin/settings', {
      ...siteSettings,
      quickPanelSettings: quickPanelData
    });
    
    siteSettings.quickPanelSettings = quickPanelData;
    alert('담당자 정보가 저장되었습니다!');
    renderTabContent(); // 미리보기 업데이트
  } catch (error) {
    console.error('담당자 정보 저장 실패:', error);
    alert('저장에 실패했습니다.');
  }
};

// 하단 메뉴 설정 실시간 미리보기 업데이트
function setupBottomMenuPreview() {
  const fields = [
    { input: 'bottom-pc-label', preview: 'preview-pc-label' },
    { input: 'bottom-submit-btn', preview: 'preview-submit-btn' },
    { input: 'bottom-mobile-left-icon', preview: 'preview-mobile-left-icon' },
    { input: 'bottom-mobile-left-title', preview: 'preview-mobile-left-title' },
    { input: 'bottom-mobile-left-subtitle', preview: 'preview-mobile-left-subtitle' },
    { input: 'bottom-mobile-right-icon', preview: 'preview-mobile-right-icon' },
    { input: 'bottom-mobile-right-title', preview: 'preview-mobile-right-title' },
    { input: 'bottom-mobile-right-subtitle', preview: 'preview-mobile-right-subtitle' },
    { input: 'bottom-phone-number', preview: 'preview-phone-number' },
    { input: 'quick-panel-manager-name', preview: 'preview-manager-name' }
  ];
  
  fields.forEach(field => {
    const inputEl = document.getElementById(field.input);
    const previewEl = document.getElementById(field.preview);
    if (inputEl && previewEl) {
      inputEl.addEventListener('input', () => {
        previewEl.textContent = inputEl.value;
      });
    }
  });
}

// 하단 메뉴 폼 제출 처리
document.addEventListener('submit', async function(e) {
  if (e.target.id === 'bottom-menu-form') {
    e.preventDefault();
    
    const bottomMenuData = {
      pcLabel: document.getElementById('bottom-pc-label').value,
      submitButtonText: document.getElementById('bottom-submit-btn').value,
      mobileLeftIcon: document.getElementById('bottom-mobile-left-icon').value,
      mobileLeftTitle: document.getElementById('bottom-mobile-left-title').value,
      mobileLeftSubtitle: document.getElementById('bottom-mobile-left-subtitle').value,
      mobileRightIcon: document.getElementById('bottom-mobile-right-icon').value,
      mobileRightTitle: document.getElementById('bottom-mobile-right-title').value,
      mobileRightSubtitle: document.getElementById('bottom-mobile-right-subtitle').value,
      consultationTitle: document.getElementById('bottom-consultation-title').value
    };
    
    const newPhoneNumber = document.getElementById('bottom-phone-number').value;
    
    try {
      await axios.put('/api/admin/settings', {
        ...siteSettings,
        phoneNumber: newPhoneNumber,
        bottomMenuSettings: bottomMenuData
      });
      
      siteSettings.phoneNumber = newPhoneNumber;
      siteSettings.bottomMenuSettings = bottomMenuData;
      alert('하단 메뉴 설정이 저장되었습니다!');
    } catch (error) {
      console.error('하단 메뉴 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  }
});

// 탭 전환 시 미리보기 설정
const originalSwitchTab = window.switchTab;
window.switchTab = function(tab) {
  originalSwitchTab(tab);
  if (tab === 'bottomMenu') {
    setTimeout(setupBottomMenuPreview, 100);
  }
};

// ==================== 렌탈 안내 관리 탭 ====================

function renderRentalGuideTab() {
  const guide = siteSettings.rentalGuide || {
    benefits: { title: '렌탈 혜택', items: ['등록비 무료', '무상 A/S 제공', '정기 관리 서비스', '제휴카드 할인'] },
    contract: { title: '계약 안내', items: ['의무 사용 기간: 3년 또는 5년', '점검 주기: 2개월 또는 6개월', '소유권 이전: 계약 기간 종료 후'] },
    inquiry: { title: '문의 방법', items: ['전화 상담: 1588-0365 (평일 09:00~18:00)', '카카오톡: @청호나이스렌탈', '온라인 상담: 렌탈 신청하기 버튼 클릭'] }
  };
  
  return `
    <div class="space-y-8">
      <!-- 안내 헤더 -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-info-circle mr-2 text-indigo-600"></i>렌탈 안내 설정
        </h2>
        <p class="text-sm text-gray-600">
          제품 상세 페이지의 '렌탈 안내' 탭에 표시되는 내용을 수정합니다.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 편집 폼 -->
        <div class="space-y-6">
          <!-- 렌탈 혜택 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-blue-900">
                <i class="fas fa-gift mr-2 text-blue-600"></i>렌탈 혜택
              </h3>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">섹션 제목</label>
              <input type="text" id="rental-benefits-title" value="${guide.benefits?.title || '렌탈 혜택'}" 
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">혜택 항목 (한 줄에 하나씩)</label>
              <textarea id="rental-benefits-items" rows="5" 
                        placeholder="등록비 무료&#10;무상 A/S 제공&#10;정기 관리 서비스"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">${(guide.benefits?.items || []).join('\n')}</textarea>
              <p class="text-xs text-gray-500 mt-1">각 항목을 Enter로 구분해서 입력하세요</p>
            </div>
          </div>

          <!-- 계약 안내 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">
                <i class="fas fa-file-contract mr-2 text-gray-600"></i>계약 안내
              </h3>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">섹션 제목</label>
              <input type="text" id="rental-contract-title" value="${guide.contract?.title || '계약 안내'}" 
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">계약 항목 (한 줄에 하나씩)</label>
              <textarea id="rental-contract-items" rows="4" 
                        placeholder="의무 사용 기간: 3년 또는 5년&#10;점검 주기: 2개월 또는 6개월"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">${(guide.contract?.items || []).join('\n')}</textarea>
              <p class="text-xs text-gray-500 mt-1">각 항목을 Enter로 구분해서 입력하세요</p>
            </div>
          </div>

          <!-- 문의 방법 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-green-900">
                <i class="fas fa-headset mr-2 text-green-600"></i>문의 방법
              </h3>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">섹션 제목</label>
              <input type="text" id="rental-inquiry-title" value="${guide.inquiry?.title || '문의 방법'}" 
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">문의 항목 (한 줄에 하나씩)</label>
              <textarea id="rental-inquiry-items" rows="4" 
                        placeholder="전화 상담: 1588-0365&#10;카카오톡: @청호나이스렌탈"
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">${(guide.inquiry?.items || []).join('\n')}</textarea>
              <p class="text-xs text-gray-500 mt-1">각 항목을 Enter로 구분해서 입력하세요</p>
            </div>
          </div>

          <!-- 저장 버튼 -->
          <button onclick="saveRentalGuide()" 
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg">
            <i class="fas fa-save mr-2"></i>렌탈 안내 저장
          </button>
        </div>

        <!-- 미리보기 -->
        <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
          <h3 class="text-xl font-bold text-gray-900 mb-6">
            <i class="fas fa-eye mr-2 text-green-600"></i>미리보기
          </h3>
          <p class="text-sm text-gray-500 mb-4">제품 상세 페이지의 '렌탈 안내' 탭에 표시되는 모습입니다.</p>
          
          <div class="space-y-4" id="rental-guide-preview">
            <!-- 렌탈 혜택 미리보기 -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-bold text-lg mb-3 text-blue-900" id="preview-benefits-title">${guide.benefits?.title || '렌탈 혜택'}</h4>
              <ul class="space-y-2 text-gray-700" id="preview-benefits-items">
                ${(guide.benefits?.items || []).map(item => `<li><i class="fas fa-check text-blue-600 mr-2"></i>${item}</li>`).join('')}
              </ul>
            </div>

            <!-- 계약 안내 미리보기 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-bold text-lg mb-3 text-gray-900" id="preview-contract-title">${guide.contract?.title || '계약 안내'}</h4>
              <ul class="space-y-2 text-gray-700" id="preview-contract-items">
                ${(guide.contract?.items || []).map(item => `<li><i class="fas fa-circle text-gray-400 text-xs mr-2"></i>${item}</li>`).join('')}
              </ul>
            </div>

            <!-- 문의 방법 미리보기 -->
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-bold text-lg mb-3 text-green-900" id="preview-inquiry-title">${guide.inquiry?.title || '문의 방법'}</h4>
              <ul class="space-y-2 text-gray-700" id="preview-inquiry-items">
                ${(guide.inquiry?.items || []).map(item => `<li><i class="fas fa-phone text-green-600 mr-2"></i>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 렌탈 안내 실시간 미리보기 업데이트
function setupRentalGuideListeners() {
  // 제목 필드들
  const titleFields = [
    { input: 'rental-benefits-title', preview: 'preview-benefits-title' },
    { input: 'rental-contract-title', preview: 'preview-contract-title' },
    { input: 'rental-inquiry-title', preview: 'preview-inquiry-title' }
  ];
  
  titleFields.forEach(field => {
    const inputEl = document.getElementById(field.input);
    const previewEl = document.getElementById(field.preview);
    if (inputEl && previewEl) {
      inputEl.addEventListener('input', () => {
        previewEl.textContent = inputEl.value;
      });
    }
  });
  
  // 항목 필드들
  const itemFields = [
    { input: 'rental-benefits-items', preview: 'preview-benefits-items', icon: '<i class="fas fa-check text-blue-600 mr-2"></i>' },
    { input: 'rental-contract-items', preview: 'preview-contract-items', icon: '<i class="fas fa-circle text-gray-400 text-xs mr-2"></i>' },
    { input: 'rental-inquiry-items', preview: 'preview-inquiry-items', icon: '<i class="fas fa-phone text-green-600 mr-2"></i>' }
  ];
  
  itemFields.forEach(field => {
    const inputEl = document.getElementById(field.input);
    const previewEl = document.getElementById(field.preview);
    if (inputEl && previewEl) {
      inputEl.addEventListener('input', () => {
        const items = inputEl.value.split('\n').filter(item => item.trim());
        previewEl.innerHTML = items.map(item => `<li>${field.icon}${item}</li>`).join('');
      });
    }
  });
}

// 렌탈 안내 저장
window.saveRentalGuide = async function() {
  const rentalGuideData = {
    benefits: {
      title: document.getElementById('rental-benefits-title').value.trim() || '렌탈 혜택',
      items: document.getElementById('rental-benefits-items').value.split('\n').filter(item => item.trim())
    },
    contract: {
      title: document.getElementById('rental-contract-title').value.trim() || '계약 안내',
      items: document.getElementById('rental-contract-items').value.split('\n').filter(item => item.trim())
    },
    inquiry: {
      title: document.getElementById('rental-inquiry-title').value.trim() || '문의 방법',
      items: document.getElementById('rental-inquiry-items').value.split('\n').filter(item => item.trim())
    }
  };
  
  try {
    await axios.put('/api/admin/settings', {
      ...siteSettings,
      rentalGuide: rentalGuideData
    });
    
    siteSettings.rentalGuide = rentalGuideData;
    alert('렌탈 안내가 저장되었습니다!');
  } catch (error) {
    console.error('렌탈 안내 저장 실패:', error);
    alert('저장에 실패했습니다.');
  }
};

// ==================== 제품 순서 관리 ====================

// 제품 순서 관리 모달 열기
window.openProductOrderModal = function() {
  // 카테고리 목록
  const categories = [
    { name: '정수기', dataCategory: '정수기', subCategories: ['얼음정수기', '냉온정수기', '냉정수기', '일반정수기'] },
    { name: '공기청정기', dataCategory: '공기청정기', subCategories: ['10평형', '20평형', '30평형', '40평형', '제습공기청정기'] },
    { name: '비데·연수기', dataCategory: '비데', subCategories: ['비데', '연수기'] },
    { name: '생활가전', dataCategory: '생활가전', subCategories: ['제빙기', '매트리스', '안마의자', '패키지'] }
  ];
  
  // 모달 HTML 생성
  const modalHtml = `
    <div id="product-order-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <!-- 모달 헤더 -->
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex justify-between items-center">
          <h3 class="text-xl font-bold text-white">
            <i class="fas fa-sort mr-2"></i>제품 순서 관리
          </h3>
          <button onclick="closeProductOrderModal()" class="text-white hover:text-gray-200">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <!-- 카테고리/서브카테고리 선택 -->
        <div class="px-6 py-4 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
          <label class="font-medium text-gray-700">카테고리:</label>
          <select id="order-category-select" onchange="loadOrderSubCategories()" class="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
            ${categories.map(cat => `<option value="${cat.dataCategory}" data-subcats='${JSON.stringify(cat.subCategories)}'>${cat.name}</option>`).join('')}
          </select>
          
          <label class="font-medium text-gray-700 ml-4">세부 카테고리:</label>
          <select id="order-subcategory-select" onchange="loadProductsForOrdering()" class="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
            <option value="">전체</option>
          </select>
          
          <button onclick="loadProductsForOrdering()" class="ml-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            <i class="fas fa-sync-alt mr-1"></i>새로고침
          </button>
        </div>
        
        <!-- 안내 메시지 -->
        <div class="px-6 py-3 bg-yellow-50 border-b">
          <p class="text-sm text-yellow-700">
            <i class="fas fa-info-circle mr-1"></i>
            위/아래 버튼으로 제품 순서를 변경하세요. 순서 값이 낮을수록 카테고리 페이지에서 먼저 표시됩니다.
          </p>
        </div>
        
        <!-- 제품 목록 -->
        <div class="p-6 overflow-y-auto" style="max-height: 50vh;">
          <div id="product-order-list" class="space-y-2">
            <!-- 동적으로 로드됨 -->
          </div>
        </div>
        
        <!-- 모달 푸터 -->
        <div class="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <span class="text-sm text-gray-500">
            <i class="fas fa-lightbulb mr-1 text-yellow-500"></i>
            변경 후 '순서 저장' 버튼을 눌러주세요.
          </span>
          <div class="flex gap-3">
            <button onclick="closeProductOrderModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              닫기
            </button>
            <button onclick="saveProductOrder()" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <i class="fas fa-save mr-2"></i>순서 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 모달을 body에 추가
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // 초기 서브카테고리 로드
  loadOrderSubCategories();
  loadProductsForOrdering();
};

// 서브카테고리 옵션 로드
window.loadOrderSubCategories = function() {
  const categorySelect = document.getElementById('order-category-select');
  const subCategorySelect = document.getElementById('order-subcategory-select');
  const selectedOption = categorySelect.options[categorySelect.selectedIndex];
  const subCategories = JSON.parse(selectedOption.dataset.subcats || '[]');
  
  subCategorySelect.innerHTML = '<option value="">전체</option>';
  subCategories.forEach(sub => {
    subCategorySelect.innerHTML += `<option value="${sub}">${sub}</option>`;
  });
  
  loadProductsForOrdering();
};

// 정렬용 제품 목록 로드
window.loadProductsForOrdering = function() {
  const category = document.getElementById('order-category-select').value;
  const subCategory = document.getElementById('order-subcategory-select').value;
  const listContainer = document.getElementById('product-order-list');
  
  // 해당 카테고리/서브카테고리 제품 필터링
  let filtered = products.filter(p => p.category === category);
  if (subCategory) {
    filtered = filtered.filter(p => p.subCategory === subCategory);
  }
  
  // displayOrder로 정렬 (없으면 id로)
  filtered.sort((a, b) => {
    const orderA = a.displayOrder || a.id || 0;
    const orderB = b.displayOrder || b.id || 0;
    return orderA - orderB;
  });
  
  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-10 text-gray-500">
        <i class="fas fa-box-open text-4xl mb-3"></i>
        <p>해당 카테고리에 제품이 없습니다.</p>
      </div>
    `;
    return;
  }
  
  listContainer.innerHTML = filtered.map((p, idx) => `
    <div class="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition" data-product-id="${p.id}" data-current-order="${idx + 1}">
      <!-- 순서 번호 -->
      <div class="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-700 font-bold rounded-lg">
        ${idx + 1}
      </div>
      
      <!-- 제품 이미지 -->
      <div class="w-14 h-14 flex-shrink-0">
        <img src="${p.image || 'https://via.placeholder.com/56'}" 
             alt="${p.name}" 
             class="w-full h-full object-cover rounded-lg border"
             onerror="this.src='https://via.placeholder.com/56'">
      </div>
      
      <!-- 제품 정보 -->
      <div class="flex-grow min-w-0">
        <div class="font-medium text-gray-900 truncate">${p.name}</div>
        <div class="text-sm text-gray-500 truncate">${p.modelName || ''} | ${formatPrice(p.price)}원</div>
      </div>
      
      <!-- 태그 -->
      ${p.promotionTag ? `<span class="px-2 py-1 bg-red-500 text-white text-xs rounded">${p.promotionTag}</span>` : ''}
      
      <!-- 순서 변경 버튼 -->
      <div class="flex flex-col gap-1">
        <button onclick="moveProductOrder(${p.id}, 'up')" class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded transition" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
          <i class="fas fa-chevron-up"></i>
        </button>
        <button onclick="moveProductOrder(${p.id}, 'down')" class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded transition" ${idx === filtered.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
    </div>
  `).join('');
};

// 제품 순서 이동
window.moveProductOrder = function(productId, direction) {
  const listContainer = document.getElementById('product-order-list');
  const items = Array.from(listContainer.children);
  const currentIndex = items.findIndex(item => parseInt(item.dataset.productId) === productId);
  
  if (currentIndex === -1) return;
  
  let newIndex;
  if (direction === 'up' && currentIndex > 0) {
    newIndex = currentIndex - 1;
  } else if (direction === 'down' && currentIndex < items.length - 1) {
    newIndex = currentIndex + 1;
  } else {
    return;
  }
  
  // DOM에서 위치 변경
  const currentItem = items[currentIndex];
  const targetItem = items[newIndex];
  
  if (direction === 'up') {
    listContainer.insertBefore(currentItem, targetItem);
  } else {
    listContainer.insertBefore(targetItem, currentItem);
  }
  
  // 순서 번호 업데이트
  updateOrderNumbers();
};

// 순서 번호 표시 업데이트
function updateOrderNumbers() {
  const items = document.querySelectorAll('#product-order-list > div');
  items.forEach((item, idx) => {
    const orderBadge = item.querySelector('div:first-child');
    if (orderBadge) {
      orderBadge.textContent = idx + 1;
    }
    item.dataset.currentOrder = idx + 1;
    
    // 버튼 상태 업데이트
    const upBtn = item.querySelectorAll('button')[0];
    const downBtn = item.querySelectorAll('button')[1];
    
    if (idx === 0) {
      upBtn.disabled = true;
      upBtn.style.opacity = '0.3';
      upBtn.style.cursor = 'not-allowed';
    } else {
      upBtn.disabled = false;
      upBtn.style.opacity = '1';
      upBtn.style.cursor = 'pointer';
    }
    
    if (idx === items.length - 1) {
      downBtn.disabled = true;
      downBtn.style.opacity = '0.3';
      downBtn.style.cursor = 'not-allowed';
    } else {
      downBtn.disabled = false;
      downBtn.style.opacity = '1';
      downBtn.style.cursor = 'pointer';
    }
  });
}

// 제품 순서 저장
window.saveProductOrder = async function() {
  const items = document.querySelectorAll('#product-order-list > div');
  
  if (items.length === 0) {
    alert('저장할 제품이 없습니다.');
    return;
  }
  
  const orders = Array.from(items).map((item, idx) => ({
    id: parseInt(item.dataset.productId),
    displayOrder: idx + 1
  }));
  
  try {
    const response = await axios.post('/api/admin/products/reorder', { orders });
    
    if (response.data.success) {
      // 로컬 products 배열도 업데이트
      orders.forEach(order => {
        const product = products.find(p => p.id === order.id);
        if (product) {
          product.displayOrder = order.displayOrder;
        }
      });
      
      alert('✅ 제품 순서가 저장되었습니다!\n\n변경된 제품: ' + orders.length + '개\n\n카테고리 페이지에서 새로운 순서로 표시됩니다.');
    } else {
      throw new Error(response.data.error || '저장 실패');
    }
  } catch (error) {
    console.error('순서 저장 실패:', error);
    alert('❌ 순서 저장에 실패했습니다: ' + (error.response?.data?.error || error.message));
  }
};

// 제품 순서 모달 닫기
window.closeProductOrderModal = function() {
  const modal = document.getElementById('product-order-modal');
  if (modal) {
    modal.remove();
  }
};

// 초기화 실행
init();
