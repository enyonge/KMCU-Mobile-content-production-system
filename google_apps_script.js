/**
 * 계명문화대학교 이동형 콘텐츠 제작 시스템 관리
 * Google Apps Script (Code.gs)
 *
 * [배포] 웹앱 > 실행주체: 나 > 액세스: 누구나
 * [시트] Reservations, Logs
 */

const SPREADSHEET_ID = '1HOVZOGRZERVwf8XaGgRhrG256WP4_m-5uVSZyI6C40U';
const RESERVATIONS_SHEET = 'Reservations';
const LOGS_SHEET = 'Logs';
const ADMIN_PASSWORD = '7365';

// ===== 유틸리티 =====
function generateId() { return 'R' + Date.now() + Math.random().toString(36).substr(2, 5); }
function generateLogId() { return 'L' + Date.now() + Math.random().toString(36).substr(2, 5); }
function getNow() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'); }
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}
function safeDate(v) {
  return v instanceof Date ? Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss') : v;
}

// ===== 초기 셋업 =====
function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var resSheet = ss.getSheetByName(RESERVATIONS_SHEET) || ss.insertSheet(RESERVATIONS_SHEET);
  resSheet.getRange(1, 1, 1, 14).setValues([[
    'reservationId', 'createdAt', 'updatedAt', 'deviceId', 'deviceName',
    'name', 'employeeNo', 'actualUser', 'date', 'times',
    'location', 'subject', 'status', 'active'
  ]]);

  var logSheet = ss.getSheetByName(LOGS_SHEET) || ss.insertSheet(LOGS_SHEET);
  logSheet.getRange(1, 1, 1, 8).setValues([[
    'logId', 'createdAt', 'reservationId', 'action', 'actor',
    'beforeValue', 'afterValue', 'memo'
  ]]);
}

// ===== 로그 기록 =====
function addLog(reservationId, action, actor, beforeValue, afterValue, memo) {
  var s = getSheet(LOGS_SHEET);
  if (!s) return;
  s.appendRow([generateLogId(), getNow(), reservationId, action, actor, beforeValue || '', afterValue || '', memo || '']);
}

// ===== 라우터 =====
function doGet(e) {
  try {
    var action = e.parameter.action || 'getReservations';

    // payload가 있으면 쓰기 요청 (POST 대체)
    if (e.parameter.payload) {
      var data = JSON.parse(e.parameter.payload);
      return handleWrite(action, data);
    }

    // 읽기 요청
    switch (action) {
      case 'getReservations': return jsonResponse(getReservations(e.parameter));
      case 'getLogs': return jsonResponse(getLogs(e.parameter));
      case 'checkDuplicate': return jsonResponse(checkDuplicate(e.parameter));
      case 'verifyAdmin': return jsonResponse(verifyAdmin(e.parameter));
      default: return jsonResponse({ status: 'error', message: '알 수 없는 액션: ' + action });
    }
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return handleWrite(data.action, data);
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function handleWrite(action, data) {
  switch (action) {
    case 'createReservation': return jsonResponse(createReservation(data));
    case 'updateReservation': return jsonResponse(updateReservation(data));
    case 'cancelReservation': return jsonResponse(cancelReservation(data));
    case 'returnReservation': return jsonResponse(returnReservation(data));
    case 'deleteReservation': return jsonResponse(deleteReservation(data));
    case 'adminUpdate': return jsonResponse(adminUpdate(data));
    default: return jsonResponse({ status: 'error', message: '알 수 없는 쓰기 액션: ' + action });
  }
}

// ===== 읽기 =====
function getReservations(params) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: 'Reservations 시트를 찾을 수 없습니다.' };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };

  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = safeDate(data[i][j]);
    }
    rows.push(row);
  }

  if (params && params.mode === 'user') {
    var now = new Date();
    rows = rows.filter(function(r) {
      if (r.status === '취소' || r.status === '반납' || r.status === '시간종료' || r.active === 'N') return false;
      var dates = String(r.date).split(',').map(function(d) { return d.trim(); });
      var times = String(r.times).split(',').map(function(t) { return t.trim(); });
      var latestEnd = null;
      dates.forEach(function(d) {
        times.forEach(function(t) {
          var match = t.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
          if (match) {
            try {
              var endDate = new Date(d + 'T' + String(parseInt(match[3])).padStart(2, '0') + ':' + match[4] + ':00+09:00');
              if (!latestEnd || endDate > latestEnd) latestEnd = endDate;
            } catch (e) {}
          }
        });
      });
      if (latestEnd && latestEnd < now) return false;
      return true;
    });
  }

  return { status: 'success', data: rows };
}

