/* =========================================================
   이벤트 내용 저장/불러오기 처리기 (Cloudflare Pages Function)
   ★ 이 파일은 저장소의  functions/api/event.js  경로에 두어야 합니다.
   ★ 아래 ADMIN_PW 의 값을 본인 비밀번호로 바꾸세요.
     (이 파일은 화면에 안 보이는 서버 코드라, 여기 적은 암호는 외부에 노출되지 않습니다.)
   ========================================================= */

const ADMIN_PW = "admin1234";   // ← 이 따옴표 안의 글자만 본인 암호로 바꾸세요

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, CORS)
  });
}

// 미리보기 요청(OPTIONS) 응답
export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

// 내용 불러오기 (누구나 읽기 가능 - 이벤트 페이지가 사용)
export async function onRequestGet(context) {
  try {
    const v = await context.env.EVENT_KV.get("eventPage");
    return new Response(v || "{}", {
      headers: Object.assign({ "Content-Type": "application/json" }, CORS)
    });
  } catch (e) {
    return json({}, 200);
  }
}

// 내용 저장하기 (비밀번호 필요 - 미니 관리자가 사용)
export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return json({ ok: false, error: "형식 오류" }, 400);
  }
  if (!body || body.password !== ADMIN_PW) {
    return json({ ok: false, error: "비밀번호가 올바르지 않습니다." }, 401);
  }
  if (!body.eventPage || typeof body.eventPage !== "object") {
    return json({ ok: false, error: "저장할 내용이 없습니다." }, 400);
  }
  try {
    await context.env.EVENT_KV.put("eventPage", JSON.stringify(body.eventPage));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: "저장 실패" }, 500);
  }
}
