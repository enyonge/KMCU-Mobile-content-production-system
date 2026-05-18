/**
 * 사용자 기능: 홈, 예약 신청, 예약 현황, 예약 변경, 예약 취소
 */

// ===== Section Renderer =====
function renderSection(name) {
  if (name === 'home') renderHome();
  if (name === 'reserve') renderReserve();
  if (name === 'status') renderStatus();
  if (name === 'modify') renderModify();
  if (name === 'cancel') renderCancel();
  if (name === 'admin-dash') renderDashboard();
  if (name === 'admin-all') renderAdminAll();
  if (name === 'admin-logs') renderAdminLogs();
}

// ===== HOME =====
function renderHome() {
  var el = document.getElementById('section-home');
  el.innerHTML =
    '<div class="card"><div class="card-header"><h2>📹 이동형 콘텐츠 제작 시스템</h2></div><div class="card-body">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
    '<div class="card" style="margin:0;cursor:pointer" onclick="showSection(\'reserve\')">' +
    '<div style="text-align:center;padding:30px;background:linear-gradient(135deg,var(--wine-bg),#f0e0e3);border-radius:var(--radius) var(--radius) 0 0"><div style="font-size:48px">📹</div></div>' +
    '<div class="card-body" style="text-align:center"><h3 style="font-size:14px;color:var(--wine);margin-bottom:4px">시스템 #1 (163번)</h3><p style="font-size:12px;color:var(--text-light)">📍 보관 위치: 작업치료과 사무실</p></div></div>' +
    '<div class="card" style="margin:0;cursor:pointer" onclick="showSection(\'reserve\')">' +
    '<div style="text-align:center;padding:30px;background:linear-gradient(135deg,var(--wine-bg),#f0e0e3);border-radius:var(--radius) var(--radius) 0 0"><div style="font-size:48px">📹</div></div>' +
    '<div class="card-body" style="text-align:center"><h3 style="font-size:14px;color:var(--wine);margin-bottom:4px">시스템 #2 (164번)</h3><p style="font-size:12px;color:var(--text-light)">📍 보관 위치: 식품영양과 사무실</p></div></div>' +
    '</div></div></div>' +
    // 이용안내 공지 박스
    '<div class="card" style="border-left:4px solid var(--wine)"><div class="card-header"><h2>📢 이용안내</h2></div><div class="card-body">' +
    '<p style="font-weight:600;color:var(--wine);margin-bottom:10px">본 이동형 콘텐츠 제작 시스템은 학내 교육 및 실습 목적으로만 사용 가능합니다.</p>' +
    '<ul style="padding-left:18px;line-height:2;color:var(--text);font-size:13px">' +
    '<li><b>시스템 #1 (163번)</b>은 <b>쉐턱관</b> 내에서만 사용 가능합니다.</li>' +
    '<li><b>시스템 #2 (164번)</b>은 <b>사회과학관</b> 내에서만 사용 가능합니다.</li>' +
    '<li>지정된 건물 외부로 장비를 <b>반출할 수 없습니다.</b></li>' +
    '<li>사용 후 반드시 <b>원래 보관 위치</b>로 반납해주세요.</li>' +
    '<li>관리자 승인 없이 임의 이동 또는 외부 반출은 <b style="color:var(--danger)">불가</b>합니다.</li>' +
    '</ul></div></div>' +
    // 기본 이용 안내
    '<div class="card"><div class="card-header"><h2>ℹ️ 예약 안내</h2></div><div class="card-body">' +
    '<ul style="padding-left:18px;line-height:2;color:var(--text-light);font-size:13px">' +
    '<li><b>본교 구성원</b>만 예약 가능합니다.</li>' +
    '<li>장비 선택 후 원하는 <b>날짜와 시간</b>을 선택하세요.</li>' +
    '<li>다중 날짜 예약이 가능합니다.</li>' +
    '<li>예약 변경/취소는 <b>예약번호 + 성함 + 사번</b>으로 본인 확인 후 가능합니다.</li>' +
    '<li>사용 후 반드시 <b>원래 보관 위치</b>에 반납해주세요.</li>' +
    '</ul></div></div>';
}

