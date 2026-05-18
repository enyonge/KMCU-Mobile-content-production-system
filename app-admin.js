/**
 * 관리자 기능: 대시보드, 전체 예약 관리, 이력 관리
 */

// ===== DASHBOARD =====
async function renderDashboard() {
  var el = document.getElementById('section-admin-dash');
  el.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>로딩 중...</p></div>';

  var r = await apiGet({ action: 'getReservations' });
  if (r.status !== 'success') {
    el.innerHTML = '<div class="empty-state"><p>⚠️ 데이터 로드 실패</p></div>';
    return;
  }
  App.reservations = r.data;
  var d = r.data;

  var cnt = {
    total: d.length,
    active: d.filter(function(r) { return r.status === '예약중'; }).length,
    changed: d.filter(function(r) { return r.status === '변경됨'; }).length,
    cancelled: d.filter(function(r) { return r.status === '취소'; }).length,
    returned: d.filter(function(r) { return r.status === '반납'; }).length
  };

  el.innerHTML =
    '<div class="stats-grid">' +
    '<div class="stat-card c-total"><div class="stat-icon">📊</div><div class="stat-number">' + cnt.total + '</div><div class="stat-label">전체</div></div>' +
    '<div class="stat-card c-active"><div class="stat-icon">📌</div><div class="stat-number">' + cnt.active + '</div><div class="stat-label">예약중</div></div>' +
    '<div class="stat-card c-changed"><div class="stat-icon">✏️</div><div class="stat-number">' + cnt.changed + '</div><div class="stat-label">변경됨</div></div>' +
    '<div class="stat-card c-cancelled"><div class="stat-icon">❌</div><div class="stat-number">' + cnt.cancelled + '</div><div class="stat-label">취소</div></div>' +
    '<div class="stat-card c-returned"><div class="stat-icon">✅</div><div class="stat-number">' + cnt.returned + '</div><div class="stat-label">반납</div></div>' +
    '</div>' +
    '<div class="card"><div class="card-header"><h2>📋 최근 예약</h2>' +
    '<div class="btn-group"><button class="btn btn-sm btn-success" onclick="downloadCSV()">📥 다운로드</button><button class="btn btn-sm btn-secondary" onclick="renderDashboard()">🔄 새로고침</button></div>' +
    '</div><div class="card-body">' + renderResTable(d.slice(-10).reverse()) + '</div></div>';
}

// ===== ADMIN ALL =====
var adminFilter = '';
var adminSearch = '';

async function renderAdminAll() {
  var el = document.getElementById('section-admin-all');
  el.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>로딩 중...</p></div>';

  var r = await apiGet({ action: 'getReservations' });
  if (r.status !== 'success') {
    el.innerHTML = '<div class="empty-state"><p>⚠️ 데이터 로드 실패</p></div>';
    return;
  }
  App.reservations = r.data;
  renderAdminAllUI(el);
}

function renderAdminAllUI(el) {
  var data = App.reservations;
  if (adminFilter) data = data.filter(function(r) { return r.status === adminFilter; });
  if (adminSearch) {
    var q = adminSearch.toLowerCase();
    data = data.filter(function(r) {
      return (r.name || '').toLowerCase().indexOf(q) >= 0
        || (r.deviceName || '').toLowerCase().indexOf(q) >= 0
        || String(r.employeeNo).indexOf(q) >= 0;
    });
  }

  data.sort(function(a, b) {
    var da = String(a.date || '').split(',')[0].trim();
    var db = String(b.date || '').split(',')[0].trim();
    if (da !== db) return da.localeCompare(db);
    
    var ta = String(a.times || '').split(',')[0].trim();
    var tb = String(b.times || '').split(',')[0].trim();
    return ta.localeCompare(tb);
  });

  var statuses = ['', '예약중', '변경됨', '취소', '반납', '시간종료'];
  var filterHtml = '';
  statuses.forEach(function(s) {
    var sel = s === adminFilter ? ' selected' : '';
    filterHtml += '<option value="' + s + '"' + sel + '>' + (s || '전체 상태') + '</option>';
  });

  el.innerHTML =
    '<div class="card"><div class="card-header"><h2>📋 전체 예약 관리 (' + data.length + '건)</h2>' +
    '<div class="btn-group"><button class="btn btn-sm btn-success" onclick="downloadCSV()">📥 다운로드</button><button class="btn btn-sm btn-secondary" onclick="renderAdminAll()">🔄</button></div></div>' +
    '<div class="card-body">' +
    '<div class="search-bar">' +
    '<input class="form-control" placeholder="검색 (이름/장비/사번)" value="' + adminSearch + '" oninput="adminSearch=this.value;renderAdminAllUI(document.getElementById(\'section-admin-all\'))">' +
    '<select class="form-control" onchange="adminFilter=this.value;renderAdminAllUI(document.getElementById(\'section-admin-all\'))">' + filterHtml + '</select>' +
    '</div>' +
    renderResTable(data) +
    '</div></div>';
}

