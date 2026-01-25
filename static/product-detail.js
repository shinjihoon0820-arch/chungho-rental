// 제품 상세 페이지 (청호몰넷 스타일)

const app = document.getElementById('app');
const productId = window.location.pathname.split('/').pop();

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

// 초기 로딩 표시
app.innerHTML = `
  <div class="min-h-screen flex items-center justify-center overflow-x-hidden">
    <div class="text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
      <p class="text-gray-600">제품 정보를 불러오는 중...</p>
    </div>
  </div>
`;

// 제품 정보 가져오기
async function loadProductDetail() {
  try {
    // 제품 정보와 설정 동시에 가져오기
    const [productResponse, settingsResponse] = await Promise.all([
      axios.get(`/api/products/${productId}`),
      axios.get('/api/settings')
    ]);
    const product = productResponse.data;
    const settings = settingsResponse.data;
    
    // 전체 제품 공통 상세 이미지 가져오기
    const globalDetailImages = settings.globalProductDetailImages || {};
    const commonImages = [
      globalDetailImages.image1,
      globalDetailImages.image2,
      globalDetailImages.image3,
      globalDetailImages.image4
    ].filter(img => img && img.trim() !== '');
    
    // 물 타입 아이콘 생성
    const waterTypeIcons = {
      '정수': '💧',
      '냉수': '❄️',
      '온수': '🔥',
      '얼음': '🧊'
    };
    
    const waterTypesHTML = product.waterTypes 
      ? product.waterTypes.map(type => 
          `<span class="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm whitespace-nowrap">
            ${waterTypeIcons[type] || ''} ${type}
          </span>`
        ).join('')
      : '';
    
    // 색상/사이즈 옵션 HTML (매트리스는 사이즈로 표시)
    const options = product.options || {};
    const isMattress = product.subCategory === '매트리스';
    let colorOptionsHTML = '';
    
    if (options.colors && options.colors.length > 0) {
      if (isMattress) {
        // 매트리스: 사이즈 버튼 형태로 표시
        colorOptionsHTML = `
          <div class="mb-4">
            <div class="text-sm font-semibold text-gray-900 mb-3">사이즈</div>
            <div class="flex flex-wrap gap-2">
              ${options.colors.map((size, idx) => `
                <label class="cursor-pointer">
                  <input type="radio" name="option_size" value="${idx}" class="peer sr-only" ${idx === 0 ? 'checked' : ''} 
                         data-size-name="${size.name}"
                         data-image-index="${size.imageIndex !== undefined ? size.imageIndex : ''}"
                         onclick="changeMattressSize(this, ${JSON.stringify(options.sizeDetails || {}).replace(/"/g, '&quot;')})">
                  <div class="px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all
                              border-gray-200 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-600
                              hover:border-blue-400">
                    ${size.name}
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        // 일반 제품: 색상 원형 버튼
        colorOptionsHTML = `
          <div class="mb-4">
            <div class="text-sm font-semibold text-gray-900 mb-3">색상</div>
            <div class="flex gap-3">
              ${options.colors.map((color, idx) => `
                <label class="cursor-pointer relative group">
                  <input type="radio" name="option_color" value="${idx}" class="peer sr-only" ${idx === 0 ? 'checked' : ''} 
                         data-image-index="${color.imageIndex !== undefined ? color.imageIndex : ''}"
                         onclick="changeProductImage(this)">
                  <div class="w-8 h-8 rounded-full border-2 border-gray-200 peer-checked:border-blue-600 peer-checked:ring-2 peer-checked:ring-blue-100 transition-all flex items-center justify-center" style="background-color: ${color.code};">
                    <i class="fas fa-check text-white text-xs opacity-0 peer-checked:opacity-100 drop-shadow-md"></i>
                  </div>
                  <span class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-md border z-10">${color.name}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    // 프로모션 태그
    const promotionBadge = product.promotionTag 
      ? `<span class="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
          ${product.promotionTag}
        </span>`
      : '';
    
    app.innerHTML = `
      <!-- 네비게이션 -->
      <nav class="bg-white shadow-sm sticky top-0 z-50">
        <div class="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div class="flex items-center justify-between gap-2">
            <a href="/" class="flex items-center space-x-1 sm:space-x-2 text-blue-600 hover:text-blue-700 flex-shrink-0">
              <i class="fas fa-arrow-left text-sm"></i>
              <span class="font-semibold text-sm sm:text-base">목록으로</span>
            </a>
            <div class="text-xs sm:text-sm text-gray-600 truncate">
              <span class="font-semibold">${product.category}</span> > ${product.name}
            </div>
          </div>
        </div>
      </nav>

      <!-- 제품 상세 정보 -->
      <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="grid md:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8">
            <!-- 제품 이미지 -->
            <div class="relative w-full max-w-full">
              ${promotionBadge}
              <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative w-full" id="product-detail-slider">
                ${(() => {
                  const images = product.images || [product.image] || [];
                  const hasMultipleImages = images.length > 1;
                  
                  if (hasMultipleImages) {
                    return `
                      <!-- 이미지 슬라이더 -->
                      <div class="w-full h-full relative">
                        ${images.map((img, imgIdx) => `
                          <img src="${img || 'https://via.placeholder.com/600x600?text=No+Image'}" 
                               alt="${product.name} ${imgIdx + 1}" 
                               class="w-full h-full object-contain p-4 absolute top-0 left-0 transition-opacity duration-500 ${imgIdx === 0 ? 'opacity-100' : 'opacity-0'}"
                               data-detail-slider-img="${imgIdx}"
                               onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                        `).join('')}
                      </div>
                      
                      <!-- 이전/다음 버튼 -->
                      <button onclick="prevDetailImage()" class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full z-10">
                        <i class="fas fa-chevron-left"></i>
                      </button>
                      <button onclick="nextDetailImage()" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full z-10">
                        <i class="fas fa-chevron-right"></i>
                      </button>
                      
                      <!-- 슬라이더 인디케이터 -->
                      <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                        ${images.map((_, imgIdx) => `
                          <div class="w-3 h-3 rounded-full cursor-pointer ${imgIdx === 0 ? 'bg-blue-600' : 'bg-gray-300'}" 
                               data-detail-slider-indicator="${imgIdx}"
                               onclick="goToDetailImage(${imgIdx})"></div>
                        `).join('')}
                      </div>
                    `;
                  } else {
                    return `
                      <img src="${images[0] || 'https://via.placeholder.com/600x600?text=' + encodeURIComponent(product.name)}" 
                           alt="${product.name}" 
                           class="w-full h-full object-contain p-4"
                           onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                    `;
                  }
                })()}
              </div>
            </div>

            <!-- 제품 정보 -->
            <div class="space-y-4 sm:space-y-6">
              <!-- 모바일: 제공 물 타입 먼저 표시 (세로 스택) -->
              ${waterTypesHTML ? `
              <div class="sm:hidden">
                <div class="text-sm text-gray-600 mb-2">제공 물 타입</div>
                <div class="flex flex-wrap gap-2">
                  ${waterTypesHTML}
                </div>
              </div>
              ` : ''}
              
              <!-- 제품명 + 제공 물 타입 (PC: 가로 배치, 모바일: 세로 스택) -->
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div class="flex-1">
                  <div class="text-sm text-gray-600 mb-2">${product.category}</div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">${product.name}</h1>
                  <p class="text-base sm:text-lg text-gray-600">${product.description}</p>
                  
                  <!-- 렌탈료 표시 (description 아래) -->
                  <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mt-2">
                    ${(() => {
                      const originalPrice = parseInt(String(product.price).replace(/[^0-9]/g, '')) || 0;
                      const cardPrice = parseInt(String(product.cardPrice).replace(/[^0-9]/g, '')) || 0;
                      
                      // 할인가 = 대표 월렌탈료 - 제휴카드 가격
                      // 대표 월렌탈료 ≤ 제휴카드 가격이면 0원
                      let discountedPrice;
                      if (cardPrice > 0) {
                        discountedPrice = originalPrice > cardPrice ? originalPrice - cardPrice : 0;
                      } else {
                        // cardPrice가 없으면 자동 계산 (월렌탈료 - 17000)
                        const calculated = originalPrice - 17000;
                        discountedPrice = calculated > 0 ? calculated : 0;
                      }
                      const formattedOriginalPrice = formatPrice(originalPrice);
                      const formattedDiscountPrice = formatPrice(discountedPrice);
                      return `
                        <span class="text-xl sm:text-2xl font-bold text-blue-600">월 ${formattedDiscountPrice}원</span>
                        <span class="text-base sm:text-lg text-gray-400 line-through">${formattedOriginalPrice}원</span>
                      `;
                    })()}
                  </div>
                </div>
                
                <!-- 제공 물 타입 (정수기만) - PC에서만 오른쪽 상단 표시 -->
                ${waterTypesHTML ? `
                <div class="hidden sm:block flex-shrink-0 ml-4">
                  <div class="text-sm text-gray-600 mb-2 text-left">제공 물 타입</div>
                  <div class="flex flex-wrap gap-1">
                    ${waterTypesHTML}
                  </div>
                </div>
                ` : ''}
              </div>

              <!-- 색상 선택 -->
              ${colorOptionsHTML ? `
              <div class="border-t pt-4">
                ${colorOptionsHTML}
              </div>
              ` : ''}

              <!-- 제품 스펙 테이블 -->
              <div id="inline-spec-table" class="border-t pt-4"></div>

              <!-- 상세 요금표 -->
              <div id="inline-price-table" class="border-t pt-4"></div>

              <!-- 렌탈 신청 버튼 -->
              <button onclick="openRentalModal('${product.id}')" 
                      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition duration-200 shadow-lg">
                <i class="fas fa-file-alt mr-2"></i>렌탈 신청하기
              </button>

              <!-- 연락처 -->
              <div class="flex items-center justify-center space-x-4 pt-4 border-t">
                <a href="tel:${settings.phoneNumber || '1660-3128'}" class="flex items-center text-gray-600 hover:text-blue-600">
                  <i class="fas fa-phone mr-2"></i>
                  <span class="font-semibold">${settings.phoneNumber || '1660-3128'}</span>
                </a>
                <span class="text-gray-400">|</span>
                <a href="${settings.kakaoLink || '#'}" target="_blank" class="flex items-center text-gray-600 hover:text-yellow-500">
                  <i class="fas fa-comment mr-2"></i>
                  <span class="font-semibold">카카오톡 상담</span>
                </a>
              </div>
            </div>
          </div>

          <!-- 탭 영역 -->
          <div class="border-t">
            <div class="flex border-b">
              <button class="tab-button active px-8 py-4 font-semibold border-b-2 border-blue-600 text-blue-600" 
                      onclick="showTab('features')">
                제품 특징
              </button>
              <button class="tab-button px-8 py-4 font-semibold text-gray-600 hover:text-blue-600" 
                      onclick="showTab('info')">
                렌탈 안내
              </button>
            </div>

            <div class="p-8">
              <!-- 제품 특징 탭 -->
              <div id="features-tab" class="tab-content">
                <h3 class="text-xl font-bold mb-6">제품 특징</h3>
                <div class="space-y-4">
                  ${product.features.map((feature, idx) => `
                    <div class="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                        ${idx + 1}
                      </div>
                      <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-1">${feature}</h4>
                        <p class="text-gray-600 text-sm">청호나이스의 최신 기술이 적용된 ${feature} 기능입니다.</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 렌탈 안내 탭 -->
              <div id="info-tab" class="tab-content hidden">
                <h3 class="text-xl font-bold mb-6">렌탈 안내</h3>
                <div class="space-y-6">
                  ${(() => {
                    const guide = settings.rentalGuide || {};
                    const benefits = guide.benefits || { title: '렌탈 혜택', items: ['등록비 무료', '무상 A/S 제공', '정기 관리 서비스', '제휴카드 할인'] };
                    const contract = guide.contract || { title: '계약 안내', items: ['의무 사용 기간: 3년 또는 5년', '점검 주기: 2개월 또는 6개월', '소유권 이전: 계약 기간 종료 후'] };
                    const inquiry = guide.inquiry || { title: '문의 방법', items: [`전화 상담: ${settings.phoneNumber || '1660-3128'} (평일 09:00~18:00)`, `카카오톡: ${settings.kakaoId || '@청호나이스렌탈'}`, '온라인 상담: 렌탈 신청하기 버튼 클릭'] };
                    
                    return `
                      <div class="bg-blue-50 p-6 rounded-lg">
                        <h4 class="font-bold text-lg mb-3 text-blue-900">${benefits.title}</h4>
                        <ul class="space-y-2 text-gray-700">
                          ${benefits.items.map(item => `<li><i class="fas fa-check text-blue-600 mr-2"></i>${item}</li>`).join('')}
                        </ul>
                      </div>

                      <div class="bg-gray-50 p-6 rounded-lg">
                        <h4 class="font-bold text-lg mb-3 text-gray-900">${contract.title}</h4>
                        <ul class="space-y-2 text-gray-700">
                          ${contract.items.map(item => `<li><i class="fas fa-circle text-gray-400 text-xs mr-2"></i>${item}</li>`).join('')}
                        </ul>
                      </div>

                      <div class="bg-green-50 p-6 rounded-lg">
                        <h4 class="font-bold text-lg mb-3 text-green-900">${inquiry.title}</h4>
                        <ul class="space-y-2 text-gray-700">
                          ${inquiry.items.map(item => `<li><i class="fas fa-phone text-green-600 mr-2"></i>${item}</li>`).join('')}
                        </ul>
                      </div>
                    `;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 제품 상세 이미지 (공통 이미지 + 개별 제품 이미지) -->
        ${(commonImages.length > 0 || (product.detailImages && product.detailImages.length > 0)) ? `
          <div class="mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-8">
              <h2 class="text-2xl font-bold mb-6 text-center">제품 상세 정보</h2>
              <div class="space-y-0">
                <!-- 전체 제품 공통 상세 이미지 (상단에 먼저 표시) -->
                ${commonImages.map((imageUrl, idx) => `
                  <div class="w-full">
                    <img src="${imageUrl}" 
                         alt="공통 상세 이미지 ${idx + 1}" 
                         class="w-full h-auto"
                         onerror="this.style.display='none'">
                  </div>
                `).join('')}
                
                <!-- 개별 제품 상세 이미지 (공통 이미지 아래에 표시) -->
                ${product.detailImages && product.detailImages.length > 0 ? product.detailImages.map(imageUrl => `
                  <div class="w-full">
                    <img src="${imageUrl}" 
                         alt="${product.name} 상세 이미지" 
                         class="w-full h-auto"
                         onerror="this.style.display='none'">
                  </div>
                `).join('') : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 추천 제품 -->
        <div class="mt-12">
          <h2 class="text-2xl font-bold mb-6">이런 제품은 어때요?</h2>
          <div id="recommended-products" class="grid md:grid-cols-4 gap-6">
            <!-- JavaScript로 동적 생성 -->
          </div>
        </div>
      </div>

      <!-- 렌탈 신청 모달 -->
      <div id="rental-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-gray-900">렌탈 신청</h3>
              <button onclick="closeRentalModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>

            <form id="rental-form" class="space-y-4">
              <input type="hidden" id="modal-product-id" value="${product.id}">
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                <input type="text" id="modal-name" required 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처 *</label>
                <input type="tel" id="modal-phone" required 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="010-1234-5678">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">주소</label>
                <input type="text" id="modal-address" 
                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">문의사항</label>
                <textarea id="modal-message" rows="3" 
                          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
              </div>

              <button type="submit" 
                      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
                신청하기
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    // 제품 스펙 테이블 렌더링
    renderSpecTable(product);
    
    // 상세 요금표 렌더링
    renderPriceTable(product);

    // 추천 제품 로드
    loadRecommendedProducts(product.category);
    
  } catch (error) {
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <i class="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">제품을 찾을 수 없습니다</h2>
          <p class="text-gray-600 mb-6">요청하신 제품 정보를 불러올 수 없습니다.</p>
          <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            메인으로 돌아가기
          </a>
        </div>
      </div>
    `;
  }
}

// 제품 스펙 테이블 렌더링
function renderSpecTable(product) {
  const container = document.getElementById('inline-spec-table');
  if (!container) return;

  const isMattress = product.subCategory === '매트리스';
  const options = product.options || {};
  const sizeDetails = options.sizeDetails || {};
  const sizes = options.colors || [];
  
  // 매트리스: 사이즈별 스펙 표시
  if (isMattress && sizes.length > 0) {
    const firstSize = sizes[0]?.name || '';
    const firstDetail = sizeDetails[firstSize] || {};
    
    let specsRows = [
      { label: '모델명', value: product.modelName },
      { label: '선택 사이즈', value: `<span id="selected-size-display" class="font-semibold text-blue-600">${firstSize}</span>` },
      { label: '규격', value: `<span id="mattress-size-specs">${firstDetail.specs || product.size || '-'}</span>` },
      { label: '설명', value: `<span id="mattress-size-desc">${firstDetail.description || '-'}</span>` }
    ];
    
    // 기타 스펙 추가
    if (product.weight) specsRows.push({ label: '무게', value: product.weight });
    if (product.installationType) specsRows.push({ label: '설치방식', value: product.installationType });
    
    if (product.features && product.features.length > 0) {
      specsRows.push({ label: '주요 특징', value: product.features.join(', ') });
    }
    
    container.innerHTML = `
      <div class="text-sm text-gray-600 mb-2">제품 스펙</div>
      <table class="w-full text-sm border-collapse">
        <tbody>
          ${specsRows.filter(spec => spec.value).map(spec => `
            <tr class="border-b border-gray-100">
              <td class="py-2 text-gray-500 w-28">${spec.label}</td>
              <td class="py-2 text-gray-900">${spec.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    return;
  }

  // 일반 제품 스펙
  const specs = [
    { label: '모델명', value: product.modelName },
    { label: '크기', value: product.size },
    { label: '색상', value: product.colorList },
    { label: '용량/면적', value: product.specs },
    { label: '정수방식', value: product.purificationMethod },
    { label: '필터', value: product.filterType },
    { label: '냉각방식', value: product.coolingMethod },
    { label: '온수온도', value: product.hotWaterTemp },
    { label: '냉수온도', value: product.coldWaterTemp },
    { label: '소비전력', value: product.powerConsumption },
    { label: '적용면적', value: product.coverageArea },
    { label: 'CADR', value: product.cadr },
    { label: '무게', value: product.weight },
    { label: '설치방식', value: product.installationType },
    { label: '에너지등급', value: product.energyRating }
  ].filter(spec => spec.value && spec.value.trim() !== '');

  // 주요 특징도 스펙 테이블에 추가
  if (product.features && product.features.length > 0) {
    specs.push({ label: '주요 특징', value: product.features.join(', ') });
  }

  if (specs.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="text-sm text-gray-600 mb-2">제품 스펙</div>
    <table class="w-full text-sm border-collapse">
      <tbody>
        ${specs.map(spec => `
          <tr class="border-b border-gray-100">
            <td class="py-2 text-gray-500 w-28">${spec.label}</td>
            <td class="py-2 text-gray-900">${spec.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// 상세 요금표 렌더링
function renderPriceTable(product) {
  const container = document.getElementById('inline-price-table');
  if (!container) return;

  const isMattress = product.subCategory === '매트리스';
  const options = product.options || {};
  const sizeDetails = options.sizeDetails || {};
  const sizes = options.colors || [];
  
  // 매트리스: 첫 번째 사이즈의 요금표 표시
  if (isMattress && sizes.length > 0) {
    const firstSize = sizes[0]?.name || '';
    const firstDetail = sizeDetails[firstSize] || {};
    
    if (firstDetail.pricePolicies && firstDetail.pricePolicies.length > 0) {
      renderMattressPriceTable(firstDetail.pricePolicies);
      return;
    }
  }

  const pricePolicies = product.options?.pricePolicies || [];
  if (pricePolicies.length === 0) {
    container.innerHTML = '';
    return;
  }

  // 관리유형별로 그룹화
  const grouped = {};
  pricePolicies.forEach(policy => {
    const mgmt = policy.managementType || '방문관리';
    if (!grouped[mgmt]) grouped[mgmt] = [];
    grouped[mgmt].push(policy);
  });

  // 테이블 행 생성
  let rows = '';
  Object.entries(grouped).forEach(([mgmtType, policies]) => {
    policies.forEach((policy, idx) => {
      // 제휴카드 할인가 = 월렌탈료 - 제휴카드 가격
      // 월렌탈료 ≤ 제휴카드 가격이면 0원
      const originalPrice = policy.price || 0;
      const cardPrice = parseInt(policy.cardPrice) || 0;
      let discountedPrice;
      
      if (cardPrice > 0) {
        discountedPrice = originalPrice > cardPrice ? originalPrice - cardPrice : 0;
      } else {
        // cardPrice가 없으면 자동 계산: 월렌탈료 - 17,000원
        const calculated = originalPrice - 17000;
        discountedPrice = calculated > 0 ? calculated : 0;
      }
      rows += `
        <tr class="border-b border-gray-100">
          ${idx === 0 ? `<td class="py-2 text-gray-700 text-xs sm:text-sm" rowspan="${policies.length}">${mgmtType}</td>` : ''}
          <td class="py-2 text-gray-700 text-center text-xs sm:text-sm whitespace-nowrap">${policy.period || '-'}</td>
          <td class="py-2 text-gray-900 text-center font-semibold text-xs sm:text-sm whitespace-nowrap">${policy.price ? policy.price.toLocaleString() + '원' : '-'}</td>
          <td class="py-2 text-red-600 text-center font-semibold text-xs sm:text-sm whitespace-nowrap">${discountedPrice.toLocaleString() + '원'}</td>
        </tr>
      `;
    });
  });

  container.innerHTML = `
    <div class="text-sm text-gray-600 mb-2">상세 요금표</div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse min-w-[320px]">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="py-2 text-gray-600 font-medium text-left text-xs sm:text-sm">관리</th>
            <th class="py-2 text-gray-600 font-medium text-center text-xs sm:text-sm whitespace-nowrap">의무기간</th>
            <th class="py-2 text-gray-600 font-medium text-center text-xs sm:text-sm whitespace-nowrap">월 렌탈료</th>
            <th class="py-2 text-gray-600 font-medium text-center text-xs sm:text-sm whitespace-nowrap">제휴카드<br class="sm:hidden">할인시</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// 색상 변경 시 이미지 전환
window.changeProductImage = function(element) {
  const imageIndex = element.dataset.imageIndex;
  if (imageIndex === '' || imageIndex === undefined) return;
  
  const idx = parseInt(imageIndex);
  if (isNaN(idx)) return;
  
  // 슬라이더 이미지로 이동
  window.goToDetailImage(idx);
};

// 매트리스 사이즈 변경 시 스펙/요금표 업데이트
window.changeMattressSize = function(element, sizeDetails) {
  const sizeName = element.dataset.sizeName;
  const imageIndex = element.dataset.imageIndex;
  
  // 이미지 변경
  if (imageIndex !== '' && imageIndex !== undefined) {
    const idx = parseInt(imageIndex);
    if (!isNaN(idx)) {
      window.goToDetailImage(idx);
    }
  }
  
  // 사이즈별 상세 정보가 있으면 업데이트
  if (sizeDetails && sizeDetails[sizeName]) {
    const detail = sizeDetails[sizeName];
    
    // 스펙 업데이트
    const specsContainer = document.getElementById('mattress-size-specs');
    if (specsContainer) {
      specsContainer.textContent = detail.specs || '-';
    }
    
    // 설명 업데이트
    const descContainer = document.getElementById('mattress-size-desc');
    if (descContainer) {
      descContainer.textContent = detail.description || '-';
    }
    
    // 요금표 업데이트 (사이즈별 요금 정책이 있는 경우)
    if (detail.pricePolicies && detail.pricePolicies.length > 0) {
      renderMattressPriceTable(detail.pricePolicies);
    }
  }
  
  // 현재 선택된 사이즈 표시 업데이트
  const selectedSizeDisplay = document.getElementById('selected-size-display');
  if (selectedSizeDisplay) {
    selectedSizeDisplay.textContent = sizeName;
  }
};

// 매트리스 사이즈별 요금표 렌더링
function renderMattressPriceTable(pricePolicies) {
  const container = document.getElementById('inline-price-table');
  if (!container || !pricePolicies || pricePolicies.length === 0) return;

  // 관리유형별로 그룹화
  const grouped = {};
  pricePolicies.forEach(policy => {
    const mgmt = policy.managementType || '셀프';
    if (!grouped[mgmt]) grouped[mgmt] = [];
    grouped[mgmt].push(policy);
  });

  // 테이블 행 생성
  let rows = '';
  Object.entries(grouped).forEach(([mgmtType, policies]) => {
    policies.forEach((policy, idx) => {
      const originalPrice = policy.price || 0;
      const cardPrice = parseInt(policy.cardPrice) || 0;
      let discountedPrice;
      
      if (cardPrice > 0) {
        discountedPrice = originalPrice > cardPrice ? originalPrice - cardPrice : 0;
      } else {
        const calculated = originalPrice - 17000;
        discountedPrice = calculated > 0 ? calculated : 0;
      }
      
      rows += `
        <tr class="border-b border-gray-100">
          ${idx === 0 ? `<td class="py-2 text-gray-700 text-xs sm:text-sm" rowspan="${policies.length}">${mgmtType}</td>` : ''}
          <td class="py-2 text-gray-700 text-center text-xs sm:text-sm whitespace-nowrap">${policy.period || '-'}</td>
          <td class="py-2 text-gray-900 text-center font-semibold text-xs sm:text-sm whitespace-nowrap">${originalPrice ? originalPrice.toLocaleString() + '원' : '-'}</td>
          <td class="py-2 text-red-600 text-center font-semibold text-xs sm:text-sm whitespace-nowrap">${discountedPrice.toLocaleString() + '원'}</td>
        </tr>
      `;
    });
  });

  container.innerHTML = `
    <div class="text-sm text-gray-600 mb-2">상세 요금표</div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse min-w-[320px]">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="py-2 text-gray-600 font-medium text-left text-xs sm:text-sm">관리</th>
            <th class="py-2 text-gray-600 font-medium text-center text-xs sm:text-sm whitespace-nowrap">의무기간</th>
            <th class="py-2 text-gray-600 font-medium text-center text-xs sm:text-sm whitespace-nowrap">월 렌탈료</th>
            <th class="py-2 text-gray-600 font-medium text-center text-xs sm:text-sm whitespace-nowrap">제휴카드<br class="sm:hidden">할인시</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// 탭 전환
window.showTab = function(tabName) {
  // 모든 탭 버튼 비활성화
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
    btn.classList.add('text-gray-600');
  });
  
  // 모든 탭 컨텐츠 숨기기
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // 선택된 탭 활성화
  event.target.classList.add('active', 'border-blue-600', 'text-blue-600');
  event.target.classList.remove('text-gray-600');
  document.getElementById(`${tabName}-tab`).classList.remove('hidden');
};

// 렌탈 모달 열기
window.openRentalModal = function(productId) {
  document.getElementById('rental-modal').classList.remove('hidden');
  document.getElementById('modal-product-id').value = productId;
};

// 렌탈 모달 닫기
window.closeRentalModal = function() {
  document.getElementById('rental-modal').classList.add('hidden');
};

// 렌탈 신청 제출
document.addEventListener('submit', async (e) => {
  if (e.target.id === 'rental-form') {
    e.preventDefault();
    
    const formData = {
      productId: document.getElementById('modal-product-id').value,
      name: document.getElementById('modal-name').value,
      phone: document.getElementById('modal-phone').value,
      address: document.getElementById('modal-address').value,
      message: document.getElementById('modal-message').value
    };

    try {
      await axios.post('/api/applications', formData);
      alert('렌탈 신청이 완료되었습니다!\n담당자가 곧 연락드리겠습니다.');
      closeRentalModal();
      document.getElementById('rental-form').reset();
    } catch (error) {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }
});

// 추천 제품 로드 - 홈페이지 베스트 상품과 완전히 동일하게 표시
async function loadRecommendedProducts(category) {
  try {
    const container = document.getElementById('recommended-products');
    if (!container) return;
    
    // 설정과 전체 제품 목록 가져오기
    const [settingsResponse, productsResponse] = await Promise.all([
      axios.get('/api/settings'),
      axios.get('/api/products')
    ]);
    const settings = settingsResponse.data;
    const allProducts = productsResponse.data;
    const bestProductIds = settings.bestProductIds || [];
    
    // 홈페이지 베스트 상품과 완전히 동일하게 (bestProductIds 순서대로)
    const recommendedProducts = bestProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter(p => p); // null/undefined 제거
    
    if (recommendedProducts.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500 py-8">추천 제품이 없습니다.</p>';
      return;
    }
    
    // 홈페이지 베스트 상품과 동일한 스타일로 렌더링
    container.innerHTML = recommendedProducts.map((product, idx) => {
      const images = product.images && product.images.length > 0 ? product.images : [product.image];
      const mainImage = images[0] || 'https://via.placeholder.com/300x300?text=No+Image';
      
      return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-yellow-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative">
          <!-- 베스트 뱃지 -->
          <div class="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
            <i class="fas fa-crown mr-1"></i>BEST
          </div>
          
          <div class="aspect-square overflow-hidden bg-gray-100">
            <img src="${mainImage}" 
                 alt="${product.name}" 
                 class="w-full h-full object-contain p-4"
                 onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
          </div>
          
          <div class="p-4">
            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold mb-2">
              ${product.category}
            </span>
            <h3 class="text-lg font-bold text-gray-900 mb-1">${product.name}</h3>
            <p class="text-gray-500 text-xs mb-3">${product.subCategory || product.category}</p>
            
            <div class="flex items-baseline justify-between mb-3">
              <div>
                <span class="text-xl font-bold text-blue-600">${calculateDiscountedPrice(product).toLocaleString()}</span>
                <span class="text-sm text-gray-600">원/월</span>
              </div>
              ${product.promotionTag ? `
                <span class="text-xs px-2 py-1 bg-red-500 text-white rounded">${product.promotionTag}</span>
              ` : ''}
            </div>
            
            <a href="/product/${product.id}" 
               class="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 rounded-lg transition-all text-center text-sm">
              자세히 보기
            </a>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('추천 제품 로드 실패:', error);
  }
}

// 제품 상세 이미지 슬라이더 제어
let currentDetailImageIndex = 0;
let detailSliderInterval = null;

function startDetailSlider() {
  const images = document.querySelectorAll('[data-detail-slider-img]');
  if (images.length <= 1) return;
  
  detailSliderInterval = setInterval(() => {
    nextDetailImage();
  }, 4000); // 4초마다 자동 전환
}

function stopDetailSlider() {
  if (detailSliderInterval) {
    clearInterval(detailSliderInterval);
    detailSliderInterval = null;
  }
}

window.nextDetailImage = function() {
  const images = document.querySelectorAll('[data-detail-slider-img]');
  const indicators = document.querySelectorAll('[data-detail-slider-indicator]');
  
  if (images.length <= 1) return;
  
  // 현재 이미지 숨기기
  images[currentDetailImageIndex].classList.remove('opacity-100');
  images[currentDetailImageIndex].classList.add('opacity-0');
  indicators[currentDetailImageIndex].classList.remove('bg-blue-600');
  indicators[currentDetailImageIndex].classList.add('bg-gray-300');
  
  // 다음 이미지로 이동
  currentDetailImageIndex = (currentDetailImageIndex + 1) % images.length;
  
  // 다음 이미지 표시
  images[currentDetailImageIndex].classList.remove('opacity-0');
  images[currentDetailImageIndex].classList.add('opacity-100');
  indicators[currentDetailImageIndex].classList.remove('bg-gray-300');
  indicators[currentDetailImageIndex].classList.add('bg-blue-600');
};

window.prevDetailImage = function() {
  const images = document.querySelectorAll('[data-detail-slider-img]');
  const indicators = document.querySelectorAll('[data-detail-slider-indicator]');
  
  if (images.length <= 1) return;
  
  // 현재 이미지 숨기기
  images[currentDetailImageIndex].classList.remove('opacity-100');
  images[currentDetailImageIndex].classList.add('opacity-0');
  indicators[currentDetailImageIndex].classList.remove('bg-blue-600');
  indicators[currentDetailImageIndex].classList.add('bg-gray-300');
  
  // 이전 이미지로 이동
  currentDetailImageIndex = (currentDetailImageIndex - 1 + images.length) % images.length;
  
  // 이전 이미지 표시
  images[currentDetailImageIndex].classList.remove('opacity-0');
  images[currentDetailImageIndex].classList.add('opacity-100');
  indicators[currentDetailImageIndex].classList.remove('bg-gray-300');
  indicators[currentDetailImageIndex].classList.add('bg-blue-600');
};

window.goToDetailImage = function(index) {
  const images = document.querySelectorAll('[data-detail-slider-img]');
  const indicators = document.querySelectorAll('[data-detail-slider-indicator]');
  
  if (images.length <= 1 || index === currentDetailImageIndex) return;
  
  // 현재 이미지 숨기기
  images[currentDetailImageIndex].classList.remove('opacity-100');
  images[currentDetailImageIndex].classList.add('opacity-0');
  indicators[currentDetailImageIndex].classList.remove('bg-blue-600');
  indicators[currentDetailImageIndex].classList.add('bg-gray-300');
  
  // 선택된 이미지로 이동
  currentDetailImageIndex = index;
  
  // 선택된 이미지 표시
  images[currentDetailImageIndex].classList.remove('opacity-0');
  images[currentDetailImageIndex].classList.add('opacity-100');
  indicators[currentDetailImageIndex].classList.remove('bg-gray-300');
  indicators[currentDetailImageIndex].classList.add('bg-blue-600');
  
  // 자동 슬라이더 재시작
  stopDetailSlider();
  startDetailSlider();
};

// 페이지 로드 시 실행
loadProductDetail();

// 슬라이더 시작 (DOM 로드 후)
setTimeout(() => {
  startDetailSlider();
}, 500);