function getLogs(params) {
  var sheet = getSheet(LOGS_SHEET);
  if (!sheet) return { status: 'error', message: 'Logs 시트를 찾을 수 없습니다.' };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };

  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = safeDate(data[i][j]);
    }
    rows.push(row);
  }

  if (params && params.filterAction) {
    rows = rows.filter(function(r) { return r.action === params.filterAction; });
  }

  return { status: 'success', data: rows };
}

function checkDuplicate(params) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'success', duplicate: false };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', duplicate: false };

  var headers = data[0];
  var deviceIdx = headers.indexOf('deviceId');
  var dateIdx = headers.indexOf('date');
  var timesIdx = headers.indexOf('times');
  var statusIdx = headers.indexOf('status');
  var idIdx = headers.indexOf('reservationId');

  var requestDates = params.date.split(',').map(function(d) { return d.trim(); });
  var requestTimes = params.times.split(',').map(function(t) { return t.trim(); });
  var excludeId = params.excludeId || '';

  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][idIdx]);
    var rowDevice = String(data[i][deviceIdx]);
    var rowStatus = String(data[i][statusIdx]);

    if (excludeId && rowId === excludeId) continue;
    if (['취소', '반납', '시간종료'].indexOf(rowStatus) >= 0) continue;
    if (rowDevice !== params.deviceId) continue;

    var rowDates = String(data[i][dateIdx]).split(',').map(function(d) { return d.trim(); });
    var rowTimes = String(data[i][timesIdx]).split(',').map(function(t) { return t.trim(); });

    var dateOverlap = requestDates.some(function(rd) { return rowDates.indexOf(rd) >= 0; });
    if (!dateOverlap) continue;

    var timeOverlap = requestTimes.some(function(rt) { return rowTimes.indexOf(rt) >= 0; });
    if (timeOverlap) {
      return { status: 'success', duplicate: true, message: '해당 장비의 같은 날짜/시간에 이미 예약이 있습니다.' };
    }
  }

  return { status: 'success', duplicate: false };
}

function verifyAdmin(params) {
  return { status: 'success', verified: params.password === ADMIN_PASSWORD };
}

// ===== 쓰기 =====
function createReservation(data) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var id = generateId();
  var now = getNow();
  sheet.appendRow([
    id, now, now,
    data.deviceId || '', data.deviceName || '',
    data.name || '', data.employeeNo || '', data.actualUser || '',
    data.date || '', data.times || '',
    data.location || '', data.subject || '',
    '예약중', 'Y'
  ]);

  addLog(id, '예약신청', '사용자', '', JSON.stringify({
    deviceName: data.deviceName, name: data.name, date: data.date, times: data.times
  }), '새 예약 등록');

  return { status: 'success', reservationId: id, message: '예약이 완료되었습니다.' };
}

function findRowById(sheet, reservationId) {
  var data = sheet.getDataRange().getValues();
  var idIdx = data[0].indexOf('reservationId');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === reservationId) return i + 1;
  }
  return -1;
}

function updateReservation(data) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var idIdx = headers.indexOf('reservationId');
  var nameIdx = headers.indexOf('name');
  var empIdx = headers.indexOf('employeeNo');

  var targetRow = -1;
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][idIdx]) === data.reservationId) {
      if (String(allData[i][nameIdx]) !== data.verifyName ||
          String(allData[i][empIdx]) !== String(data.verifyEmployeeNo)) {
        return { status: 'error', message: '예약자 정보가 일치하지 않습니다.' };
      }
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) return { status: 'error', message: '예약을 찾을 수 없습니다.' };

  var updates = {};
  if (data.date !== undefined) updates.date = data.date;
  if (data.times !== undefined) updates.times = data.times;
  if (data.location !== undefined) updates.location = data.location;
  if (data.subject !== undefined) updates.subject = data.subject;
  if (data.actualUser !== undefined) updates.actualUser = data.actualUser;

  Object.keys(updates).forEach(function(key) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) sheet.getRange(targetRow, colIdx + 1).setValue(updates[key]);
  });

  sheet.getRange(targetRow, headers.indexOf('updatedAt') + 1).setValue(getNow());
  sheet.getRange(targetRow, headers.indexOf('status') + 1).setValue('변경됨');

  addLog(data.reservationId, '예약변경', '사용자', '', JSON.stringify(updates), '사용자 예약 변경');
  return { status: 'success', message: '예약이 변경되었습니다.' };
}