// ===== RESERVE =====
var selectedDates = [];

function renderReserve() {
  var el = document.getElementById('section-reserve');

  // Device radio
  var deviceHtml = '';
  DEVICES.forEach(function(d) {
    deviceHtml += '<label class="radio-item"><input type="radio" name="rDevice" value="' + d.id + '" data-name="' + d.name + '"><span>' + d.name + '</span></label>';
  });

  // Location options
  var locHtml = '<option value="">선택</option>';
  LOCATIONS.forEach(function(l) {
    locHtml += '<option value="' + l + '">' + l + '</option>';
  });

  // Subject options
  var subHtml = '<option value="">선택</option>';
  SUBJECTS.forEach(function(s) {
    subHtml += '<option value="' + s + '">' + s + '</option>';
  });

  // Time checkboxes
  var timeHtml = '';
  TIME_SLOTS.forEach(function(t) {
    timeHtml += '<label class="checkbox-item"><input type="checkbox" name="rTime" value="' + t + '"><span>' + t + '</span></label>';
  });

  selectedDates = [];

  el.innerHTML =
    '<div class="card"><div class="card-header"><h2>📝 예약 신청</h2></div><div class="card-body">' +
    // 장비 선택
    '<div class="form-group"><label class="form-label">장비 선택 <span class="req">*</span></label>' +
    '<div class="checkbox-group">' + deviceHtml + '</div></div>' +
    // 예약자 / 사번
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">예약자 성함 <span class="req">*</span></label><input class="form-control" id="rName" placeholder="성함"></div>' +
    '<div class="form-group"><label class="form-label">사번 <span class="req">*</span></label><input class="form-control" id="rEmpNo" placeholder="사번"></div>' +
    '</div>' +
    // 실제 사용자
    '<div class="form-group">' +
    '<label class="checkbox-item" style="border:none;padding:0"><input type="checkbox" id="rDiffUser" onchange="toggleDiffUser()"><span style="font-size:13px">실제 사용자가 신청자와 다릅니다</span></label>' +
    '<div id="rActualArea" style="display:none;margin-top:6px"><label class="form-label">실제 사용자 <span class="req">*</span></label><input class="form-control" id="rActualUser" placeholder="실제 사용자 성함"></div>' +
    '</div>' +
    // 날짜
    '<div class="form-group"><label class="form-label">사용 날짜 <span class="req">*</span> (다중 선택 가능)</label>' +
    '<div style="display:flex;gap:8px;align-items:end"><input type="date" class="form-control" id="rDate" min="' + todayStr() + '" style="max-width:200px">' +
    '<button class="btn btn-secondary btn-sm" onclick="addDate()">+ 날짜 추가</button></div>' +
    '<div class="date-tags" id="dateTags"></div></div>' +
    // 시간
    '<div class="form-group"><label class="form-label">사용 시간 <span class="req">*</span> (다중 선택 가능)</label>' +
    '<div class="checkbox-group">' + timeHtml + '</div></div>' +
    // 장소 / 교과목
    '<div class="form-row">' +
    '<div class="form-group"><label class="form-label">사용 장소 <span class="req">*</span></label>' +
    '<select class="form-control" id="rLocation" onchange="toggleLocCustom()">' + locHtml + '</select>' +
    '<input class="form-control" id="rLocCustom" placeholder="어디에서 사용할 예정인지 입력해주세요" style="display:none;margin-top:6px"></div>' +
    '<div class="form-group"><label class="form-label">활용 구분 <span class="req">*</span></label>' +
    '<select class="form-control" id="rSubject" onchange="toggleSubjectDetail()">' + subHtml + '</select>' +
    '<div id="rSubjectDetailArea" style="display:none;margin-top:6px"><label class="form-label" style="font-size:11px" id="rSubjectDetailLabel">세부 내용 (교과목명/행사명) <span class="req">*</span></label><input class="form-control" id="rSubjectDetail" placeholder="예: 펫푸드위생학"></div></div>' +
    '</div>' +
    // 이용안내 확인 체크박스
    '<div style="margin-top:20px;padding:14px 16px;background:var(--wine-bg);border:1.5px solid var(--border);border-radius:var(--radius-sm)">' +
    '<label class="checkbox-item" style="border:none;padding:0;cursor:pointer"><input type="checkbox" id="rAgree"><span style="font-size:13px;font-weight:600;color:var(--wine)">이용안내 및 반출 제한 규정을 확인했습니다.</span></label>' +
    '</div>' +
    // 제출
    '<div style="text-align:center;margin-top:24px"><button class="btn btn-primary btn-lg" onclick="submitReservation()">📩 예약 신청하기</button></div>' +
    '</div></div>';
}

