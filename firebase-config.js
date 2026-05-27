/* =============================================
   style.css - 우리 가족 웹앱 공통 스타일
   ============================================= */

/* ── Reset & Base ─────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary:       #1D9E75;
  --primary-light: #E1F5EE;
  --primary-dark:  #085041;
  --amber:         #BA7517;
  --amber-light:   #FAEEDA;
  --blue:          #185FA5;
  --blue-light:    #E6F1FB;
  --coral:         #993C1D;
  --coral-light:   #FAECE7;
  --purple:        #534AB7;
  --purple-light:  #EEEDFE;
  --pink:          #993556;
  --pink-light:    #FBEAF0;

  --sidebar-w:     220px;
  --gap:           12px;
  --radius-sm:     6px;
  --radius-md:     8px;
  --radius-lg:     12px;

  --bg:       #F8F8F6;
  --surface:  #FFFFFF;
  --border:   rgba(0,0,0,0.08);
  --border-md:rgba(0,0,0,0.15);
  --text:     #1A1A18;
  --text-2:   #5A5A56;
  --text-3:   #9A9A96;
}

/* 다크모드 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:       #111110;
    --surface:  #1C1C1A;
    --border:   rgba(255,255,255,0.08);
    --border-md:rgba(255,255,255,0.15);
    --text:     #F0F0EC;
    --text-2:   #A0A09C;
    --text-3:   #606060;
  }
}

html, body { height: 100%; font-family: 'Pretendard', 'Noto Sans KR', -apple-system, sans-serif; background: var(--bg); color: var(--text); font-size: 15px; line-height: 1.6; }

/* ── Layout ───────────────────────────────── */
.app-layout { display: flex; height: 100vh; overflow: hidden; }

/* ── Sidebar ──────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
  transition: width .2s;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 1.25rem 1.25rem 1rem;
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

.logo-mark {
  width: 32px; height: 32px;
  background: var(--primary);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; flex-shrink: 0;
}

.nav-group { padding: 0 0.75rem; margin-bottom: 0.25rem; }

.nav-label {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 0 0.5rem;
  margin-bottom: 4px;
  margin-top: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-2);
  transition: background .12s, color .12s;
  text-decoration: none;
}
.nav-item:hover { background: var(--bg); color: var(--text); }
.nav-item.active { background: var(--primary-light); color: var(--primary-dark); font-weight: 500; }
.nav-item i { font-size: 17px; width: 20px; text-align: center; flex-shrink: 0; }

.sidebar-footer {
  margin-top: auto;
  padding: 1rem 0.75rem;
  border-top: 0.5px solid var(--border);
}

.member-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 8px; border-radius: var(--radius-md);
  cursor: pointer; font-size: 13px; color: var(--text-2);
  transition: background .12s;
}
.member-item:hover { background: var(--bg); }

/* ── Main ─────────────────────────────────── */
.main-content { flex: 1; overflow-y: auto; }
.page-wrap    { padding: 1.5rem 1.75rem; max-width: 960px; }

/* ── Page header ──────────────────────────── */
.page-hd { margin-bottom: 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.page-hd h1 { font-size: 22px; font-weight: 500; }
.page-hd p  { font-size: 13px; color: var(--text-2); margin-top: 2px; }

/* ── Cards ────────────────────────────────── */
.card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
}

.card-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 14px; font-weight: 500; color: var(--text);
  display: flex; align-items: center; gap: 7px;
}

