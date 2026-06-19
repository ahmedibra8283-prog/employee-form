// ============================================================
//  app.js  —  منطق التطبيق الرئيسي
// ============================================================

const TABLE_NAME = 'employees';   // اسم جدول Supabase

// ─── مراجع DOM ────────────────────────────────────────────
const form        = document.getElementById('employeeForm');
const tableBody   = document.getElementById('tableBody');
const recordCount = document.getElementById('recordCount');
const submitBtn   = document.getElementById('submitBtn');
const resetBtn    = document.getElementById('resetBtn');
const formStatus  = document.getElementById('formStatus');
const toast       = document.getElementById('toast');
const toastMsg    = document.getElementById('toastMsg');

// ─── حقول النموذج ─────────────────────────────────────────
const fields = ['fullName', 'email', 'phone', 'department', 'jobTitle'];

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
  if (type === 'success') {
    setTimeout(() => formStatus.classList.add('hidden'), 4000);
  }
}

function clearStatus() { formStatus.classList.add('hidden'); }

// ─── التحقق من صحة المدخلات ───────────────────────────────
function validateField(id, value) {
  const errEl = document.getElementById(`${id}-error`);
  const inputEl = document.getElementById(id);
  let msg = '';

  if (!value.trim()) {
    msg = 'هذا الحقل مطلوب';
  } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    msg = 'صيغة البريد الإلكتروني غير صحيحة';
  } else if (id === 'phone' && !/^[\d\s\+\-\(\)]{7,20}$/.test(value)) {
    msg = 'رقم الهاتف غير صالح';
  }

  errEl.textContent = msg;
  inputEl.classList.toggle('error', !!msg);
  return !msg;
}

function validateAll() {
  let ok = true;
  fields.forEach(id => {
    const val = document.getElementById(id).value;
    if (!validateField(id, val)) ok = false;
  });
  return ok;
}

// ─── تنسيق التاريخ ────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── رسم الجدول ───────────────────────────────────────────
function renderTable(rows) {
  const count = rows.length;
  recordCount.textContent = `${count} موظف`;

  if (count === 0) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div class="empty-state">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
            <p>لا توجد سجلات بعد. أضف أول موظف!</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escHtml(r.full_name)}</td>
      <td>${escHtml(r.email)}</td>
      <td>${escHtml(r.phone)}</td>
      <td><span class="dept-badge">${escHtml(r.department)}</span></td>
      <td>${escHtml(r.job_title)}</td>
      <td>${formatDate(r.created_at)}</td>
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
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

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

  // جمع البيانات
  const payload = {
    full_name:  document.getElementById('fullName').value.trim(),
    email:      document.getElementById('email').value.trim().toLowerCase(),
    phone:      document.getElementById('phone').value.trim(),
    department: document.getElementById('department').value,
    job_title:  document.getElementById('jobTitle').value.trim(),
  };

  // حالة التحميل
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtn.querySelector('.btn-text').textContent = 'جاري الحفظ';

  try {
    const { error } = await window.supabaseClient
      .from(TABLE_NAME)
      .insert([payload]);

    if (error) throw error;

    // نجاح
    form.reset();
    fields.forEach(id => {
      document.getElementById(id).classList.remove('error');
      document.getElementById(`${id}-error`).textContent = '';
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
  fields.forEach(id => {
    document.getElementById(id).classList.remove('error');
    document.getElementById(`${id}-error`).textContent = '';
  });
  clearStatus();
});

// ─── التحقق الفوري عند الكتابة ───────────────────────────
fields.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', () => validateField(id, el.value));
  el.addEventListener('input', () => {
    if (el.classList.contains('error')) validateField(id, el.value);
  });
});

// ─── بدء التشغيل ──────────────────────────────────────────
(async () => {
  await fetchEmployees();
})();
// ─── Export to Excel ──────────────────────────────────────
async function exportToExcel() {
  const { data, error } = await window.supabaseClient
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data.length) {
    showToast('لا توجد بيانات للتصدير!');
    return;
  }

  const rows = data.map((r, i) => ({
    '#': i + 1,
    'الاسم الكامل': r.full_name,
    'البريد الإلكتروني': r.email,
    'رقم الهاتف': r.phone,
    'القسم': r.department,
    'المسمى الوظيفي': r.job_title,
    'تاريخ التسجيل': formatDate(r.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الموظفون');
  XLSX.writeFile(wb, 'employees.xlsx');
  showToast('تم تصدير البيانات بنجاح! ✅');
}