function toggleDiffUser() {
  document.getElementById('rActualArea').style.display = document.getElementById('rDiffUser').checked ? 'block' : 'none';
}
function toggleLocCustom() {
  document.getElementById('rLocCustom').style.display = document.getElementById('rLocation').value === '기타(직접입력)' ? 'block' : 'none';
}
function toggleSubjectDetail() {
  var val = document.getElementById('rSubject').value;
  document.getElementById('rSubjectDetailArea').style.display = (val !== '') ? 'block' : 'none';
  var inp = document.getElementById('rSubjectDetail');
  var label = document.getElementById('rSubjectDetailLabel');
  if (val === '기타(직접입력)') {
    inp.placeholder = '사용 목적을 직접 입력해주세요';
    label.innerHTML = '사용 목적 <span class="req">*</span>';
  } else if (val === '교양수업' || val === '전공수업') {
    inp.placeholder = '교과목명을 입력해주세요 (예: 펫푸드위생학)';
    label.innerHTML = '세부 내용 (교과목명) <span class="req">*</span>';
  } else if (val === '행사') {
    inp.placeholder = '행사명을 입력해주세요 (예: 학과 홍보 콘텐츠 촬영)';
    label.innerHTML = '세부 내용 (행사명) <span class="req">*</span>';
  } else if (val === '특강') {
    inp.placeholder = '특강명을 입력해주세요 (예: AI 콘텐츠 제작 특강)';
    label.innerHTML = '세부 내용 (특강명) <span class="req">*</span>';
  } else {
    inp.placeholder = '교과목명 또는 행사명을 입력해주세요';
    label.innerHTML = '세부 내용 (교과목명/행사명) <span class="req">*</span>';
  }
  inp.value = '';
}

function addDate() {
  var input = document.getElementById('rDate');
  var val = input.value;
  if (!val) { toast('날짜를 선택해주세요', 'warning'); return; }
  if (selectedDates.indexOf(val) >= 0) { toast('이미 추가된 날짜입니다', 'warning'); return; }
  selectedDates.push(val);
  selectedDates.sort();
  renderDateTags();
  input.value = '';
}

function removeDate(idx) {
  selectedDates.splice(idx, 1);
  renderDateTags();
}

function renderDateTags() {
  var container = document.getElementById('dateTags');
  var html = '';
  selectedDates.forEach(function(d, i) {
    html += '<span class="date-tag">' + d + ' <span class="date-tag-remove" onclick="removeDate(' + i + ')">×</span></span>';
  });
  container.innerHTML = html;
}