function cancelReservation(data) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var idIdx = headers.indexOf('reservationId');
  var nameIdx = headers.indexOf('name');
  var empIdx = headers.indexOf('employeeNo');

  var targetRow = -1;
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][idIdx]) === data.reservationId) {
      if (!data.isAdmin) {
        if (String(allData[i][nameIdx]) !== data.verifyName ||
            String(allData[i][empIdx]) !== String(data.verifyEmployeeNo)) {
          return { status: 'error', message: '예약자 정보가 일치하지 않습니다.' };
        }
      }
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) return { status: 'error', message: '예약을 찾을 수 없습니다.' };

  sheet.getRange(targetRow, headers.indexOf('status') + 1).setValue('취소');
  sheet.getRange(targetRow, headers.indexOf('active') + 1).setValue('N');
  sheet.getRange(targetRow, headers.indexOf('updatedAt') + 1).setValue(getNow());

  addLog(data.reservationId, '예약취소', data.isAdmin ? '관리자' : '사용자', '', '취소', '');
  return { status: 'success', message: '예약이 취소되었습니다.' };
}

function returnReservation(data) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var row = findRowById(sheet, data.reservationId);
  if (row === -1) return { status: 'error', message: '예약을 찾을 수 없습니다.' };

  var headers = sheet.getRange(1, 1, 1, 14).getValues()[0];
  sheet.getRange(row, headers.indexOf('status') + 1).setValue('반납');
  sheet.getRange(row, headers.indexOf('active') + 1).setValue('N');
  sheet.getRange(row, headers.indexOf('updatedAt') + 1).setValue(getNow());

  addLog(data.reservationId, '반납처리', '관리자', '', '반납', '관리자 반납 처리');
  return { status: 'success', message: '반납 처리가 완료되었습니다.' };
}

function deleteReservation(data) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var row = findRowById(sheet, data.reservationId);
  if (row === -1) return { status: 'error', message: '예약을 찾을 수 없습니다.' };

  addLog(data.reservationId, '데이터삭제', '관리자', '', '삭제됨', '');
  sheet.deleteRow(row);
  return { status: 'success', message: '삭제되었습니다.' };
}

function adminUpdate(data) {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var row = findRowById(sheet, data.reservationId);
  if (row === -1) return { status: 'error', message: '예약을 찾을 수 없습니다.' };

  var headers = sheet.getRange(1, 1, 1, 14).getValues()[0];
  var updates = data.updates || {};
  Object.keys(updates).forEach(function(key) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) sheet.getRange(row, colIdx + 1).setValue(updates[key]);
  });
  sheet.getRange(row, headers.indexOf('updatedAt') + 1).setValue(getNow());

  addLog(data.reservationId, '관리자수정', '관리자', '', JSON.stringify(updates), data.memo || '');
  return { status: 'success', message: '수정 완료되었습니다.' };
}

// ===== 시간 종료 자동 처리 (트리거용) =====
function autoExpireReservations() {
  var sheet = getSheet(RESERVATIONS_SHEET);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  var headers = data[0];
  var dateIdx = headers.indexOf('date');
  var timesIdx = headers.indexOf('times');
  var statusIdx = headers.indexOf('status');
  var updatedAtIdx = headers.indexOf('updatedAt');
  var activeIdx = headers.indexOf('active');
  var now = new Date();

  for (var i = 1; i < data.length; i++) {
    var status = String(data[i][statusIdx]);
    if (['취소', '반납', '시간종료'].indexOf(status) >= 0) continue;

    var dates = String(data[i][dateIdx]).split(',').map(function(d) { return d.trim(); });
    var times = String(data[i][timesIdx]).split(',').map(function(t) { return t.trim(); });
    var latestEnd = null;

    dates.forEach(function(d) {
      times.forEach(function(t) {
        var match = t.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
        if (match) {
          try {
            var endDate = new Date(d + 'T' + String(parseInt(match[3])).padStart(2, '0') + ':' + match[4] + ':00+09:00');
            if (!latestEnd || endDate > latestEnd) latestEnd = endDate;
          } catch (e) {}
        }
      });
    });

    if (latestEnd && latestEnd < now) {
      var rowNum = i + 1;
      sheet.getRange(rowNum, statusIdx + 1).setValue('시간종료');
      sheet.getRange(rowNum, activeIdx + 1).setValue('N');
      sheet.getRange(rowNum, updatedAtIdx + 1).setValue(getNow());
      addLog(String(data[i][headers.indexOf('reservationId')]), '시간종료', '시스템', '', '시간종료', '자동 종료');
    }
  }
}
