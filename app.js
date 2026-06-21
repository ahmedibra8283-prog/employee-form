// ============================================================
//  app.js  —  منطق التطبيق الرئيسي
// ============================================================

const TABLE_NAME = 'employees';

// ─── مراجع DOM ────────────────────────────────────────────
const form        = document.getElementById('employeeForm');
const tableBody   = document.getElementById('tableBody');
const recordCount = document.getElementById('recordCount');
const submitBtn   = document.getElementById('submitBtn');
const resetBtn    = document.getElementById('resetBtn');
const formStatus  = document.getElementById('formStatus');
const toast       = document.getElementById('toast');
const toastMsg    = document.getElementById('toastMsg');

// ─── حقول مطلوبة ──────────────────────────────────────────
const requiredFields = ['employeeCode', 'fullName', 'department', 'jobTitle', 'basicSalary', 'joinDate', 'email', 'phone'];

// ─── حساب الراتب الشامل تلقائياً ─────────────────────────
document.getElementById('basicSalary').addEventListener('input', function () {
  const basic = parseFloat(this.value) || 0;
  const total = (basic * 1.35).toFixed(2);
  document.getElementById('totalSalary').value = basic > 0 ? total : '';
});

// ─── Toast ────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 350);
  }, 3000);
}

// ─── حالة النموذج ─────────────────────────────────────────
function setStatus(msg, type) {
  formStatus.textContent = msg;
  formStatus.className = `form-status ${type}`;
  formStatus.classList.remove('hidden');
  if (type === 'success') setTimeout(() => formStatus.classList.add('hidden'), 4000);
}
function clearStatus() { formStatus.classList.add('hidden'); }

// ─── التحقق من صحة المدخلات ───────────────────────────────
function validateField(id, value) {
  const errEl   = document.getElementById(`${id}-error`);
  const inputEl = document.getElementById(id);
  if (!errEl) return true;
  let msg = '';
  if (!value || !String(value).trim()) {
    msg = 'هذا الحقل مطلوب';
  } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    msg = 'صيغة البريد الإلكتروني غير صحيحة';
  } else if (id === 'phone' && !/^[\d\s\+\-\(\)]{7,20}$/.test(value)) {
    msg = 'رقم الهاتف غير صالح';
  } else if (id === 'basicSalary' && parseFloat(value) <= 0) {
    msg = 'الراتب يجب أن يكون أكبر من صفر';
  }
  errEl.textContent = msg;
  if (inputEl) inputEl.classList.toggle('error', !!msg);
  return !msg;
}

function validateAll() {
  let ok = true;
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!validateField(id, el ? el.value : '')) ok = false;
  });
  return ok;
}

// ─── تنسيق التاريخ ────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── رسم الجدول ───────────────────────────────────────────
function renderTable(rows) {
  recordCount.textContent = `${rows.length} موظف`;
  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr class="empty-row"><td colspan="12">
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
          <p>لا توجد سجلات بعد. أضف أول موظف!</p>
        </div>
      </td></tr>`;
    return;
  }
  tableBody.innerHTML = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="code-badge">${escHtml(r.employee_code || '—')}</span></td>
      <td>${escHtml(r.full_name)}</td>
      <td><span class="dept-badge">${escHtml(r.department)}</span></td>
      <td>${escHtml(r.job_title)}</td>
      <td>${escHtml(r.project || '—')}</td>
      <td class="num-cell">${r.basic_salary ? Number(r.basic_salary).toLocaleString('ar-SA') : '—'}</td>
      <td class="num-cell">${r.total_salary ? Number(r.total_salary).toLocaleString('ar-SA') : '—'}</td>
      <td>${formatDate(r.join_date)}</td>
      <td>${r.resignation_date ? formatDate(r.resignation_date) : '<span class="active-badge">مازال</span>'}</td>
      <td>${escHtml(r.email)}</td>
      <td>${escHtml(r.phone)}</td>
    </tr>`).join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// ─── جلب البيانات من Supabase ─────────────────────────────
async function fetchEmployees() {
  try {
    const { data, error } = await window.supabaseClient
      .from(TABLE_NAME).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    renderTable(data || []);
  } catch (err) {
    console.error('خطأ في جلب البيانات:', err);
    renderTable([]);
  }
}