async function submitReservation() {
  // 이용안내 확인
  if (!document.getElementById('rAgree').checked) { toast('이용안내 및 반출 제한 규정을 확인해주세요.', 'warning'); return; }

  // 장비
  var deviceRadio = document.querySelector('input[name="rDevice"]:checked');
  if (!deviceRadio) { toast('장비를 선택해주세요', 'warning'); return; }
  var deviceId = deviceRadio.value;
  var deviceName = deviceRadio.dataset.name;

  // 기본 정보
  var name = document.getElementById('rName').value.trim();
  var empNo = document.getElementById('rEmpNo').value.trim();
  if (!name || !empNo) { toast('예약자 성함과 사번을 입력해주세요', 'warning'); return; }

  // 실제 사용자
  var actualUser = name;
  if (document.getElementById('rDiffUser').checked) {
    actualUser = document.getElementById('rActualUser').value.trim();
    if (!actualUser) { toast('실제 사용자를 입력해주세요', 'warning'); return; }
  }

  // 날짜
  if (!selectedDates.length) { toast('사용 날짜를 추가해주세요', 'warning'); return; }

  // 시간
  var times = [];
  document.querySelectorAll('input[name="rTime"]:checked').forEach(function(c) { times.push(c.value); });
  if (!times.length) { toast('사용 시간을 선택해주세요', 'warning'); return; }

  // 장소
  var locVal = document.getElementById('rLocation').value;
  if (!locVal) { toast('사용 장소를 선택해주세요', 'warning'); return; }
  if (locVal === '기타(직접입력)') {
    locVal = document.getElementById('rLocCustom').value.trim();
    if (!locVal) { toast('장소를 입력해주세요', 'warning'); return; }
  }

  // 교과목
  var subjectVal = document.getElementById('rSubject').value;
  if (!subjectVal) { toast('활용 구분을 선택해주세요', 'warning'); return; }
  var subjectFull = subjectVal;
  if (subjectVal === '기타(직접입력)') {
    var detail = document.getElementById('rSubjectDetail').value.trim();
    if (!detail) { toast('사용 목적을 입력해주세요', 'warning'); return; }
    subjectFull = detail;
  } else {
    var detail2 = document.getElementById('rSubjectDetail').value.trim();
    if (!detail2) { toast('세부 내용(교과목명/행사명)을 입력해주세요', 'warning'); return; }
    subjectFull = subjectVal + ' - ' + detail2;
  }

  // 중복 확인
  showLoading('중복 확인 중...');
  var dup = await apiGet({
    action: 'checkDuplicate',
    deviceId: deviceId,
    date: selectedDates.join(', '),
    times: times.join(', ')
  });
  if (dup.duplicate) { hideLoading(); toast(dup.message, 'error'); return; }

  // 예약 등록
  showLoading('예약 등록 중...');
  var res = await apiPost({
    action: 'createReservation',
    deviceId: deviceId,
    deviceName: deviceName,
    name: name,
    employeeNo: empNo,
    actualUser: actualUser,
    date: selectedDates.join(', '),
    times: times.join(', '),
    location: locVal,
    subject: subjectFull
  });
  hideLoading();

  if (res.status === 'success') {
    toast(res.message + ' (예약번호: ' + res.reservationId + ')', 'success');
    showSection('status');
  } else {
    toast(res.message || '예약 실패', 'error');
  }
}

// ===== STATUS =====
async function renderStatus() {
  var el = document.getElementById('section-status');
  el.innerHTML = '<div class="card"><div class="card-header"><h2>📋 예약 현황 (유효한 예약만 표시)</h2></div><div class="card-body"><div class="empty-state"><div class="spinner"></div><p>로딩 중...</p></div></div></div>';

  var r = await apiGet({ action: 'getReservations', mode: 'user' });
  if (r.status !== 'success') {
    el.querySelector('.card-body').innerHTML = '<div class="empty-state"><p>⚠️ 데이터를 불러올 수 없습니다.</p></div>';
    return;
  }

  var data = r.data;
  if (!data || !data.length) {
    el.querySelector('.card-body').innerHTML = '<div class="empty-state"><p>현재 유효한 예약이 없습니다.</p></div>';
    return;
  }

  data.sort(function(a, b) {
    var da = String(a.date || '').split(',')[0].trim();
    var db = String(b.date || '').split(',')[0].trim();
    if (da !== db) return da.localeCompare(db);
    
    var ta = String(a.times || '').split(',')[0].trim();
    var tb = String(b.times || '').split(',')[0].trim();
    return ta.localeCompare(tb);
  });

  var html = '<div class="table-wrapper"><table><thead><tr><th>장비</th><th>예약자</th><th>사번</th><th>실제 사용자</th><th>날짜</th><th>시간</th><th>장소</th><th>교과목</th><th>상태</th></tr></thead><tbody>';
  data.forEach(function(r) {
    html += '<tr>'
      + '<td>' + (r.deviceName || '') + '</td>'
      + '<td>' + (r.name || '') + '</td>'
      + '<td>' + maskEmpNo(r.employeeNo) + '</td>'
      + '<td>' + (r.actualUser || '') + '</td>'
      + '<td style="font-size:11px">' + (r.date || '') + '</td>'
      + '<td style="font-size:11px">' + (r.times || '') + '</td>'
      + '<td>' + (r.location || '') + '</td>'
      + '<td>' + (r.subject || '') + '</td>'
      + '<td>' + badgeHtml(r.status) + '</td>'
      + '</tr>';
  });
  html += '</tbody></table></div>';
  el.querySelector('.card-body').innerHTML = html;
}

