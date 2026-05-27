// =============================================
// pages/edu.js - 열심히 공부
// =============================================

Pages.Edu = {
  _members: [], _books: [], _elihigh: [], _workbooks: [],
  _filterType: 'book', _filterMember: null,

  async render(wrap, members) {
    this._members = members;
    await this._load();
    this._renderAll(wrap);
  },

  async _load() {
    const [books, elihigh, workbooks] = await Promise.all([
      DB.Books.list(), DB.Elihigh.list(), DB.Workbooks.list()
    ]);
    this._books = books;
    this._elihigh = elihigh;
    this._workbooks = workbooks;
  },

  _renderAll(wrap) {
    const me = this;
    const isParent = App.getMyRole() === 'parent';
    const children = this._members.filter(m => m.role === 'child');

    wrap.innerHTML = `
      <div class="page-hd">
        <div><h1>열심히 공부</h1><p>독서 감상문 · 엘리하이 · 문제집</p></div>
        ${isParent ? `<button class="btn btn-primary" id="btnAddEdu"><i class="ti ti-plus"></i> 추가</button>` : ''}
      </div>
      <div class="filter-row" id="typeFilter">
        <button class="filter-btn active" data-type="book">📚 독서 감상문</button>
        <button class="filter-btn" data-type="eli">📺 엘리하이</button>
        <button class="filter-btn" data-type="wb">📖 문제집</button>
      </div>
      <div class="filter-row" id="memberFilter">
        <button class="filter-btn active" data-mid="">전체</button>
        ${children.map(m => `<button class="filter-btn" data-mid="${m.id}">${m.name}</button>`).join('')}
      </div>
      <div id="eduContent"></div>
    `;

    this._renderContent(wrap.querySelector('#eduContent'));

    wrap.querySelector('#typeFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn'); if (!btn) return;
      wrap.querySelectorAll('#typeFilter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      me._filterType = btn.dataset.type;
      me._renderContent(wrap.querySelector('#eduContent'));
    });

    wrap.querySelector('#memberFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn'); if (!btn) return;
      wrap.querySelectorAll('#memberFilter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      me._filterMember = btn.dataset.mid || null;
      me._renderContent(wrap.querySelector('#eduContent'));
    });

    if (isParent) {
      wrap.querySelector('#btnAddEdu').addEventListener('click', () => {
        if (me._filterType === 'book') me._showBookForm();
        else if (me._filterType === 'eli') me._showEliForm();
        else me._showWbForm();
      });
    }
  },

  _renderContent(el) {
    if (this._filterType === 'book') this._renderBooks(el);
    else if (this._filterType === 'eli') this._renderEli(el);
    else this._renderWb(el);
  },

  // ══════════════════════════════════════════
  // 📚 독서 감상문
  // ══════════════════════════════════════════
  _renderBooks(el) {
    const me = this;
    let books = this._books;
    if (this._filterMember) books = books.filter(b => b.authorId === this._filterMember);
    const myUid = App.getMyUid();
    const isParent = App.getMyRole() === 'parent';

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-book-2" style="color:var(--primary)"></i>독서 감상문 (${books.length})</div>
          <button class="btn btn-primary btn-sm" id="btnAddBook"><i class="ti ti-plus"></i> 추가</button>
        </div>
        <div class="book-grid">
          ${books.map(b => me._bookCard(b, myUid, isParent)).join('')}
        </div>
      </div>
    `;

    el.querySelector('#btnAddBook').addEventListener('click', () => me._showBookForm());

    el.querySelectorAll('.book-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        const b = me._books.find(x => x.id === card.dataset.id);
        if (b) me._showBookDetail(b);
      });
    });

    el.querySelectorAll('.btn-edit-book').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const b = me._books.find(x => x.id === btn.dataset.id);
        if (b) me._showBookForm(b);
      });
    });

    el.querySelectorAll('.btn-del-book').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('삭제할까요?')) return;
        await DB.Books.remove(btn.dataset.id);
        me._books = me._books.filter(b => b.id !== btn.dataset.id);
        me._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _bookCard(b, myUid, isParent) {
    const m = this._members.find(x => x.id === b.authorId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const stars = '★'.repeat(b.rating || 0) + '☆'.repeat(5 - (b.rating || 0));
    const readStatus = b.finished ? '완독 ✅' : (b.lastPage ? `${b.lastPage}p까지` : '읽는 중');
    const canEdit = b.authorId === myUid;
    const canDel  = b.authorId === myUid || isParent;
    return `
      <div class="book-card" data-id="${b.id}" style="cursor:pointer">
        <div class="book-cover" style="background:${color.bg}">📚</div>
        <div style="font-size:13px;font-weight:500;line-height:1.4;margin-bottom:2px">${escHtml(b.title)}</div>
        ${b.publisher ? `<div style="font-size:11px;color:var(--text-3)">${escHtml(b.publisher)}</div>` : ''}
        <div style="font-size:11px;color:var(--text-3);margin-top:2px">${m?.name || ''} · ${formatDate(b.date)}</div>
        <div style="color:var(--amber);font-size:11px;margin-top:2px">${stars}</div>
        <div style="font-size:11px;margin-top:3px;color:${b.finished ? 'var(--primary)' : 'var(--amber)'};font-weight:500">${readStatus}</div>
        <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between">
          <span class="badge ${b.shared ? 'badge-shared' : 'badge-private'}">${b.shared ? '공유' : '나만'}</span>
          <div style="display:flex;gap:3px" onclick="event.stopPropagation()">
            ${canEdit ? `<button class="btn btn-sm btn-edit-book" data-id="${b.id}" title="수정"><i class="ti ti-edit"></i></button>` : ''}
            ${canDel  ? `<button class="btn btn-sm btn-danger btn-del-book" data-id="${b.id}" title="삭제"><i class="ti ti-trash"></i></button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  async _showBookDetail(b) {
    const m = this._members.find(x => x.id === b.authorId);
    const stars = '★'.repeat(b.rating || 0);
    const commentHtml = await Comments.renderSection('books', b.id);
    Modal.open(`
      <div class="modal-hd">
        <h2>${escHtml(b.title)}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="font-size:13px;color:var(--text-3);margin-bottom:1rem;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${b.publisher ? `<span>${escHtml(b.publisher)}</span><span>·</span>` : ''}
        <span>${m?.name || ''}</span><span>·</span><span>${formatDate(b.date)}</span>
        <span style="color:var(--amber)">${stars}</span>
        <span style="color:${b.finished ? 'var(--primary)' : 'var(--amber)'}">
          ${b.finished ? '완독 ✅' : (b.lastPage ? `${b.lastPage}p까지 읽음` : '읽는 중')}
        </span>
      </div>
      <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;max-height:260px;overflow-y:auto">${escHtml(b.content || '감상문이 없어요.')}</div>
      ${commentHtml}
    `, { wide: true });
  },

  _showBookForm(existing = null) {
    const me = this;
    let shared  = existing?.shared  ?? true;
    let rating  = existing?.rating  ?? 0;
    let finished = existing?.finished ?? true;

    Modal.open(`
      <div class="modal-hd">
        <h2>${existing ? '독서 감상문 수정' : '새 독서 감상문'}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">책 제목 *</label>
          <input class="form-input" id="bookTitle" placeholder="책 제목" value="${escHtml(existing?.title || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">출판사</label>
          <input class="form-input" id="bookPublisher" placeholder="출판사" value="${escHtml(existing?.publisher || '')}">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">읽은 날짜</label>
          <input class="form-input" type="date" id="bookDate" value="${existing?.date || todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">별점</label>
          <div id="starWrap"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">독서 상태</label>
        <div style="display:flex;gap:12px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="readStatus" value="done" ${finished ? 'checked' : ''}> 완독 ✅
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="readStatus" value="partial" ${!finished ? 'checked' : ''}> 일부만 읽음
          </label>
        </div>
        <div id="lastPageWrap" style="${!finished ? '' : 'display:none;'}margin-top:8px">
          <input class="form-input" type="number" id="bookLastPage" placeholder="몇 페이지까지 읽었나요?" value="${existing?.lastPage || ''}" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="display:flex;justify-content:space-between">
          <span>감상문</span>
          <span id="charCount" style="font-size:11px;color:var(--text-3);font-weight:400">0자</span>
        </label>
        <textarea class="form-textarea" id="bookContent" placeholder="느낀 점을 자유롭게 써주세요" style="min-height:130px">${escHtml(existing?.content || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">공개 범위</label>
        <div id="shareWrap"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveBook">${existing ? '수정' : '저장'}</button>
      </div>
    `, { wide: true });

    // 글자수
    const ta = document.getElementById('bookContent');
    const cc = document.getElementById('charCount');
    cc.textContent = `${ta.value.length}자`;
    ta.addEventListener('input', () => { cc.textContent = `${ta.value.length}자`; });

    // 독서 상태 토글
    document.querySelectorAll('input[name="readStatus"]').forEach(r => {
      r.addEventListener('change', () => {
        finished = r.value === 'done';
        document.getElementById('lastPageWrap').style.display = finished ? 'none' : 'block';
      });
    });

    const starObj = createStarInput(rating, v => { rating = v; });
    document.getElementById('starWrap').appendChild(starObj.el);

    const shareToggle = createShareToggle(shared, v => { shared = v; });
    document.getElementById('shareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveBook').addEventListener('click', async () => {
      const title     = document.getElementById('bookTitle').value.trim();
      const publisher = document.getElementById('bookPublisher').value.trim();
      const date      = document.getElementById('bookDate').value;
      const content   = document.getElementById('bookContent').value.trim();
      const lastPage  = finished ? null : (parseInt(document.getElementById('bookLastPage').value) || null);
      if (!title) { toast('책 제목을 입력해 주세요.'); return; }

      const data = { title, publisher, date, content, rating: starObj.getVal(), shared, finished, lastPage };
      try {
        if (existing) {
          await DB.Books.update(existing.id, data);
          me._books = me._books.map(b => b.id === existing.id ? { ...b, ...data } : b);
          toast('수정됐어요! ✏️');
        } else {
          const ref = await DB.Books.add(data);
          me._books.unshift({ id: ref.id, ...data, authorId: App.getMyUid() });
          toast('독서 감상문이 저장됐어요! 📚');
        }
        Modal.close();
        me._renderContent(document.getElementById('eduContent'));
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  // ══════════════════════════════════════════
  // 📺 엘리하이
  // ══════════════════════════════════════════
  _renderEli(el) {
    const me = this;
    const isParent = App.getMyRole() === 'parent';
    const myUid = App.getMyUid();
    let eli = this._elihigh;
    if (this._filterMember) eli = eli.filter(e => e.subjectId === this._filterMember);

    const byDate = {};
    eli.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-device-laptop" style="color:var(--blue)"></i>엘리하이 기록 (${eli.length})</div>
          <button class="btn btn-primary btn-sm" id="btnAddEli"><i class="ti ti-plus"></i> 오늘 기록</button>
        </div>
        ${dates.length === 0 ? '<p class="text-muted">아직 기록이 없어요</p>'
          : dates.map(date => `
            <div style="margin-bottom:1rem">
              <div style="font-size:12px;font-weight:500;color:var(--text-3);margin-bottom:6px">${formatDate(date)}</div>
              ${byDate[date].map(e => me._eliItem(e, isParent, myUid)).join('')}
            </div>
          `).join('')}
      </div>
    `;

    el.querySelector('#btnAddEli').addEventListener('click', () => me._showEliForm());

    el.querySelectorAll('.btn-eli-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const e = me._elihigh.find(x => x.id === btn.dataset.id);
        if (e) me._showEliForm(e);
      });
    });

    el.querySelectorAll('.btn-eli-approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        await DB.Elihigh.parentApprove(btn.dataset.id);
        await me._load();
        me._renderContent(el);
        toast('승인됐어요! ✅');
      });
    });

    el.querySelectorAll('.btn-eli-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('삭제할까요?')) return;
        await DB.Elihigh.remove(btn.dataset.id);
        await me._load();
        me._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _eliItem(e, isParent, myUid) {
    const m = this._members.find(x => x.id === e.subjectId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const statusBg    = e.completed ? 'var(--primary-light)' : 'var(--amber-light)';
    const statusColor = e.completed ? 'var(--primary-dark)' : '#412402';
    const statusLabel = e.completed ? (e.parentApproved ? '완료 ✅ (부모승인)' : '완료 ✅') : '미완료 ⏳';
    const canEdit = e.subjectId === myUid || isParent;
    const canDel  = isParent;
    return `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--bg);border-radius:var(--radius-md);margin-bottom:6px">
        <div class="avatar" style="width:28px;height:28px;font-size:11px;background:${color.bg};color:${color.text};flex-shrink:0">${(m?.name || '?').slice(0, 2)}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:500">${escHtml(m?.name || '')}</span>
            <span style="font-size:11px;background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:20px;font-weight:500">${statusLabel}</span>
          </div>
          ${e.content ? `<div style="font-size:12px;color:var(--text-2);margin-top:3px">📖 ${escHtml(e.content)}</div>` : ''}
        </div>
        <div style="display:flex;gap:3px;flex-shrink:0">
          ${canEdit ? `<button class="btn btn-sm btn-eli-edit" data-id="${e.id}" title="수정"><i class="ti ti-edit"></i></button>` : ''}
          ${isParent && !e.completed ? `<button class="btn btn-sm btn-primary btn-eli-approve" data-id="${e.id}" style="font-size:11px;padding:3px 8px">승인</button>` : ''}
          ${canDel  ? `<button class="btn btn-sm btn-danger btn-eli-del" data-id="${e.id}" title="삭제"><i class="ti ti-trash"></i></button>` : ''}
        </div>
      </div>
    `;
  },

  _showEliForm(existing = null) {
    const me = this;
    const isParent = App.getMyRole() === 'parent';
    const myUid = App.getMyUid();
    const children = this._members.filter(m => m.role === 'child');

    Modal.open(`
      <div class="modal-hd">
        <h2>${existing ? '엘리하이 기록 수정' : '엘리하이 기록 추가'}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      ${isParent ? `
      <div class="form-group">
        <label class="form-label">자녀 선택</label>
        <select class="form-select" id="eliChild">
          ${children.map(c => `<option value="${c.id}" ${existing?.subjectId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>` : `<input type="hidden" id="eliChild" value="${myUid}">`}
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="eliDate" value="${existing?.date || todayStr()}">
      </div>
      <div class="form-group">
        <label class="form-label">완료 여부</label>
        <div style="display:flex;gap:12px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="eliStatus" value="done" ${existing?.completed ? 'checked' : ''}> 완료 ✅
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="eliStatus" value="undone" ${!existing?.completed ? 'checked' : ''}> 미완료 ⏳
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">학습 과목 / 콘텐츠</label>
        <input class="form-input" id="eliContent" placeholder="예) 수학 - 분수의 덧셈, 영어 - 파닉스 3강" value="${escHtml(existing?.content || '')}">
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveEli">${existing ? '수정' : '저장'}</button>
      </div>
    `);

    document.getElementById('btnSaveEli').addEventListener('click', async () => {
      const subjectId = document.getElementById('eliChild').value;
      const date      = document.getElementById('eliDate').value;
      const completed = document.querySelector('input[name="eliStatus"]:checked').value === 'done';
      const content   = document.getElementById('eliContent').value.trim();
      try {
        if (existing) {
          await db.collection('families').doc(Auth.getCurrentFamily().id)
            .collection('elihigh').doc(existing.id)
            .update({ subjectId, date, completed, content });
          me._elihigh = me._elihigh.map(x => x.id === existing.id ? { ...x, subjectId, date, completed, content } : x);
          toast('수정됐어요! ✏️');
        } else {
          const ref = await DB.Elihigh.add({ subjectId, date, completed, content });
          me._elihigh.unshift({ id: ref.id, subjectId, date, completed, content, parentApproved: false });
          toast('기록됐어요!');
        }
        Modal.close();
        me._renderContent(document.getElementById('eduContent'));
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  // ══════════════════════════════════════════
  // 📖 문제집
  // ══════════════════════════════════════════
  _renderWb(el) {
    const me = this;
    const isParent = App.getMyRole() === 'parent';
    const myUid = App.getMyUid();
    let wbs = this._workbooks;
    if (this._filterMember) wbs = wbs.filter(w => w.assignedTo === this._filterMember);

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-books" style="color:var(--purple)"></i>문제집 (${wbs.length})</div>
          ${isParent ? `<button class="btn btn-primary btn-sm" id="btnAddWb"><i class="ti ti-plus"></i> 문제집 추가</button>` : ''}
        </div>
        ${wbs.length === 0 ? '<p class="text-muted">등록된 문제집이 없어요</p>'
          : wbs.map(wb => me._wbCard(wb, isParent, myUid)).join('')}
      </div>
    `;

    el.querySelector('#btnAddWb')?.addEventListener('click', () => me._showWbForm());

    el.querySelectorAll('.btn-wb-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const wb = me._workbooks.find(x => x.id === btn.dataset.id);
        if (wb) me._showWbForm(wb);
      });
    });

    el.querySelectorAll('.btn-wb-log').forEach(btn => {
      btn.addEventListener('click', () => me._showWbLogForm(btn.dataset.id));
    });

    el.querySelectorAll('.btn-wb-detail').forEach(btn => {
      btn.addEventListener('click', () => me._showWbDetail(btn.dataset.id));
    });

    el.querySelectorAll('.btn-wb-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('문제집을 삭제할까요?')) return;
        await DB.Workbooks.remove(btn.dataset.id);
        me._workbooks = me._workbooks.filter(w => w.id !== btn.dataset.id);
        me._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _wbCard(wb, isParent, myUid) {
    const m = this._members.find(x => x.id === wb.assignedTo);
    const color = m?.color || Auth.MEMBER_COLORS[2];
    const isMyWb = wb.assignedTo === myUid;
    return `
      <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:14px;font-weight:500">${escHtml(wb.title)}</div>
            ${wb.publisher ? `<div style="font-size:12px;color:var(--text-3)">${escHtml(wb.publisher)}</div>` : ''}
            <div style="font-size:12px;color:var(--text-2);margin-top:4px;display:flex;align-items:center;gap:6px">
              <div class="avatar" style="width:18px;height:18px;font-size:9px;background:${color.bg};color:${color.text}">${(m?.name || '?').slice(0, 2)}</div>
              ${m?.name || ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
            ${isMyWb || isParent ? `<button class="btn btn-sm btn-wb-log" data-id="${wb.id}" style="font-size:11px">오늘 기록</button>` : ''}
            <button class="btn btn-sm btn-wb-detail" data-id="${wb.id}" style="font-size:11px">기록 보기</button>
            ${isParent ? `<button class="btn btn-sm btn-wb-edit" data-id="${wb.id}" title="수정"><i class="ti ti-edit"></i></button>` : ''}
            ${isParent ? `<button class="btn btn-sm btn-danger btn-wb-del" data-id="${wb.id}" title="삭제"><i class="ti ti-trash"></i></button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  _showWbForm(existing = null) {
    const me = this;
    const children = this._members.filter(m => m.role === 'child');

    Modal.open(`
      <div class="modal-hd">
        <h2>${existing ? '문제집 수정' : '문제집 추가'}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">문제집 이름 *</label>
          <input class="form-input" id="wbTitle" placeholder="예) 쎈 수학 5-1" value="${escHtml(existing?.title || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">출판사</label>
          <input class="form-input" id="wbPublisher" placeholder="예) 좋은책신사고" value="${escHtml(existing?.publisher || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">할당할 자녀 *</label>
        <select class="form-select" id="wbChild">
          ${children.map(c => `<option value="${c.id}" ${existing?.assignedTo === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveWb">${existing ? '수정' : '추가'}</button>
      </div>
    `);

    document.getElementById('btnSaveWb').addEventListener('click', async () => {
      const title      = document.getElementById('wbTitle').value.trim();
      const publisher  = document.getElementById('wbPublisher').value.trim();
      const assignedTo = document.getElementById('wbChild').value;
      if (!title) { toast('문제집 이름을 입력해 주세요.'); return; }
      try {
        if (existing) {
          await db.collection('families').doc(Auth.getCurrentFamily().id)
            .collection('workbooks').doc(existing.id)
            .update({ title, publisher, assignedTo });
          me._workbooks = me._workbooks.map(w => w.id === existing.id ? { ...w, title, publisher, assignedTo } : w);
          toast('수정됐어요! ✏️');
        } else {
          const ref = await DB.Workbooks.add({ title, publisher, assignedTo });
          me._workbooks.unshift({ id: ref.id, title, publisher, assignedTo, authorId: App.getMyUid() });
          toast('문제집이 추가됐어요! 📖');
        }
        Modal.close();
        me._renderContent(document.getElementById('eduContent'));
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  async _showWbDetail(wbId) {
    const wb = this._workbooks.find(w => w.id === wbId);
    const logs = await DB.Workbooks.listLogs(wbId);
    const isParent = App.getMyRole() === 'parent';
    const commentHtml = await Comments.renderSection('workbooks', wbId);

    Modal.open(`
      <div class="modal-hd">
        <h2>${escHtml(wb?.title || '')}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      ${wb?.publisher ? `<p style="font-size:13px;color:var(--text-3);margin-bottom:1rem">${escHtml(wb.publisher)}</p>` : ''}
      <div style="margin-bottom:1rem">
        ${logs.length === 0 ? '<p class="text-muted">아직 기록이 없어요</p>'
          : logs.map(log => {
              const statusBg    = log.completed ? 'var(--primary-light)' : 'var(--amber-light)';
              const statusColor = log.completed ? 'var(--primary-dark)' : '#412402';
              const statusLabel = log.completed ? (log.parentApproved ? '완료 ✅ (승인)' : '완료 ✅') : '미완료 ⏳';
              return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:var(--radius-md);margin-bottom:6px">
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:500">${formatDate(log.date)}</div>
                    ${log.memo ? `<div style="font-size:12px;color:var(--text-2)">${escHtml(log.memo)}</div>` : ''}
                  </div>
                  <span style="font-size:11px;background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:20px;font-weight:500">${statusLabel}</span>
                  <button class="btn btn-sm" onclick="Pages.Edu._showWbLogEditForm('${wbId}','${log.id}','${log.date}',${log.completed},'${escHtml(log.memo || '')}')" title="수정"><i class="ti ti-edit"></i></button>
                  ${isParent && !log.completed ? `<button class="btn btn-sm btn-primary" onclick="Pages.Edu._approveLog('${wbId}','${log.id}')" style="font-size:11px;padding:3px 8px">승인</button>` : ''}
                </div>
              `;
            }).join('')}
      </div>
      ${commentHtml}
    `, { wide: true });
  },

  _showWbLogEditForm(wbId, logId, date, completed, memo) {
    Modal.open(`
      <div class="modal-hd">
        <h2>기록 수정</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="wbLogEditDate" value="${date}">
      </div>
      <div class="form-group">
        <label class="form-label">완료 여부</label>
        <div style="display:flex;gap:12px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="wbEditStatus" value="done" ${completed === true || completed === 'true' ? 'checked' : ''}> 완료 ✅
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="wbEditStatus" value="undone" ${completed !== true && completed !== 'true' ? 'checked' : ''}> 미완료 ⏳
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <input class="form-input" id="wbLogEditMemo" value="${memo}" placeholder="예) p.34~40">
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveWbLogEdit">수정</button>
      </div>
    `);

    document.getElementById('btnSaveWbLogEdit').addEventListener('click', async () => {
      const newDate      = document.getElementById('wbLogEditDate').value;
      const newCompleted = document.querySelector('input[name="wbEditStatus"]:checked').value === 'done';
      const newMemo      = document.getElementById('wbLogEditMemo').value.trim();
      try {
        await db.collection('families').doc(Auth.getCurrentFamily().id)
          .collection('workbooks').doc(wbId)
          .collection('logs').doc(logId)
          .update({ date: newDate, completed: newCompleted, memo: newMemo });
        toast('수정됐어요! ✏️');
        Modal.close();
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  async _approveLog(wbId, logId) {
    await DB.Workbooks.parentApproveLog(wbId, logId);
    toast('승인됐어요! ✅');
    Modal.close();
  },

  _showWbLogForm(wbId) {
    const wb = this._workbooks.find(w => w.id === wbId);
    Modal.open(`
      <div class="modal-hd">
        <h2>${escHtml(wb?.title || '')} — 오늘 기록</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="wbLogDate" value="${todayStr()}">
      </div>
      <div class="form-group">
        <label class="form-label">완료 여부</label>
        <div style="display:flex;gap:12px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="wbStatus" value="done"> 완료 ✅
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="wbStatus" value="undone" checked> 미완료 ⏳
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">메모 (오늘 한 범위 등)</label>
        <input class="form-input" id="wbLogMemo" placeholder="예) p.34~40, 1단원 마무리">
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveWbLog">저장</button>
      </div>
    `);

    document.getElementById('btnSaveWbLog').addEventListener('click', async () => {
      const date      = document.getElementById('wbLogDate').value;
      const completed = document.querySelector('input[name="wbStatus"]:checked').value === 'done';
      const memo      = document.getElementById('wbLogMemo').value.trim();
      try {
        await DB.Workbooks.addLog(wbId, { date, completed, memo });
        toast('기록됐어요!');
        Modal.close();
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  }
};
