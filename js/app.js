// =============================================
// app.js - 메인 앱 컨트롤러
// =============================================

const App = (() => {
  let members = [];
  let currentPage = 'dashboard';

  // ── 초기화 ────────────────────────────────
  async function init() {
    Auth.onAuthReady(async ({ user, family }) => {
      if (!user || !family) {
        window.location.href = 'login.html';
        return;
      }
      document.getElementById('appLayout').style.display = 'flex';
      document.getElementById('famNameDisplay').textContent = family.name || '우리 가족';

      members = await Auth.getFamilyMembers();
      renderMemberList();
      bindNav();
      navigate('dashboard');
    });
  }

  // ── 구성원 목록 렌더링 ─────────────────────
  function renderMemberList() {
    const wrap = document.getElementById('memberList');
    wrap.innerHTML = members.map(m => {
      const initials = m.name.slice(0, 2);
      const color = m.color || Auth.MEMBER_COLORS[0];
      return `
        <div class="member-item">
          <div class="avatar" style="width:26px;height:26px;font-size:11px;background:${color.bg};color:${color.text}">${initials}</div>
          <span>${m.name} <span style="font-size:11px;color:var(--text-3)">${m.role === 'parent' ? '부모' : '자녀'}</span></span>
        </div>
      `;
    }).join('');
  }

  // ── 네비게이션 바인딩 ─────────────────────
  function bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });

    document.getElementById('btnLogout').addEventListener('click', async () => {
      await Auth.logout();
      window.location.href = 'login.html';
    });

    document.getElementById('btnSettings').addEventListener('click', () => showSettings());
  }

  // ── 페이지 전환 ───────────────────────────
  async function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    const wrap = document.getElementById('pageContent');
    wrap.innerHTML = '<div style="padding:2rem;color:var(--text-3);font-size:14px">로딩 중...</div>';

    switch (page) {
      case 'dashboard': await Pages.Dashboard.render(wrap, members); break;
      case 'edu':       await Pages.Edu.render(wrap, members); break;
      case 'calendar':  await Pages.Calendar.render(wrap, members); break;
      case 'todo':      await Pages.Todo.render(wrap, members); break;
      case 'growth':    await Pages.Growth.render(wrap, members); break;
    }
  }

  // ── 설정 모달 ─────────────────────────────
  function showSettings() {
    const fam = Auth.getCurrentFamily();
    Modal.open(`
      <div class="modal-hd">
        <h2>설정</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">초대 코드</label>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;background:var(--primary-light);color:var(--primary-dark);
                      border-radius:var(--radius-md);padding:9px 14px;font-size:15px;
                      font-weight:500;letter-spacing:.12em" id="settingsCode">
            ${fam.inviteCode}
          </div>
          <button class="btn" onclick="App.copyCode()"><i class="ti ti-copy"></i></button>
        </div>
        <p style="font-size:12px;color:var(--text-3);margin-top:5px">이 코드를 가족에게 공유하면 함께 사용할 수 있어요.</p>
      </div>
      <button class="btn btn-danger btn-sm" onclick="App.refreshCode()">
        <i class="ti ti-refresh"></i> 코드 재발급
      </button>
    `);
  }

  async function copyCode() {
    const code = document.getElementById('settingsCode')?.textContent.trim();
    if (code) { await navigator.clipboard.writeText(code); toast('초대 코드가 복사됐어요!'); }
  }

  async function refreshCode() {
    if (!confirm('초대 코드를 재발급하면 기존 코드로 합류할 수 없어요. 계속할까요?')) return;
    const code = await Auth.refreshInviteCode();
    const el = document.getElementById('settingsCode');
    if (el) el.textContent = code;
    toast('새 초대 코드가 발급됐어요!');
  }

  function getMembers() { return members; }
  function getMemberById(uid) { return members.find(m => m.id === uid); }
  function getMemberColor(uid) {
    const m = getMemberById(uid);
    return m?.color || Auth.MEMBER_COLORS[0];
  }
  function getMyUid() { return Auth.getCurrentUser()?.uid; }

  return { init, navigate, getMembers, getMemberById, getMemberColor, getMyUid, copyCode, refreshCode };
})();

// ── Modal 유틸 ──────────────────────────────
const Modal = {
  open(html) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" onclick="Modal.backdropClick(event)">
        <div class="modal">${html}</div>
      </div>
    `;
  },
  close() { document.getElementById('modalRoot').innerHTML = ''; },
  backdropClick(e) { if (e.target === e.currentTarget) Modal.close(); }
};

// ── Toast 유틸 ──────────────────────────────
function toast(msg, duration = 3000) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── 공개범위 토글 UI ─────────────────────────
function createShareToggle(defaultShared = true, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'share-toggle';
  wrap.innerHTML = `
    <div class="share-opt${defaultShared ? ' active' : ''}" data-val="true">
      <i class="ti ti-users"></i> 가족 공유
    </div>
    <div class="share-opt${!defaultShared ? ' active' : ''}" data-val="false">
      <i class="ti ti-lock"></i> 나만
    </div>
  `;
  wrap.querySelectorAll('.share-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      wrap.querySelectorAll('.share-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      if (onChange) onChange(opt.dataset.val === 'true');
    });
  });
  return wrap;
}

// ── 별점 UI ─────────────────────────────────
function createStarInput(defaultVal = 0, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'stars-input';
  let val = defaultVal;
  const render = () => {
    wrap.innerHTML = [1,2,3,4,5].map(n =>
      `<button class="star-btn${val >= n ? ' on' : ''}" data-n="${n}" type="button">★</button>`
    ).join('');
    wrap.querySelectorAll('.star-btn').forEach(b => {
      b.addEventListener('click', () => {
        val = parseInt(b.dataset.n);
        render();
        if (onChange) onChange(val);
      });
    });
  };
  render();
  return { el: wrap, getVal: () => val };
}

// ── 날짜 포맷 ────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── 앱 시작 ──────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);