// ===== MODIFY =====
function renderModify() {
  var el = document.getElementById('section-modify');
  // Time checkboxes for modal
  var timeHtml = '';
  TIME_SLOTS.forEach(function(t) {
    timeHtml += '<label class="checkbox-item"><input type="checkbox" name="modTime" value="' + t + '"><span>' + t + '</span></label>';
  });
  document.getElementById('modTimesContainer').innerHTML = timeHtml;

  el.innerHTML =
    '<div class="card"><div class="card-header"><h2>✏️ 예약 변경</h2></div><div class="card-body">' +
    '<p style="color:var(--text-light);font-size:13px;margin-bottom:14px">예약 변경을 위해 본인 확인이 필요합니다.</p>' +
    '<div class="form-row" style="grid-template-columns:1fr 1fr 1fr">' +
    '<div class="form-group"><label class="form-label">예약번호</label><input class="form-control" id="modResId" placeholder="예약번호"></div>' +
    '<div class="form-group"><label class="form-label">성함</label><input class="form-control" id="modName" placeholder="성함"></div>' +
    '<div class="form-group"><label class="form-label">사번</label><input class="form-control" id="modEmpNo" placeholder="사번"></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="findReservation(\'modify\')">🔍 조회</button>' +
    '<div id="modResult" style="margin-top:16px"></div>' +
    '</div></div>';
}

async function findReservation(mode) {
  var prefix = mode === 'modify' ? 'mod' : 'can';
  var resId = document.getElementById(prefix + 'ResId').value.trim();
  var name = document.getElementById(prefix + 'Name').value.trim();
  var empNo = document.getElementById(prefix + 'EmpNo').value.trim();

  if (!resId || !name || !empNo) { toast('모든 항목을 입력해주세요', 'warning'); return; }

  showLoading('조회 중...');
  var r = await apiGet({ action: 'getReservations' });
  hideLoading();

  if (r.status !== 'success') { toast('조회 실패', 'error'); return; }

  var found = null;
  (r.data || []).forEach(function(row) {
    if (String(row.reservationId) === resId && String(row.name) === name && String(row.employeeNo) === String(empNo)) {
      found = row;
    }
  });

  var container = document.getElementById(prefix + 'Result');
  if (!found) {
    container.innerHTML = '<div class="empty-state"><p>일치하는 예약을 찾을 수 없습니다.</p></div>';
    return;
  }

  if (found.status === '취소' || found.status === '반납' || found.status === '시간종료') {
    container.innerHTML = '<div class="empty-state"><p>이미 ' + found.status + ' 처리된 예약입니다.</p></div>';
    return;
  }

  if (mode === 'modify') {
    container.innerHTML =
      '<div class="card" style="border-left:4px solid var(--wine)"><div class="card-body" style="padding:14px">' +
      '<div style="margin-bottom:8px"><strong>' + (found.deviceName || '') + '</strong> ' + badgeHtml(found.status) + '</div>' +
      '<div style="font-size:12px;color:var(--text-light)">📅 ' + (found.date || '') + ' | ⏰ ' + (found.times || '') + '</div>' +
      '<div style="font-size:12px;color:var(--text-light)">📍 ' + (found.location || '') + ' | 📚 ' + (found.subject || '') + '</div>' +
      '<div style="margin-top:10px"><button class="btn btn-warning btn-sm" onclick="openModifyModal()">변경하기</button></div>' +
      '</div></div>';
    App.editRes = { id: resId, name: name, empNo: empNo };
  } else {
    container.innerHTML =
      '<div class="card" style="border-left:4px solid var(--danger)"><div class="card-body" style="padding:14px">' +
      '<div style="margin-bottom:8px"><strong>' + (found.deviceName || '') + '</strong> ' + badgeHtml(found.status) + '</div>' +
      '<div style="font-size:12px;color:var(--text-light)">📅 ' + (found.date || '') + ' | ⏰ ' + (found.times || '') + '</div>' +
      '<div style="font-size:12px;color:var(--text-light)">📍 ' + (found.location || '') + ' | 📚 ' + (found.subject || '') + '</div>' +
      '<div style="margin-top:10px"><button class="btn btn-danger btn-sm" onclick="confirmCancel(\'' + resId + '\',\'' + name + '\',\'' + empNo + '\')">예약 취소</button></div>' +
      '</div></div>';
  }
}