/* ── Buttons ──────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--radius-md);
  border: 0.5px solid var(--border-md);
  background: transparent; cursor: pointer;
  font-size: 13px; color: var(--text-2);
  transition: background .12s, color .12s;
  font-family: inherit;
}
.btn:hover { background: var(--bg); color: var(--text); }
.btn:active { transform: scale(0.98); }

.btn-primary {
  background: var(--primary); color: #fff;
  border-color: var(--primary);
}
.btn-primary:hover { background: var(--primary-dark); border-color: var(--primary-dark); color: #fff; }

.btn-danger { color: #A32D2D; border-color: #F7C1C1; }
.btn-danger:hover { background: #FCEBEB; }

.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-icon { padding: 7px; }

/* ── Badges ───────────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 500;
}
.badge-shared  { background: var(--primary-light); color: var(--primary-dark); }
.badge-private { background: var(--bg); color: var(--text-3); border: 0.5px solid var(--border); }

/* ── Share toggle ─────────────────────────── */
.share-toggle {
  display: flex;
  border: 0.5px solid var(--border-md);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.share-opt {
  padding: 5px 12px; font-size: 12px; cursor: pointer;
  color: var(--text-2); transition: all .12s;
  display: flex; align-items: center; gap: 4px;
  user-select: none;
}
.share-opt:hover { background: var(--bg); }
.share-opt.active { background: var(--primary); color: #fff; }

/* ── Form controls ────────────────────────── */
.form-group { margin-bottom: 1rem; }
.form-label { font-size: 13px; font-weight: 500; color: var(--text-2); margin-bottom: 5px; display: block; }

.form-input, .form-select, .form-textarea {
  width: 100%; padding: 8px 12px;
  border: 0.5px solid var(--border-md);
  border-radius: var(--radius-md);
  background: var(--surface); color: var(--text);
  font-size: 14px; font-family: inherit;
  transition: border-color .15s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none; border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29,158,117,.12);
}
.form-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

/* ── Stars rating ─────────────────────────── */
.stars-input { display: flex; gap: 4px; }
.star-btn {
  font-size: 22px; cursor: pointer; color: var(--border-md);
  transition: color .1s; background: none; border: none; padding: 2px;
}
.star-btn.on { color: var(--amber); }

/* ── Avatar ───────────────────────────────── */
.avatar {
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-weight: 500; flex-shrink: 0;
}

/* ── Stats grid ───────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--gap); margin-bottom: 1.5rem;
}
.stat-card {
  background: var(--bg); border-radius: var(--radius-md);
  padding: 1rem; text-align: center;
}
.stat-num   { font-size: 26px; font-weight: 500; }
.stat-label { font-size: 12px; color: var(--text-3); margin-top: 2px; }

/* ── Todo item ────────────────────────────── */
.todo-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0; border-bottom: 0.5px solid var(--border);
}
.todo-item:last-child { border-bottom: none; }
.todo-check {
  width: 18px; height: 18px; border-radius: 4px;
  border: 1.5px solid var(--border-md); flex-shrink: 0;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.todo-check.done { background: var(--primary); border-color: var(--primary); color: #fff; }
.todo-label      { flex: 1; font-size: 14px; }
.todo-label.done { text-decoration: line-through; color: var(--text-3); }

/* ── Calendar ─────────────────────────────── */
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cal-head { text-align: center; font-size: 11px; color: var(--text-3); padding: 4px; font-weight: 500; }
.cal-cell {
  min-height: 60px; border-radius: var(--radius-md);
  padding: 4px; cursor: pointer; transition: background .1s;
  border: 0.5px solid transparent;
}
.cal-cell:hover { background: var(--bg); border-color: var(--border); }
.cal-cell.other .cal-dn { color: var(--text-3); }
.cal-cell.today .cal-dn {
  background: var(--primary); color: #fff;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-weight: 500;
}
.cal-dn { font-size: 12px; color: var(--text-2); margin-bottom: 2px; width: 22px; }
.cal-event {
  font-size: 10px; padding: 1px 5px; border-radius: 3px;
  margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Timeline ─────────────────────────────── */
.timeline { display: flex; flex-direction: column; gap: 0; }
.tl-item { display: flex; gap: 1rem; padding-bottom: 1.5rem; position: relative; }
.tl-item::before {
  content: ''; position: absolute;
  left: 19px; top: 42px; bottom: 0;
  width: 1px; background: var(--border);
}
.tl-item:last-child::before { display: none; }
.tl-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; font-size: 18px; display: flex; align-items: center; justify-content: center; }
.tl-body {}
.tl-meta  { font-size: 12px; color: var(--text-3); }
.tl-title { font-size: 14px; font-weight: 500; margin: 3px 0; }
.tl-text  { font-size: 13px; color: var(--text-2); line-height: 1.6; }

/* ── Tags ─────────────────────────────────── */
.tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }

/* ── Modal overlay ────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 1rem;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem; width: 100%; max-width: 480px;
  border: 0.5px solid var(--border);
}
.modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem;
}
.modal-hd h2 { font-size: 17px; font-weight: 500; }

/* ── Auth screen ──────────────────────────── */
.auth-screen {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; padding: 1.5rem;
  background: var(--bg);
}
.auth-box {
  background: var(--surface); border: 0.5px solid var(--border);
  border-radius: var(--radius-lg); padding: 2rem;
  width: 100%; max-width: 400px; text-align: center;
}
.auth-logo {
  width: 52px; height: 52px; background: var(--primary);
  border-radius: 14px; display: flex; align-items: center;
  justify-content: center; font-size: 26px; color: #fff;
  margin: 0 auto 1.25rem;
}
.auth-box h1 { font-size: 20px; font-weight: 500; margin-bottom: 6px; }
.auth-box p  { font-size: 14px; color: var(--text-2); margin-bottom: 1.5rem; }

/* ── Toast ────────────────────────────────── */
.toast-wrap { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); z-index: 200; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.toast {
  background: #2C2C2A; color: #F0F0EC;
  padding: 10px 18px; border-radius: var(--radius-md);
  font-size: 13px; animation: toast-in .2s ease;
  pointer-events: auto;
}
@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* ── Filters ──────────────────────────────── */
.filter-row { display: flex; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; }
.filter-btn { padding: 5px 12px; border-radius: 20px; font-size: 13px; border: 0.5px solid var(--border-md); background: transparent; cursor: pointer; color: var(--text-2); transition: all .12s; }
.filter-btn:hover { background: var(--bg); }
.filter-btn.active { background: var(--primary-light); color: var(--primary-dark); border-color: transparent; font-weight: 500; }

/* ── Book grid ────────────────────────────── */
.book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--gap); }
.book-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; cursor: pointer; transition: border-color .15s, transform .15s; }
.book-card:hover { border-color: var(--border-md); transform: translateY(-2px); }
.book-cover { width: 100%; height: 72px; border-radius: var(--radius-md); margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
.book-add   { border: 1.5px dashed var(--border-md); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--text-3); min-height: 140px; }
.book-add:hover { border-color: var(--primary); color: var(--primary); }

/* ── Responsive ───────────────────────────── */
@media (max-width: 600px) {
  .sidebar { width: 56px; }
  .sidebar-logo span, .nav-item span, .nav-label,
  .sidebar-footer { display: none; }
  .nav-item { justify-content: center; }
  .page-wrap { padding: 1rem; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .book-grid  { grid-template-columns: 1fr 1fr; }
}

/* ── Utility ──────────────────────────────── */
.gap-row { display: flex; gap: var(--gap); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
.hidden  { display: none !important; }
.mt-1    { margin-top: 0.5rem; }
.mt-2    { margin-top: 1rem; }
.text-muted { color: var(--text-2); font-size: 13px; }

/* 스크롤바 */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-md); border-radius: 4px; }
