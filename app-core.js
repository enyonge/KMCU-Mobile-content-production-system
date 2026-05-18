/**
 * 계명문화대학교 이동형 콘텐츠 제작 시스템 관리 - Core
 */
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6nIFMHy2nZIMFMuX0uxgh8hYuMutz5VLBxtPk-n9Bd8rpJ0FTr8bRBnpCk4TIJ7eC/exec';
var ADMIN_PW = '7365';
var App = { section: 'home', isAdmin: false, reservations: [], logs: [] };

var DEVICES = [
  { id: 'sys1', name: '시스템 #1 (163번)' },
  { id: 'sys2', name: '시스템 #2 (164번)' }
];

var TIME_SLOTS = [];
for (var i = 9; i < 20; i++) {
  var s = String(i).padStart(2, '0');
  var e = String(i + 1).padStart(2, '0');
  TIME_SLOTS.push(s + ':00~' + e + ':00');
}

var LOCATIONS = [
  '사회과학관 식품조리실(3321)',
  '사회과학관 식품화학미생물실험실(3217)',
  '사회과학관 강의실(3216)',
  '사회과학관 EMR실습실(3315)',
  '쉐턱관 작업치료평가실습실(1102)',
  '쉐턱관 디지털 헬스케어 융합실습센터(1411)',
  '기타(직접입력)'
];

var SUBJECTS = ['교양수업', '전공수업', '행사', '특강', '기타(직접입력)'];

// ===== API =====
async function apiGet(params) {
  var url = new URL(APPS_SCRIPT_URL);
  Object.keys(params).forEach(function(k) { url.searchParams.append(k, params[k]); });
  try {
    var res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
    var text = await res.text();
    try { return JSON.parse(text); }
    catch (pe) { console.error('Parse error:', text.substring(0, 200)); return { status: 'error', message: '서버 응답 파싱 실패' }; }
  } catch (err) {
    console.warn('API GET 오류:', err.message);
    return { status: 'error', message: '서버 통신 오류' };
  }
}

async function apiPost(data) {
  var url = new URL(APPS_SCRIPT_URL);
  url.searchParams.append('action', data.action);
  url.searchParams.append('payload', JSON.stringify(data));
  try {
    var res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
    var text = await res.text();
    try { return JSON.parse(text); }
    catch (pe) { console.error('Parse error:', text.substring(0, 200)); return { status: 'error', message: '서버 응답 파싱 실패' }; }
  } catch (err) {
    console.warn('API POST 오류:', err.message);
    return { status: 'error', message: '서버 통신 오류' };
  }
}

// ===== UI Helpers =====
function toast(msg, type) {
  type = type || 'info';
  var c = document.getElementById('toastContainer');
  var t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() { t.remove(); }, 3800);
}

function showLoading(msg) {
  var el = document.getElementById('loadingOverlay');
  el.querySelector('.loading-text').textContent = msg || '처리 중...';
  el.classList.add('show');
}
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function maskEmpNo(n) {
  var s = String(n);
  return s.length <= 2 ? s : s.substring(0, 2) + new Array(s.length - 1).join('*');
}

function todayStr() {
  var d = new Date();
  var opts = { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' };
  var parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(d);
  var y = '', m = '', day = '';
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].type === 'year') y = parts[i].value;
    if (parts[i].type === 'month') m = parts[i].value;
    if (parts[i].type === 'day') day = parts[i].value;
  }
  return y + '-' + m + '-' + day;
}

function badgeHtml(status) {
  return '<span class="badge badge-' + status + '">' + status + '</span>';
}

// ===== Navigation =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById('section-' + name);
  if (el) el.classList.add('active');
  App.section = name;
  document.querySelectorAll('.nav-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.section === name);
  });
  if (typeof renderSection === 'function') renderSection(name);
}

function setupNav() {
  var tabs;
  if (App.isAdmin) {
    tabs = [
      { section: 'admin-dash', label: '📊 대시보드' },
      { section: 'admin-all', label: '📋 전체 예약' },
      { section: 'admin-logs', label: '📜 이력 관리' }
    ];
  } else {
    tabs = [
      { section: 'home', label: '🏠 홈' },
      { section: 'reserve', label: '📝 예약 신청' },
      { section: 'status', label: '📋 예약 현황' },
      { section: 'modify', label: '✏️ 예약 변경' },
      { section: 'cancel', label: '❌ 예약 취소' }
    ];
  }
  var nav = document.getElementById('navInner');
  var html = '';
  tabs.forEach(function(t) {
    var active = t.section === App.section ? ' active' : '';
    html += '<button class="nav-tab' + active + '" data-section="' + t.section + '" onclick="showSection(\'' + t.section + '\')">' + t.label + '</button>';
  });
  nav.innerHTML = html;
}

// ===== Admin Auth =====
function promptLogin() { openModal('loginModal'); document.getElementById('adminPw').value = ''; }
function doLogin() {
  if (document.getElementById('adminPw').value === ADMIN_PW) {
    App.isAdmin = true;
    closeModal('loginModal');
    setupNav();
    document.getElementById('adminToggle').style.display = 'none';
    document.getElementById('adminLogout').style.display = 'inline-flex';
    document.getElementById('adminBadge').style.display = 'inline-flex';
    showSection('admin-dash');
    toast('관리자 모드로 전환되었습니다', 'success');
  } else {
    toast('비밀번호가 올바르지 않습니다', 'error');
  }
}
function doLogout() {
  App.isAdmin = false;
  setupNav();
  document.getElementById('adminToggle').style.display = 'inline-flex';
  document.getElementById('adminLogout').style.display = 'none';
  document.getElementById('adminBadge').style.display = 'none';
  showSection('home');
  toast('로그아웃 되었습니다', 'info');
}

// ===== CSV Download =====
function downloadCSV() {
  if (!App.reservations.length) { toast('데이터가 없습니다', 'warning'); return; }
  var headers = ['예약번호', '장비', '예약자', '사번', '실제사용자', '날짜', '시간', '장소', '교과목', '상태', '신청일'];
  var rows = App.reservations.map(function(r) {
    return [r.reservationId, r.deviceName, r.name, r.employeeNo, r.actualUser, r.date, r.times, r.location, r.subject, r.status, r.createdAt];
  });
  var csv = '\uFEFF' + headers.join(',') + '\n';
  rows.forEach(function(row) {
    csv += row.map(function(c) { return '"' + String(c || '').replace(/"/g, '""') + '"'; }).join(',') + '\n';
  });
  var today = todayStr().replace(/-/g, '');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '계명문화대학교_예약현황_' + today + '.csv';
  link.click();
  toast('다운로드 완료', 'success');
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  setupNav();
  document.getElementById('adminLogout').style.display = 'none';
  document.getElementById('adminBadge').style.display = 'none';
  showSection('home');
});
