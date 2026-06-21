// ============================================================
//  app.js
// ============================================================
const TABLE_EMP  = 'employees';
const TABLE_PROJ = 'projects';

const empForm        = document.getElementById('employeeForm');
const projForm       = document.getElementById('projectForm');
const empTableBody   = document.getElementById('empTableBody');
const projTableBody  = document.getElementById('projTableBody');
const empCount       = document.getElementById('empCount');
const projCount      = document.getElementById('projCount');
const navEmpCount    = document.getElementById('navEmpCount');
const navProjCount   = document.getElementById('navProjCount');
const empFormStatus  = document.getElementById('empFormStatus');
const projFormStatus = document.getElementById('projFormStatus');
const submitBtn      = document.getElementById('submitBtn');
const projSubmitBtn  = document.getElementById('projSubmitBtn');
const projectSelect  = document.getElementById('project');
const toast          = document.getElementById('toast');
const toastMsg       = document.getElementById('toastMsg');

const empRequiredFields = ['employeeCode','fullName','department','jobTitle','basicSalary','joinDate','email','phone'];

// ─── Tab ─────────────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');
  setTimeout(() => { window.scrollTo(0, 0); }, 10);
}

// ─── Auto salary ─────────────────────────────────────────
document.getElementById('basicSalary').addEventListener('input', function () {
  const v = parseFloat(this.value) || 0;
  document.getElementById('totalSalary').value = v > 0 ? (v * 1.35).toFixed(2) : '';
});

// ─── Toast ───────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3000);
}

// ─── Status ──────────────────────────────────────────────
function setStatus(el, msg, type) {
  el.textContent = msg; el.className = `form-status ${type}`; el.classList.remove('hidden');
  if (type === 'success') setTimeout(() => el.classList.add('hidden'), 4000);
}
function clearStatus(el) { el.classList.add('hidden'); }

// ─── Validation ──────────────────────────────────────────
function validateField(id, value) {
  const errEl = document.getElementById(`${id}-error`);
  const inputEl = document.getElementById(id);
  if (!errEl) return true;
  let msg = '';
  if (!value || !String(value).trim()) msg = 'مطلوب';
  else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'بريد غير صحيح';
  else if (id === 'phone' && !/^[\d\s\+\-\(\)]{7,20}$/.test(value)) msg = 'هاتف غير صالح';
  else if (id === 'basicSalary' && parseFloat(value) <= 0) msg = 'يجب أن يكون أكبر من 0';
  errEl.textContent = msg;
  if (inputEl) inputEl.classList.toggle('error', !!msg);
  return !msg;
}
function validateAll(fields) {
  let ok = true;
  fields.forEach(id => { if (!validateField(id, document.getElementById(id)?.value)) ok = false; });
  return ok;
}

// ─── Helpers ─────────────────────────────────────────────
function formatDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' });
}
function fNum(v) { return v ? Number(v).toLocaleString() : '—'; }
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}
function gv(id) { return document.getElementById(id)?.value || null; }
function gn(id) { const v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? null : v; }

// ══════════════════════════════════════════════
//  PROJECTS
// ══════════════════════════════════════════════
async function fetchProjects() {
  try {
    const { data, error } = await window.supabaseClient.from(TABLE_PROJ).select('*').order('name');
    if (error) throw error;
    const rows = data || [];
    projCount.textContent    = rows.length;
    navProjCount.textContent = rows.length;
    const cur = projectSelect.value;
    projectSelect.innerHTML = '<option value="">— بدون مشروع —</option>';
    rows.forEach(p => {
      const o = document.createElement('option');
      o.value = p.name; o.textContent = p.name;
      if (p.name === cur) o.selected = true;
      projectSelect.appendChild(o);
    });
    renderProjTable(rows);
  } catch (err) { console.error(err); }
}

function renderProjTable(rows) {
  if (!rows.length) {
    projTableBody.innerHTML = `<tr><td colspan="17"><div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
      <p>لا توجد مشاريع بعد</p></div></td></tr>`;
    return;
  }
  projTableBody.innerHTML = rows.map((p, i) => `<tr>
    <td>${i+1}</td>
    <td>${escHtml(p.serial_number||'—')}</td>
    <td><span class="code-tag">${escHtml(p.project_code||'—')}</span></td>
    <td>${escHtml(p.abbreviation||'—')}</td>
    <td><span class="proj-tag">${escHtml(p.name)}</span></td>
    <td>${escHtml(p.oracle_name_01||'—')}</td>
    <td>${escHtml(p.oracle_name_02||'—')}</td>
    <td>${formatDate(p.bl_start_date)}</td>
    <td>${formatDate(p.bl_finish_date)}</td>
    <td>${formatDate(p.modified_bl_finish_date)}</td>
    <td>${formatDate(p.as_of_date)}</td>
    <td class="num-td">${fNum(p.contract_price)}</td>
    <td class="num-td">${fNum(p.direct_budget)}</td>
    <td class="num-td">${fNum(p.indirect_budget)}</td>
    <td class="num-td">${p.overall_duration||'—'}</td>
    <td><span class="progress-badge">${p.actual_progress!=null?p.actual_progress+'%':'—'}</span></td>
    <td><button class="btn-del" onclick="confirmDelete('${p.id}','${escHtml(p.name)}','project')">
      <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
    </button></td>
  </tr>`).join('');
}

projForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus(projFormStatus);

  const name = document.getElementById('projectName').value.trim();
  const code = document.getElementById('projectCode').value.trim();
  const nameErr = document.getElementById('projectName-error');
  const codeErr = document.getElementById('projectCode-error');
  let ok = true;
  if (!name) { nameErr.textContent = 'مطلوب'; document.getElementById('projectName').classList.add('error'); ok = false; } else { nameErr.textContent = ''; document.getElementById('projectName').classList.remove('error'); }
  if (!code) { codeErr.textContent = 'مطلوب'; document.getElementById('projectCode').classList.add('error'); ok = false; } else { codeErr.textContent = ''; document.getElementById('projectCode').classList.remove('error'); }
  if (!ok) return;

  projSubmitBtn.disabled = true;
  projSubmitBtn.querySelector('.btn-text').textContent = 'جاري الحفظ...';

  const payload = {
    name,
    serial_number:          gv('serialNumber'),
    project_code:           code,
    abbreviation:           gv('abbreviation'),
    oracle_name_01:         gv('oracleName01'),
    oracle_name_02:         gv('oracleName02'),
    description:            gv('projectDesc'),
    bl_start_date:          gv('blStartDate'),
    bl_finish_date:         gv('blFinishDate'),
    modified_bl_finish_date:gv('modifiedBlFinishDate'),
    as_of_date:             gv('asOfDate'),
    contract_price:         gn('contractPrice'),
    direct_budget:          gn('directBudget'),
    indirect_budget:        gn('indirectBudget'),
    overall_duration:       gn('overallDuration'),
    actual_progress:        gn('actualProgress'),
  };

  try {
    const { error } = await window.supabaseClient.from(TABLE_PROJ).insert([payload]);
    if (error) throw error;
    projForm.reset();
    setStatus(projFormStatus, '✅ تم حفظ المشروع بنجاح!', 'success');
    showToast(`تم إضافة "${name}"`);
    await fetchProjects();
  } catch (err) {
    const msg = err.code === '23505' ? '⚠️ اسم أو كود المشروع موجود مسبقاً' : `❌ ${err.message}`;
    setStatus(projFormStatus, msg, 'error');
  } finally {
    projSubmitBtn.disabled = false;
    projSubmitBtn.querySelector('.btn-text').textContent = 'حفظ المشروع';
  }
});

document.getElementById('resetProjBtn').addEventListener('click', () => {
  ['projectName','projectCode'].forEach(id => {
    document.getElementById(id).classList.remove('error');
    document.getElementById(`${id}-error`).textContent = '';
  });
  clearStatus(projFormStatus);
});

// ══════════════════════════════════════════════
//  EMPLOYEES
// ══════════════════════════════════════════════
async function fetchEmployees() {
  try {
    const { data, error } = await window.supabaseClient.from(TABLE_EMP).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    renderEmpTable(data || []);
  } catch (err) { console.error(err); renderEmpTable([]); }
}

function renderEmpTable(rows) {
  empCount.textContent    = rows.length;
  navEmpCount.textContent = rows.length;
  if (!rows.length) {
    empTableBody.innerHTML = `<tr><td colspan="12"><div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
      <p>لا يوجد موظفون بعد</p></div></td></tr>`;
    return;
  }
  empTableBody.innerHTML = rows.map((r, i) => `<tr>
    <td>${i+1}</td>
    <td><span class="code-tag">${escHtml(r.employee_code||'—')}</span></td>
    <td>${escHtml(r.full_name)}</td>
    <td><span class="dept-tag">${escHtml(r.department)}</span></td>
    <td>${escHtml(r.job_title)}</td>
    <td>${r.project?`<span class="proj-tag">${escHtml(r.project)}</span>`:'—'}</td>
    <td class="num-td">${fNum(r.basic_salary)}</td>
    <td class="num-td">${fNum(r.total_salary)}</td>
    <td>${formatDate(r.join_date)}</td>
    <td>${r.resignation_date?formatDate(r.resignation_date):'<span class="active-tag">مازال</span>'}</td>
    <td>${escHtml(r.email)}</td>
    <td>${escHtml(r.phone)}</td>
  </tr>`).join('');
}

empForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus(empFormStatus);
  if (!validateAll(empRequiredFields)) return;
  const basic = parseFloat(document.getElementById('basicSalary').value) || 0;
  const payload = {
    employee_code:    document.getElementById('employeeCode').value.trim(),
    full_name:        document.getElementById('fullName').value.trim(),
    department:       document.getElementById('department').value,
    job_title:        document.getElementById('jobTitle').value.trim(),
    project:          document.getElementById('project').value || null,
    basic_salary:     basic,
    total_salary:     parseFloat((basic * 1.35).toFixed(2)),
    join_date:        document.getElementById('joinDate').value || null,
    resignation_date: document.getElementById('resignationDate').value || null,
    email:            document.getElementById('email').value.trim().toLowerCase(),
    phone:            document.getElementById('phone').value.trim(),
  };
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'جاري الحفظ...';
  try {
    const { error } = await window.supabaseClient.from(TABLE_EMP).insert([payload]);
    if (error) throw error;
    empForm.reset();
    document.getElementById('totalSalary').value = '';
    empRequiredFields.forEach(id => { document.getElementById(id)?.classList.remove('error'); const err=document.getElementById(`${id}-error`); if(err) err.textContent=''; });
    setStatus(empFormStatus, '✅ تم حفظ بيانات الموظف بنجاح!', 'success');
    showToast('تم حفظ الموظف بنجاح');
    await fetchEmployees();
  } catch (err) {
    setStatus(empFormStatus, err.code==='23505'?'⚠️ البريد مسجل مسبقاً':`❌ ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'حفظ الموظف';
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  empRequiredFields.forEach(id => { document.getElementById(id)?.classList.remove('error'); const err=document.getElementById(`${id}-error`); if(err) err.textContent=''; });
  document.getElementById('totalSalary').value = '';
  clearStatus(empFormStatus);
});

empRequiredFields.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur',  () => validateField(id, el.value));
  el.addEventListener('input', () => { if (el.classList.contains('error')) validateField(id, el.value); });
});

// ══════════════════════════════════════════════
//  DELETE
// ══════════════════════════════════════════════
let pendingDelete = null;
function confirmDelete(id, name, type) {
  pendingDelete = { id, type };
  document.getElementById('confirmMsg').textContent = `هل تريد حذف "${name}"؟`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}
document.getElementById('confirmOkBtn').addEventListener('click', async () => {
  if (!pendingDelete) return;
  closeConfirm();
  try {
    const { error } = await window.supabaseClient.from(pendingDelete.type==='project'?TABLE_PROJ:TABLE_EMP).delete().eq('id', pendingDelete.id);
    if (error) throw error;
    showToast('تم الحذف بنجاح');
    if (pendingDelete.type==='project') await fetchProjects(); else await fetchEmployees();
  } catch { showToast('❌ خطأ في الحذف'); }
  pendingDelete = null;
});
function closeConfirm() { document.getElementById('confirmOverlay').classList.add('hidden'); }

// ══════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════
async function exportToExcel() {
  const { data } = await window.supabaseClient.from(TABLE_EMP).select('*').order('created_at',{ascending:false});
  if (!data?.length) { showToast('لا توجد بيانات!'); return; }
  const headers=['#','الكود','الاسم','القسم','المسمى','المشروع','الراتب الأساسي','الراتب الشامل','تاريخ الانضمام','تاريخ الاستقالة','البريد','الهاتف'];
  buildExcel(headers, data.map((r,i)=>[i+1,r.employee_code||'—',r.full_name,r.department,r.job_title,r.project||'—',fNum(r.basic_salary),fNum(r.total_salary),formatDate(r.join_date),r.resignation_date?formatDate(r.resignation_date):'مازال',r.email,r.phone]), 'employees.xls', 'الموظفون');
}

async function exportProjectsToExcel() {
  const { data } = await window.supabaseClient.from(TABLE_PROJ).select('*').order('name');
  if (!data?.length) { showToast('لا توجد مشاريع!'); return; }
  const headers=['#','S.N.','Project Code','Abbreviation','اسم المشروع','Oracle 01','Oracle 02','BL Start','BL Finish','Modified BL','As of','Contract Price','Direct Budget','Indirect Budget','Duration','% Progress'];
  buildExcel(headers, data.map((p,i)=>[i+1,p.serial_number||'—',p.project_code||'—',p.abbreviation||'—',p.name,p.oracle_name_01||'—',p.oracle_name_02||'—',formatDate(p.bl_start_date),formatDate(p.bl_finish_date),formatDate(p.modified_bl_finish_date),formatDate(p.as_of_date),fNum(p.contract_price),fNum(p.direct_budget),fNum(p.indirect_budget),p.overall_duration||'—',p.actual_progress!=null?p.actual_progress+'%':'—']), 'projects.xls', 'المشاريع');
}

function buildExcel(headers, rows, filename, sheetName) {
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const hRow = headers.map(h=>`<th style="background:#1E3A5F;color:#fff;font-weight:bold;padding:8px;border:1px solid #fff;text-align:center;white-space:nowrap;">${esc(h)}</th>`).join('');
  const dRows = rows.map((r,i)=>{const bg=i%2===0?'#F7F9FC':'#fff';return`<tr>${r.map((v,ci)=>`<td style="background:${ci===0?'#EEF2F7':bg};padding:6px 10px;border:1px solid #D4E0EF;text-align:${ci===0?'center':'right'};font-size:11px;white-space:nowrap;">${esc(v)}</td>`).join('')}</tr>`;}).join('');
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table style="border-collapse:collapse;font-family:Arial;direction:rtl;"><thead><tr>${hRow}</tr></thead><tbody>${dRows}</tbody></table></body></html>`;
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob(['\uFEFF'+html],{type:'application/vnd.ms-excel;charset=utf-8'})),download:filename});
  a.click();URL.revokeObjectURL(a.href);
  showToast('تم التصدير! ✅');
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
(async () => { await Promise.all([fetchEmployees(), fetchProjects()]); })();

