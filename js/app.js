// =============================================
// app.js - 메인 앱 컨트롤러
// =============================================

const App = (() => {
  let members = [];
  let currentPage = 'dashboard';

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
    `, { closeOnBackdrop: false });
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

  function getMembers()        { return members; }
  function getMemberById(uid)  { return members.find(m => m.id === uid); }
  function getMemberColor(uid) {
    const m = getMemberById(uid);
    return m?.color || Auth.MEMBER_COLORS[0];
  }
  function getMyUid()    { return Auth.getCurrentUser()?.uid; }
  function getMyRole()   {
    const me = members.find(m => m.id === getMyUid());
    return me?.role || 'child';
  }

  return { init, navigate, getMembers, getMemberById, getMemberColor, getMyUid, getMyRole, copyCode, refreshCode };
})();

// ══════════════════════════════════════════
// Modal — 바깥 클릭 방지 옵션 추가
// ══════════════════════════════════════════
const Modal = {
  _closeOnBackdrop: false,  // 기본값: 바깥 클릭해도 안 닫힘
  open(html, opts = {}) {
    this._closeOnBackdrop = opts.closeOnBackdrop ?? false;
    const maxWidth = opts.wide ? '860px' : '520px';
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal" style="max-width:${maxWidth}">${html}</div>
      </div>
    `;
    document.getElementById('modalBackdrop').addEventListener('click', e => {
      if (e.target === e.currentTarget && this._closeOnBackdrop) this.close();
    });
  },
  close() { document.getElementById('modalRoot').innerHTML = ''; }
};

// ── Toast ─────────────────────────────────
function toast(msg, duration = 3000) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── 공개범위 토글 ─────────────────────────
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

// ── 별점 UI ──────────────────────────────
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

// ── 날짜 포맷 ─────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 댓글 컴포넌트 ─────────────────────────
const Comments = {
  async load(collection, docId) {
    const fam = Auth.getCurrentFamily();
    const snap = await db.collection('families').doc(fam.id)
      .collection(collection).doc(docId)
      .collection('comments').orderBy('createdAt').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async add(collection, docId, text) {
    const fam = Auth.getCurrentFamily();
    const me = App.getMemberById(App.getMyUid());
    return db.collection('families').doc(fam.id)
      .collection(collection).doc(docId)
      .collection('comments').add({
        text,
        authorId: App.getMyUid(),
        authorName: me?.name || '알 수 없음',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  },

  async remove(collection, docId, commentId) {
    const fam = Auth.getCurrentFamily();
    return db.collection('families').doc(fam.id)
      .collection(collection).doc(docId)
      .collection('comments').doc(commentId).delete();
  },

  // 댓글 UI 렌더링 (모달 내부용)
  async renderSection(collection, docId) {
    const comments = await this.load(collection, docId);
    const myUid = App.getMyUid();
    const members = App.getMembers();

    return `
      <div style="border-top:0.5px solid var(--border);margin-top:1.25rem;padding-top:1rem">
        <div style="font-size:13px;font-weight:500;margin-bottom:10px;color:var(--text-2)">
          <i class="ti ti-message-circle"></i> 댓글 ${comments.length > 0 ? `(${comments.length})` : ''}
        </div>
        <div id="commentList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
          ${comments.length === 0
            ? '<p style="font-size:12px;color:var(--text-3)">아직 댓글이 없어요</p>'
            : comments.map(c => {
                const m = members.find(x => x.id === c.authorId);
                const color = m?.color || Auth.MEMBER_COLORS[0];
                return `
                  <div style="display:flex;gap:8px;align-items:flex-start">
                    <div class="avatar" style="width:24px;height:24px;font-size:10px;flex-shrink:0;background:${color.bg};color:${color.text}">
                      ${(c.authorName||'?').slice(0,2)}
                    </div>
                    <div style="flex:1;background:var(--bg);border-radius:var(--radius-md);padding:7px 10px">
                      <div style="font-size:11px;font-weight:500;color:var(--text-2);margin-bottom:2px">${escHtml(c.authorName)}</div>
                      <div style="font-size:13px;color:var(--text)">${escHtml(c.text)}</div>
                    </div>
                    ${c.authorId === myUid
                      ? `<button class="btn btn-icon btn-sm btn-danger" style="padding:3px"
                           onclick="Comments._del('${collection}','${docId}','${c.id}')">
                           <i class="ti ti-x" style="font-size:12px"></i>
                         </button>`
                      : ''}
                  </div>
                `;
              }).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="commentInput" placeholder="댓글을 입력하세요..." style="flex:1;font-size:13px;padding:6px 10px">
          <button class="btn btn-primary btn-sm" onclick="Comments._submit('${collection}','${docId}')">
            <i class="ti ti-send"></i>
          </button>
        </div>
      </div>
    `;
  },

  async _submit(collection, docId) {
    const input = document.getElementById('commentInput');
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    await this.add(collection, docId, text);
    // 댓글 목록 새로고침
    const section = input.closest('[id]')?.parentElement;
    const newHtml = await this.renderSection(collection, docId);
    const wrap = document.querySelector('#commentList')?.parentElement;
    if (wrap) wrap.outerHTML = newHtml;
    toast('댓글이 등록됐어요!');
  },

  async _del(collection, docId, commentId) {
    await this.remove(collection, docId, commentId);
    const newHtml = await this.renderSection(collection, docId);
    const wrap = document.querySelector('#commentList')?.parentElement;
    if (wrap) wrap.outerHTML = newHtml;
    toast('삭제됐어요');
  }
};

document.addEventListener('DOMContentLoaded', App.init);