function renderResTable(data) {
  if (!data || !data.length) return '<div class="empty-state"><p>데이터 없음</p></div>';

  var html = '<div class="table-wrapper"><table><thead><tr>' +
    '<th>장비</th><th>예약자</th><th>사번</th><th>실제사용자</th><th>날짜</th><th>시간</th><th>장소</th><th>교과목</th><th>상태</th><th>작업</th>' +
    '</tr></thead><tbody>';

  data.forEach(function(r) {
    var btns = '';
    if (r.status === '예약중' || r.status === '변경됨') {
      btns += '<button class="btn btn-sm btn-success" onclick="adminReturn(\'' + r.reservationId + '\')">반납</button>';
      btns += '<button class="btn btn-sm btn-danger" onclick="adminCancel(\'' + r.reservationId + '\')">취소</button>';
    }
    if (r.status === '취소' || r.status === '반납' || r.status === '시간종료') {
      btns += '<button class="btn btn-sm btn-danger" onclick="adminDelete(\'' + r.reservationId + '\')">삭제</button>';
    }

    html += '<tr>'
      + '<td>' + (r.deviceName || '') + '</td>'
      + '<td>' + (r.name || '') + '</td>'
      + '<td>' + maskEmpNo(r.employeeNo) + '</td>'
      + '<td>' + (r.actualUser || '') + '</td>'
      + '<td style="font-size:11px">' + (r.date || '') + '</td>'
      + '<td style="font-size:11px;max-width:120px;word-break:break-all">' + (r.times || '') + '</td>'
      + '<td style="font-size:11px">' + (r.location || '') + '</td>'
      + '<td style="font-size:11px">' + (r.subject || '') + '</td>'
      + '<td>' + badgeHtml(r.status) + '</td>'
      + '<td><div class="btn-group" style="flex-wrap:nowrap">' + btns + '</div></td>'
      + '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

async function adminReturn(id) {
  if (!confirm('반납 처리하시겠습니까?')) return;
  showLoading('반납 처리 중...');
  var r = await apiPost({ action: 'returnReservation', reservationId: id });
  hideLoading();
  if (r.status === 'success') { toast('반납 완료', 'success'); renderAdminAll(); }
  else toast(r.message || '실패', 'error');
}

async function adminCancel(id) {
  if (!confirm('취소 처리하시겠습니까?')) return;
  showLoading('취소 처리 중...');
  var r = await apiPost({ action: 'cancelReservation', reservationId: id, isAdmin: true });
  hideLoading();
  if (r.status === 'success') { toast('취소 완료', 'success'); renderAdminAll(); }
  else toast(r.message || '실패', 'error');
}

async function adminDelete(id) {
  if (!confirm('⚠️ 정말 삭제하시겠습니까? 복구 불가합니다.')) return;
  showLoading('삭제 중...');
  var r = await apiPost({ action: 'deleteReservation', reservationId: id });
  hideLoading();
  if (r.status === 'success') { toast('삭제 완료', 'success'); renderAdminAll(); }
  else toast(r.message || '실패', 'error');
}

// ===== ADMIN LOGS =====
var logFilter = '';

async function renderAdminLogs() {
  var el = document.getElementById('section-admin-logs');
  el.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>로딩 중...</p></div>';

  var r = await apiGet({ action: 'getLogs' });
  if (r.status !== 'success') {
    el.innerHTML = '<div class="empty-state"><p>⚠️ 로드 실패</p></div>';
    return;
  }
  App.logs = r.data;

  var actions = ['전체', '예약신청', '예약변경', '예약취소', '반납처리', '관리자수정', '시간종료', '데이터삭제'];
  var data = App.logs;
  if (logFilter && logFilter !== '전체') {
    data = data.filter(function(l) { return l.action === logFilter; });
  }

  var filterHtml = '';
  actions.forEach(function(a) {
    var cls = (logFilter || '전체') === a ? 'btn-primary' : 'btn-secondary';
    filterHtml += '<button class="btn btn-sm ' + cls + '" onclick="logFilter=\'' + a + '\';renderAdminLogs()">' + a + '</button>';
  });

  var tableHtml = '';
  if (data.length) {
    tableHtml = '<div class="table-wrapper"><table><thead><tr><th>일시</th><th>예약ID</th><th>구분</th><th>처리자</th><th>변경전</th><th>변경후</th><th>메모</th></tr></thead><tbody>';
    data.slice().reverse().slice(0, 100).forEach(function(l) {
      tableHtml += '<tr>'
        + '<td style="font-size:11px;white-space:nowrap">' + (l.createdAt || '') + '</td>'
        + '<td style="font-size:10px;font-family:monospace">' + String(l.reservationId || '').substring(0, 14) + '</td>'
        + '<td>' + badgeHtml(l.action || '') + '</td>'
        + '<td>' + (l.actor || '') + '</td>'
        + '<td style="font-size:10px;max-width:150px;word-break:break-all">' + String(l.beforeValue || '').substring(0, 60) + '</td>'
        + '<td style="font-size:10px;max-width:150px;word-break:break-all">' + String(l.afterValue || '').substring(0, 60) + '</td>'
        + '<td style="font-size:11px">' + (l.memo || '') + '</td>'
        + '</tr>';
    });
    tableHtml += '</tbody></table></div>';
  } else {
    tableHtml = '<div class="empty-state"><p>이력 데이터 없음</p></div>';
  }

  el.innerHTML =
    '<div class="card"><div class="card-header"><h2>📜 이력 관리 (' + data.length + '건)</h2>' +
    '<button class="btn btn-sm btn-secondary" onclick="renderAdminLogs()">🔄</button></div><div class="card-body">' +
    '<div style="margin-bottom:10px;display:flex;flex-wrap:wrap;gap:4px">' + filterHtml + '</div>' +
    tableHtml + '</div></div>';
}