// ══════════════════════════════════════════════
//  BPO / PO EXTRACTOR
// ══════════════════════════════════════════════
function extractBPO() {
  const inputEl  = document.getElementById('bpoInput');
  const outNum   = document.getElementById('bpoOutput');
  const outLines = document.getElementById('poOutput');
  if (!inputEl || !outNum || !outLines) {
    alert('خطأ: العناصر غير موجودة'); return;
  }
  const text = inputEl.value.trim();
  if (!text) { alert('الرجاء لصق النص أولاً'); return; }

  const poLines  = text.match(/Approve.*?(BPO|BPR)\d+/gm) || [];
  const bpoLines = poLines.map(line => {
    const match = line.match(/(BPO|BPR)\d+/);
    return match ? match[0] : '';
  }).filter(Boolean);

  outNum.value   = bpoLines.length ? [...new Set(bpoLines)].join('\n') : 'No numbers found.';
  outLines.value = poLines.length  ? [...new Set(poLines)].join('\n')  : 'No lines found.';

  // Auto resize
  [outNum, outLines].forEach(el => {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + 4) + 'px';
  });
}

function copyBPO(elId, label) {
  const val = document.getElementById(elId).value;
  if (!val || val === 'No numbers found.' || val === 'No lines found.') {
    showToast('لا توجد بيانات للنسخ!'); return;
  }
  navigator.clipboard.writeText(val).then(() => showToast('✅ تم نسخ ' + label + '!'));
}

// ─── Export BPO to Excel ──────────────────────────────────
function exportBPOToExcel() {
  const inputText = document.getElementById('bpoInput').value.trim();
  if (!inputText) { showToast('الصق النص أولاً!'); return; }
  extractBPO();

  const numbers = document.getElementById('bpoOutput').value;
  const lines   = document.getElementById('poOutput').value;
  if (!numbers || numbers === 'No numbers found.') { showToast('لم يتم العثور على أرقام!'); return; }

  const numArr  = numbers.split('\n').filter(Boolean);
  const lineArr = lines.split('\n').filter(Boolean);
  const maxLen  = Math.max(numArr.length, lineArr.length);

  const rows = Array.from({length: maxLen}, (_, i) => [numArr[i]||'', lineArr[i]||'']);
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const hRow = ['Numbers','Lines'].map(h=>`<th style="background:#1E3A5F;color:#fff;font-weight:bold;padding:8px;border:1px solid #fff;text-align:center;white-space:nowrap;">${h}</th>`).join('');
  const dRows = rows.map((r,i)=>{const bg=i%2===0?'#F7F9FC':'#fff';return`<tr><td style="background:${bg};padding:6px 10px;border:1px solid #D4E0EF;text-align:left;font-family:monospace;white-space:nowrap;">${esc(r[0])}</td><td style="background:${bg};padding:6px 10px;border:1px solid #D4E0EF;text-align:left;white-space:nowrap;">${esc(r[1])}</td></tr>`;}).join('');
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>BPO Numbers</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table style="border-collapse:collapse;font-family:Arial;"><thead><tr>${hRow}</tr></thead><tbody>${dRows}</tbody></table></body></html>`;
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob(['﻿'+html],{type:'application/vnd.ms-excel;charset=utf-8'})),download:'BPO_Numbers.xls'});
  a.click();URL.revokeObjectURL(a.href);
  showToast('تم التصدير! ✅');
}
