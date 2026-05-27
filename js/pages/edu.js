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
    this._books = books; this._elihigh = elihigh; this._workbooks = workbooks;
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
        ${children.map(m=>`<button class="filter-btn" data-mid="${m.id}">${m.name}</button>`).join('')}
      </div>
      <div id="eduContent"></div>
    `;

    this._renderContent(wrap.querySelector('#eduContent'));

    wrap.querySelector('#typeFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn'); if (!btn) return;
      wrap.querySelectorAll('#typeFilter .filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); me._filterType = btn.dataset.type;
      me._renderContent(wrap.querySelector('#eduContent'));
    });
    wrap.querySelector('#memberFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn'); if (!btn) return;
      wrap.querySelectorAll('#memberFilter .filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); me._filterMember = btn.dataset.mid || null;
      me._renderContent(wrap.querySelector('#eduContent'));
    });
    if (isParent) {
      wrap.querySelector('#btnAddEdu').addEventListener('click', () => {
        if (me._filterType==='book') me._showBookForm();
        else if (me._filterType==='eli') me._showEliForm();
        else me._showWbForm();
      });
    }
  },

  _renderContent(el) {
    if (this._filterType==='book') this._renderBooks(el);
    else if (this._filterType==='eli') this._renderEli(el);
    else this._renderWb(el);
  },

  // ══ 독서 감상문 ══════════════════════════
  _renderBooks(el) {
    let books = this._books;
    if (this._filterMember) books = books.filter(b => b.authorId === this._filterMember);
    const isParent = App.getMyRole() === 'parent';

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-book-2" style="color:var(--primary)"></i>독서 감상문 (${books.length})</div>
          ${!isParent ? `<button class="btn btn-primary btn-sm" id="btnAddBook"><i class="ti ti-plus"></i> 추가</button>` : ''}
        </div>
        <div class="book-grid">
          ${books.map(b => this._bookCard(b)).join('')}
        </div>
      </div>
    `;
    el.querySelector('#btnAddBook')?.addEventListener('click', () => this._showBookForm());
    el.querySelectorAll('.book-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        const b = this._books.find(x => x.id === card.dataset.id);
        if (b) this._showBookDetail(b);
      });
    });
    el.querySelectorAll('.btn-del-book').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('삭제할까요?')) return;
        await DB.Books.remove(btn.dataset.id);
        this._books = this._books.filter(b => b.id !== btn.dataset.id);
        this._renderContent(el); toast('삭제됐어요');
      });
    });
  },

  _bookCard(b) {
    const m = this._members.find(x => x.id === b.authorId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const stars = '★'.repeat(b.rating||0)+'☆'.repeat(5-(b.rating||0));
    const myUid = App.getMyUid();
    const readStatus = b.finished ? '완독 ✅' : (b.lastPage ? `${b.lastPage}p까지` : '읽는 중');
    return `
      <div class="book-card" data-id="${b.id}">
        <div class="book-cover" style="background:${color.bg}">📚</div>
        <div style="font-size:13px;font-weight:500;line-height:1.4;margin-bottom:2px">${escHtml(b.title)}</div>
        ${b.publisher?`<div style="font-size:11px;color:var(--text-3)">${escHtml(b.publisher)}</div>`:''}
        <div style="font-size:11px;color:var(--text-3);margin-top:2px">${m?.name||''} · ${formatDate(b.date)}</div>
        <div style="color:var(--amber);font-size:11px;margin-top:2px">${stars}</div>
        <div style="font-size:11px;margin-top:4px;color:${b.finished?'var(--primary)':'var(--amber)'};font-weight:500">${readStatus}</div>
        <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between">
          <span class="badge ${b.shared?'badge-shared':'badge-private'}">${b.shared?'공유':'나만'}</span>
          ${b.authorId===myUid||App.getMyRole()==='parent'?`<button class="btn btn-sm btn-danger btn-del-book" data-id="${b.id}"><i class="ti ti-trash"></i></button>`:''}
        </div>
      </div>
    `;
  },

  async _showBookDetail(b) {
    const m = this._members.find(x => x.id === b.authorId);
    const stars = '★'.repeat(b.rating||0);
    const commentHtml = await Comments.renderSection('books', b.id);
    Modal.open(`
      <div class="modal-hd">
        <h2>${escHtml(b.title)}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="font-size:13px;color:var(--text-3);margin-bottom:1rem;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${b.publisher?`<span>${escHtml(b.publisher)}</span><span>·</span>`:''}
        <span>${m?.name||''}</span><span>·</span><span>${formatDate(b.date)}</span>
        <span style="color:var(--amber)">${stars}</span>
        <span style="color:${b.finished?'var(--primary)':'var(--amber)'}">
          ${b.finished ? '완독 ✅' : (b.lastPage ? `${b.lastPage}p까지 읽음` : '읽는 중')}
        </span>
      </div>
      <div style="font-size:14px;line-height:1.8;white-space:pre-wrap;max-height:260px;overflow-y:auto">${escHtml(b.content||'감상문이 없어요.')}</div>
      ${commentHtml}
    `, { wide: true });
  },

  _showBookForm() {
    const me = this;
    let shared = true, rating = 0, finished = true;
    Modal.open(`
      <div class="modal-hd">
        <h2>새 독서 감상문</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">책 제목 *</label>
          <input class="form-input" id="bookTitle" placeholder="책 제목">
        </div>
        <div class="form-group">
          <label class="form-label">출판사</label>
          <input class="form-input" id="bookPublisher" placeholder="출판사">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">읽은 날짜</label>
          <input class="form-input" type="date" id="bookDate" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">별점</label>
          <div id="starWrap"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">독서 상태</label>
        <div style="display:flex;gap:8px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="readStatus" value="done" checked id="rdDone"> 완독 ✅
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="readStatus" value="partial" id="rdPartial"> 일부만 읽음
          </label>
        </div>
        <div id="lastPageWrap" style="display:none;margin-top:8px">
          <input class="form-input" type="number" id="bookLastPage" placeholder="몇 페이지까지 읽었나요?" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="display:flex;justify-content:space-between">
          <span>감상문</span>
          <span id="charCount" style="font-size:11px;color:var(--text-3);font-weight:400">0자</span>
        </label>
        <textarea class="form-textarea" id="bookContent" placeholder="느낀 점을 자유롭게 써주세요" style="min-height:130px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">공개 범위</label>
        <div id="shareWrap"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveBook">저장</button>
      </div>
    `, { wide: true });

    document.getElementById('bookContent').addEventListener('input', e => {
      document.getElementById('charCount').textContent = `${e.target.value.length}자`;
    });
    document.querySelectorAll('input[name="readStatus"]').forEach(r => {
      r.addEventListener('change', () => {
        finished = r.value === 'done';
        document.getElementById('lastPageWrap').style.display = finished ? 'none' : 'block';
      });
    });
    const starObj = createStarInput(0, v => { rating = v; });
    document.getElementById('starWrap').appendChild(starObj.el);
    const shareToggle = createShareToggle(true, v => { shared = v; });
    document.getElementById('shareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveBook').addEventListener('click', async () => {
      const title     = document.getElementById('bookTitle').value.trim();
      const publisher = document.getElementById('bookPublisher').value.trim();
      const date      = document.getElementById('bookDate').value;
      const content   = document.getElementById('bookContent').value.trim();
      const lastPage  = finished ? null : (parseInt(document.getElementById('bookLastPage').value)||null);
      if (!title) { toast('책 제목을 입력해 주세요.'); return; }
      try {
        const ref = await DB.Books.add({ title, publisher, date, content, rating, shared, finished, lastPage });
        me._books.unshift({ id: ref.id, title, publisher, date, content, rating, shared, finished, lastPage, authorId: App.getMyUid() });
        toast('독서 감상문이 저장됐어요! 📚');
        Modal.close();
        me._renderContent(document.getElementById('eduContent'));
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  // ══ 엘리하이 ═════════════════════════════
  _renderEli(el) {
    const isParent = App.getMyRole() === 'parent';
    const myUid = App.getMyUid();
    let eli = this._elihigh;
    if (this._filterMember) eli = eli.filter(e => e.subjectId === this._filterMember);
    const children = this._members.filter(m => m.role === 'child');

    // 날짜별로 그룹핑
    const byDate = {};
    eli.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });
    const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-device-laptop" style="color:var(--blue)"></i>엘리하이 기록 (${eli.length})</div>
          <button class="btn btn-primary btn-sm" id="btnAddEli"><i class="ti ti-plus"></i> 오늘 기록</button>
        </div>
        ${dates.length === 0 ? '<p class="text-muted">아직 기록이 없어요</p>' : dates.map(date => `
          <div style="margin-bottom:1rem">
            <div style="font-size:12px;font-weight:500;color:var(--text-3);margin-bottom:6px">${formatDate(date)}</div>
            ${byDate[date].map(e => this._eliItem(e, isParent, myUid)).join('')}
          </div>
        `).join('')}
      </div>
    `;

    el.querySelector('#btnAddEli').addEventListener('click', () => this._showEliForm());
    el.querySelectorAll('.btn-eli-approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        await DB.Elihigh.parentApprove(btn.dataset.id);
        await this._load();
        this._renderContent(el);
        toast('승인됐어요! ✅');
      });
    });
    el.querySelectorAll('.btn-eli-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('삭제할까요?')) return;
        await DB.Elihigh.remove(btn.dataset.id);
        await this._load();
        this._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _eliItem(e, isParent, myUid) {
    const m = this._members.find(x => x.id === e.subjectId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const statusBg = e.completed ? 'var(--primary-light)' : 'var(--amber-light)';
    const statusColor = e.completed ? 'var(--primary-dark)' : '#412402';
    const statusLabel = e.completed ? (e.parentApproved ? '완료 ✅ (부모승인)' : '완료 ✅') : '미완료 ⏳';
    return `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--bg);border-radius:var(--radius-md);margin-bottom:6px">
        <div class="avatar" style="width:28px;height:28px;font-size:11px;background:${color.bg};color:${color.text};flex-shrink:0">${(m?.name||'?').slice(0,2)}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:500">${escHtml(m?.name||'')}</span>
            <span style="font-size:11px;background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:20px;font-weight:500">${statusLabel}</span>
          </div>
          ${e.content ? `<div style="font-size:12px;color:var(--text-2);margin-top:3px">📖 ${escHtml(e.content)}</div>` : ''}
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          ${isParent && !e.completed ? `<button class="btn btn-sm btn-primary btn-eli-approve" data-id="${e.id}" style="font-size:11px;padding:3px 8px">승인</button>` : ''}
          ${isParent ? `<button class="btn btn-sm btn-danger btn-eli-del" data-id="${e.id}"><i class="ti ti-trash"></i></button>` : ''}
        </div>
      </div>
    `;
  },

  _showEliForm() {
    const me = this;
    const children = this._members.filter(m => m.role === 'child');
    Modal.open(`
      <div class="modal-hd">
        <h2>엘리하이 기록 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">자녀 선택 *</label>
        <select class="form-select" id="eliChild">
          ${children.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="eliDate" value="${todayStr()}">
      </div>
      <div class="form-group">
        <label class="form-label">완료 여부</label>
        <div style="display:flex;gap:12px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="eliStatus" value="done" id="eliDone"> 완료 ✅
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="radio" name="eliStatus" value="undone" checked id="eliUndone"> 미완료 ⏳
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">학습 과목 / 콘텐츠</label>
        <input class="form-input" id="eliContent" placeholder="예) 수학 - 분수의 덧셈, 영어 - 파닉스 3강">
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveEli">저장</button>
      </div>
    `);

    document.getElementById('btnSaveEli').addEventListener('click', async () => {
      const subjectId = document.getElementById('eliChild').value;
      const date      = document.getElementById('eliDate').value;
      const completed = document.querySelector('input[name="eliStatus"]:checked').value === 'done';
      const content   = document.getElementById('eliContent').value.trim();
      try {
        const ref = await DB.Elihigh.add({ subjectId, date, completed, content });
        me._elihigh.unshift({ id: ref.id, subjectId, date, completed, content, parentApproved: false });
        toast('기록됐어요!');
        Modal.close();
        me._renderContent(document.getElementById('eduContent'));
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  // ══ 문제집 ════════════════════════════════
  _renderWb(el) {
    const isParent = App.getMyRole() === 'parent';
    let wbs = this._workbooks;
    if (this._filterMember) wbs = wbs.filter(w => w.assignedTo === this._filterMember);

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-books" style="color:var(--purple)"></i>문제집 (${wbs.length})</div>
          ${isParent ? `<button class="btn btn-primary btn-sm" id="btnAddWb"><i class="ti ti-plus"></i> 문제집 추가</button>` : ''}
        </div>
        ${wbs.length === 0 ? '<p class="text-muted">등록된 문제집이 없어요</p>'
          : wbs.map(wb => this._wbCard(wb, isParent)).join('')}
      </div>
    `;

    el.querySelector('#btnAddWb')?.addEventListener('click', () => this._showWbForm());
    el.querySelectorAll('.btn-wb-log').forEach(btn => {
      btn.addEventListener('click', () => this._showWbLogForm(btn.dataset.id));
    });
    el.querySelectorAll('.btn-wb-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('문제집을 삭제할까요?')) return;
        await DB.Workbooks.remove(btn.dataset.id);
        this._workbooks = this._workbooks.filter(w => w.id !== btn.dataset.id);
        this._renderContent(el); toast('삭제됐어요');
      });
    });
    el.querySelectorAll('.btn-wb-detail').forEach(btn => {
      btn.addEventListener('click', () => this._showWbDetail(btn.dataset.id));
    });
  },

  _wbCard(wb, isParent) {
    const m = this._members.find(x => x.id === wb.assignedTo);
    const color = m?.color || Auth.MEMBER_COLORS[2];
    const myUid = App.getMyUid();
    const isMyWb = wb.assignedTo === myUid;
    return `
      <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:14px;font-weight:500">${escHtml(wb.title)}</div>
            ${wb.publisher?`<div style="font-size:12px;color:var(--text-3)">${escHtml(wb.publisher)}</div>`:''}
            <div style="font-size:12px;color:var(--text-2);margin-top:4px;display:flex;align-items:center;gap:6px">
              <div class="avatar" style="width:18px;height:18px;font-size:9px;background:${color.bg};color:${color.text}">${(m?.name||'?').slice(0,2)}</div>
              ${m?.name||''}
            </div>
          </div>
          <div style="display:flex;gap:4px">
            ${isMyWb||isParent ? `<button class="btn btn-sm btn-wb-log" data-id="${wb.id}" style="font-size:11px">오늘 기록</button>` : ''}
            <button class="btn btn-sm btn-wb-detail" data-id="${wb.id}" style="font-size:11px">기록 보기</button>
            ${isParent ? `<button class="btn btn-sm btn-danger btn-wb-del" data-id="${wb.id}"><i class="ti ti-trash"></i></button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  _showWbForm() {
    const me = this;
    const children = this._members.filter(m => m.role === 'child');
    Modal.open(`
      <div class="modal-hd">
        <h2>문제집 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">문제집 이름 *</label>
          <input class="form-input" id="wbTitle" placeholder="예) 쎈 수학 5-1">
        </div>
        <div class="form-group">
          <label class="form-label">출판사</label>
          <input class="form-input" id="wbPublisher" placeholder="예) 좋은책신사고">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">할당할 자녀 *</label>
        <select class="form-select" id="wbChild">
          ${children.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveWb">추가</button>
      </div>
    `);

    document.getElementById('btnSaveWb').addEventListener('click', async () => {
      const title     = document.getElementById('wbTitle').value.trim();
      const publisher = document.getElementById('wbPublisher').value.trim();
      const assignedTo = document.getElementById('wbChild').value;
      if (!title) { toast('문제집 이름을 입력해 주세요.'); return; }
      try {
        const ref = await DB.Workbooks.add({ title, publisher, assignedTo });
        me._workbooks.unshift({ id: ref.id, title, publisher, assignedTo, authorId: App.getMyUid() });
        toast('문제집이 추가됐어요! 📖');
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
        <h2>${escHtml(wb?.title||'')}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      ${wb?.publisher ? `<p style="font-size:13px;color:var(--text-3);margin-bottom:1rem">${escHtml(wb.publisher)}</p>` : ''}
      <div style="margin-bottom:1rem">
        ${logs.length === 0 ? '<p class="text-muted">아직 기록이 없어요</p>'
          : logs.map(log => {
              const statusBg = log.completed ? 'var(--primary-light)' : 'var(--amber-light)';
              const statusColor = log.completed ? 'var(--primary-dark)' : '#412402';
              const statusLabel = log.completed ? (log.parentApproved ? '완료 ✅ (승인)' : '완료 ✅') : '미완료 ⏳';
              return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:var(--radius-md);margin-bottom:6px">
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:500">${formatDate(log.date)}</div>
                    ${log.memo?`<div style="font-size:12px;color:var(--text-2)">${escHtml(log.memo)}</div>`:''}
                  </div>
                  <span style="font-size:11px;background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:20px;font-weight:500">${statusLabel}</span>
                  ${isParent && !log.completed ? `<button class="btn btn-sm btn-primary" onclick="Pages.Edu._approveLog('${wbId}','${log.id}')" style="font-size:11px;padding:3px 8px">승인</button>` : ''}
                </div>
              `;
            }).join('')}
      </div>
      ${commentHtml}
    `, { wide: true });
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
        <h2>${escHtml(wb?.title||'')} — 오늘 기록</h2>
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