function openModifyModal() {
  document.getElementById('modNewDate').value = '';
  document.getElementById('modNewLocation').value = '';
  document.getElementById('modNewSubject').value = '';
  document.getElementById('modNewActualUser').value = '';
  document.querySelectorAll('input[name="modTime"]').forEach(function(c) { c.checked = false; });
  openModal('modifyModal');
}

async function submitModify() {
  var e = App.editRes;
  if (!e) return;

  var data = {
    action: 'updateReservation',
    reservationId: e.id,
    verifyName: e.name,
    verifyEmployeeNo: e.empNo
  };

  var date = document.getElementById('modNewDate').value;
  if (date) data.date = date;
  var ts = [];
  document.querySelectorAll('input[name="modTime"]:checked').forEach(function(c) { ts.push(c.value); });
  if (ts.length) data.times = ts.join(', ');
  var loc = document.getElementById('modNewLocation').value.trim();
  if (loc) data.location = loc;
  var sub = document.getElementById('modNewSubject').value.trim();
  if (sub) data.subject = sub;
  var au = document.getElementById('modNewActualUser').value.trim();
  if (au) data.actualUser = au;

  var hasUpdate = date || ts.length || loc || sub || au;
  if (!hasUpdate) { toast('변경할 항목을 입력해주세요', 'warning'); return; }

  showLoading('변경 중...');
  var r = await apiPost(data);
  hideLoading();
  closeModal('modifyModal');

  if (r.status === 'success') {
    toast('예약이 변경되었습니다', 'success');
    findReservation('modify');
  } else {
    toast(r.message || '변경 실패', 'error');
  }
}

// ===== CANCEL =====
function renderCancel() {
  var el = document.getElementById('section-cancel');
  el.innerHTML =
    '<div class="card"><div class="card-header"><h2>❌ 예약 취소</h2></div><div class="card-body">' +
    '<p style="color:var(--text-light);font-size:13px;margin-bottom:14px">예약 취소를 위해 본인 확인이 필요합니다.</p>' +
    '<div class="form-row" style="grid-template-columns:1fr 1fr 1fr">' +
    '<div class="form-group"><label class="form-label">예약번호</label><input class="form-control" id="canResId" placeholder="예약번호"></div>' +
    '<div class="form-group"><label class="form-label">성함</label><input class="form-control" id="canName" placeholder="성함"></div>' +
    '<div class="form-group"><label class="form-label">사번</label><input class="form-control" id="canEmpNo" placeholder="사번"></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="findReservation(\'cancel\')">🔍 조회</button>' +
    '<div id="canResult" style="margin-top:16px"></div>' +
    '</div></div>';
}

async function confirmCancel(resId, name, empNo) {
  if (!confirm('정말 예약을 취소하시겠습니까?')) return;
  showLoading('취소 중...');
  var r = await apiPost({
    action: 'cancelReservation',
    reservationId: resId,
    verifyName: name,
    verifyEmployeeNo: empNo
  });
  hideLoading();
  if (r.status === 'success') {
    toast('예약이 취소되었습니다', 'success');
    document.getElementById('canResult').innerHTML = '<div class="empty-state"><p>✅ 예약이 취소되었습니다.</p></div>';
  } else {
    toast(r.message || '취소 실패', 'error');
  }
}
