// ============================================================
//  supabase.js  —  إعداد الاتصال بـ Supabase
// ============================================================
//
//  📌 الخطوة 1: استبدل القيم أدناه ببيانات مشروعك على Supabase
//
//  كيف تحصل عليها؟
//  ┌──────────────────────────────────────────────────────────┐
//  │  1. اذهب إلى: https://supabase.com                      │
//  │  2. افتح مشروعك → Settings → API                        │
//  │  3. انسخ "Project URL" و "anon public" key             │
//  └──────────────────────────────────────────────────────────┘
// ============================================================

const SUPABASE_URL  = 'https://Ygllhnrymegymtryjffey.supabase.co';   // ← ضع رابط مشروعك هنا
const SUPABASE_ANON = 'sb_publishable_2yazQW4L_YfHmod9RhyCLQ_FPA24XYJ';                  // ← ضع مفتاح anon هنا

// ============================================================
//  لا تغيّر ما بعد هذا السطر
// ============================================================

const { createClient } = supabase;   // من CDN

window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);

console.log('%c✅ Supabase Client Ready', 'color:#C9A84C;font-weight:bold');