// ─── إرسال النموذج ────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus();
  if (!validateAll()) return;

  const basic = parseFloat(document.getElementById('basicSalary').value) || 0;

  const payload = {
    employee_code:    document.getElementById('employeeCode').value.trim(),
    full_name:        document.getElementById('fullName').value.trim(),
    department:       document.getElementById('department').value,
    job_title:        document.getElementById('jobTitle').value.trim(),
    project:          document.getElementById('project').value.trim() || null,
    basic_salary:     basic,
    total_salary:     parseFloat((basic * 1.35).toFixed(2)),
    join_date:        document.getElementById('joinDate').value || null,
    resignation_date: document.getElementById('resignationDate').value || null,
    email:            document.getElementById('email').value.trim().toLowerCase(),
    phone:            document.getElementById('phone').value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.querySelector('.btn-text').textContent = 'جاري الحفظ';

  try {
    const { error } = await window.supabaseClient.from(TABLE_NAME).insert([payload]);
    if (error) throw error;
    form.reset();
    document.getElementById('totalSalary').value = '';
    requiredFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('error');
      const err = document.getElementById(`${id}-error`);
      if (err) err.textContent = '';
    });
    setStatus('✅ تم حفظ بيانات الموظف بنجاح!', 'success');
    showToast('تم حفظ الموظف بنجاح');
    await fetchEmployees();
  } catch (err) {
    console.error('خطأ في الحفظ:', err);
    const msg = err.code === '23505'
      ? '⚠️ هذا البريد الإلكتروني مسجل مسبقاً'
      : `❌ حدث خطأ: ${err.message}`;
    setStatus(msg, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('.btn-text').textContent = 'حفظ الموظف';
  }
});

// ─── مسح النموذج ──────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
    const err = document.getElementById(`${id}-error`);
    if (err) err.textContent = '';
  });
  document.getElementById('totalSalary').value = '';
  clearStatus();
});

// ─── التحقق الفوري ────────────────────────────────────────
requiredFields.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur',  () => validateField(id, el.value));
  el.addEventListener('input', () => { if (el.classList.contains('error')) validateField(id, el.value); });
});

// ─── بدء التشغيل ──────────────────────────────────────────
(async () => { await fetchEmployees(); })();

// ─── Export to Excel ──────────────────────────────────────
async function exportToExcel() {
  const { data, error } = await window.supabaseClient
    .from(TABLE_NAME).select('*').order('created_at', { ascending: false });
  if (error || !data || !data.length) { showToast('لا توجد بيانات للتصدير!'); return; }

  const headers = ['#','الكود','الاسم الكامل','القسم','المسمى الوظيفي','المشروع','الراتب الأساسي','الراتب الشامل','تاريخ الانضمام','تاريخ الاستقالة','البريد الإلكتروني','رقم الهاتف'];
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const headerCells = headers.map(h =>
    `<th style="background-color:#1E3A5F;color:#FFFFFF;font-weight:bold;font-size:12px;text-align:center;padding:8px;border:1px solid #FFFFFF;white-space:nowrap;">${esc(h)}</th>`
  ).join('');

  const dataRows = data.map((r, i) => {
    const bg = i % 2 === 0 ? '#F7F9FC' : '#FFFFFF';
    const vals = [
      i+1, r.employee_code||'—', r.full_name, r.department, r.job_title,
      r.project||'—',
      r.basic_salary ? Number(r.basic_salary).toLocaleString() : '—',
      r.total_salary ? Number(r.total_salary).toLocaleString() : '—',
      formatDate(r.join_date), r.resignation_date ? formatDate(r.resignation_date) : 'مازال في الشركة',
      r.email, r.phone
    ];
    const cells = vals.map((v, ci) =>
      `<td style="background-color:${ci===0?'#EEF2F7':bg};padding:6px 10px;border:1px solid #D4E0EF;text-align:${ci===0?'center':'right'};font-size:11px;white-space:nowrap;">${esc(v)}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>الموظفون</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body><table style="border-collapse:collapse;font-family:Arial,sans-serif;direction:rtl;">
      <thead><tr>${headerCells}</tr></thead><tbody>${dataRows}</tbody>
    </table></body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'employees.xls'; a.click();
  URL.revokeObjectURL(url);
  showToast('تم تصدير البيانات بنجاح! ✅');
}
