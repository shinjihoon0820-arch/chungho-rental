// 관리자 로그인 페이지

// 이미 로그인되어 있으면 관리자 페이지로 이동
async function checkExistingAuth() {
  const token = localStorage.getItem('admin-token');
  if (token) {
    try {
      const response = await axios.get('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.valid) {
        window.location.href = '/admin';
        return;
      }
    } catch (error) {
      // 토큰이 유효하지 않으면 삭제
      localStorage.removeItem('admin-token');
    }
  }
}
checkExistingAuth();

const app = document.getElementById('app');

app.innerHTML = `
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <div class="text-center mb-8">
        <i class="fas fa-lock text-5xl text-blue-600 mb-4"></i>
        <h1 class="text-3xl font-bold text-gray-800">관리자 로그인</h1>
        <p class="text-gray-600 mt-2">청호나이스 렌탈 CMS</p>
      </div>
      
      <form id="login-form" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
          <input type="password" id="password" required 
                 class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="관리자 비밀번호를 입력하세요">
        </div>
        
        <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          로그인
        </button>
        
        <div class="text-center">
          <a href="/" class="text-sm text-gray-600 hover:text-gray-800">
            <i class="fas fa-arrow-left mr-1"></i>메인으로 돌아가기
          </a>
        </div>
      </form>
      
      <div id="error-message" class="hidden mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm"></div>
    </div>
  </div>
`;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  
  try {
    const response = await axios.post('/api/admin/login', { password });
    if (response.data.success) {
      localStorage.setItem('admin-token', response.data.token);
      window.location.href = '/admin';
    }
  } catch (error) {
    errorDiv.textContent = error.response?.data?.message || '로그인에 실패했습니다.';
    errorDiv.classList.remove('hidden');
  }
});
