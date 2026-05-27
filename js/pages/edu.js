// =============================================
// pages/edu.js - 교육 관리 (독서감상문 + 학습지)
// =============================================

Pages.Edu = {
  _members: [],
  _books: [],
  _sheets: [],
  _filterMember: null,
  _filterType: 'book',

  async render(wrap, members) {
    this._members = members;
    await this._load();
    this._renderAll(wrap);
  },

  async _load() {
    const [books, sheets] = await Promise.all([DB.Books.list(), DB.Worksheets.list()]);
    this._books = books;
    this._sheets = sheets;
  },

  _renderAll(wrap) {
    const me = this;
    // 자녀 구성원만 필터 버튼에 표시
    const childMembers = this._members.filter(m => m.role === 'child');

    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>교육 관리</h1>
          <p>독서 감상문 · 학습지 · 과목별 기록</p>
        </div>
        <button class="btn btn-primary" id="btnAddEdu">
          <i class="ti ti-plus"></i> 추가
        </button>
      </div>
      <div class="filter-row" id="typeFilter">
        <button class="filter-btn active" data-type="book">📚 독서 감상문</button>
        <button class="filter-btn" data-type="sheet">📄 학습지</button>
      </div>
      <div class="filter-row" id="memberFilter">
        <button class="filter-btn active" data-mid="">전체</button>
        ${childMembers.map(m => `<button class="filter-btn" data-mid="${m.id}">${m.name}</button>`).join('')}
      </div>
      <div id="eduContent"></div>
    `;

    this._renderContent(wrap.querySelector('#eduContent'));

    wrap.querySelector('#typeFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      wrap.querySelectorAll('#typeFilter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      me._filterType = btn.dataset.type;
      me._renderContent(wrap.querySelector('#eduContent'));
    });

    wrap.querySelector('#memberFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      wrap.querySelectorAll('#memberFilter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      me._filterMember = btn.dataset.mid || null;
      me._renderContent(wrap.querySelector('#eduContent'));
    });

    wrap.querySelector('#btnAddEdu').addEventListener('click', () => {
      if (me._filterType === 'book') me._showBookForm();
      else me._showSheetForm();
    });
  },

  _renderContent(el) {
    if (this._filterType === 'book') this._renderBooks(el);
    else this._renderSheets(el);
  },

  // ── 독서 감상문 ────────────────────────────
  _renderBooks(el) {
    let books = this._books;
    if (this._filterMember) books = books.filter(b => b.authorId === this._filterMember);

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-book-2" style="color:var(--primary)"></i>독서 감상문 (${books.length})</div>
        </div>
        <div class="book-grid">
          ${books.map(b => this._bookCard(b)).join('')}
          <div class="book-card book-add" id="btnAddBook">
            <i class="ti ti-plus" style="font-size:22px"></i>
            <span style="font-size:13px">새 감상문</span>
          </div>
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('삭제할까요?')) return;
        await DB.Books.remove(btn.dataset.id);
        this._books = this._books.filter(b => b.id !== btn.dataset.id);
        this._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _bookCard(b) {
    const m = this._members.find(x => x.id === b.authorId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const stars = '★'.repeat(b.rating||0) + '☆'.repeat(5-(b.rating||0));
    const myUid = App.getMyUid();
    return `
      <div class="book-card" data-id="${b.id}">
        <div class="book-cover" style="background:${color.bg}">📚</div>
        <div style="font-size:13px;font-weight:500;margin-bottom:2px;line-height:1.4">${escHtml(b.title)}</div>
        ${b.publisher ? `<div style="font-size:11px;color:var(--text-3)">${escHtml(b.publisher)}</div>` : ''}
        <div style="font-size:11px;color:var(--text-3);margin-top:2px">${m?.name||''} · ${formatDate(b.date)}</div>
        <div style="color:var(--amber);font-size:11px;margin-top:2px">${stars}</div>
        <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between">
          <span class="badge ${b.shared?'badge-shared':'badge-private'}">${b.shared?'공유':'나만'}</span>
          ${b.authorId===myUid?`<button class="btn btn-sm btn-danger btn-del-book" data-id="${b.id}"><i class="ti ti-trash"></i></button>`:''}
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
        ${b.publisher ? `<span>${escHtml(b.publisher)}</span><span>·</span>` : ''}
        <span>${m?.name||''}</span><span>·</span>
        <span>${formatDate(b.date)}</span><span>·</span>
        <span style="color:var(--amber)">${stars}</span>
        <span class="badge ${b.shared?'badge-shared':'badge-private'}">${b.shared?'가족 공유':'나만 보기'}</span>
      </div>
      <div style="font-size:14px;line-height:1.8;color:var(--text);white-space:pre-wrap;max-height:300px;overflow-y:auto">${escHtml(b.content||'감상문이 없어요.')}</div>
      ${commentHtml}
    `, { wide: true });
  },

  _showBookForm(existing = null) {
    const me = this;
    let shared = existing?.shared ?? true;
    let rating = existing?.rating ?? 0;

    Modal.open(`
      <div class="modal-hd">
        <h2>${existing ? '독서 감상문 수정' : '새 독서 감상문'}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">책 제목 *</label>
          <input class="form-input" id="bookTitle" placeholder="책 제목" value="${escHtml(existing?.title||'')}">
        </div>
        <div class="form-group">
          <label class="form-label">출판사</label>
          <input class="form-input" id="bookPublisher" placeholder="출판사 이름" value="${escHtml(existing?.publisher||'')}">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">읽은 날짜</label>
          <input class="form-input" type="date" id="bookDate" value="${existing?.date||todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">별점</label>
          <div id="starWrap"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="display:flex;justify-content:space-between">
          <span>감상문</span>
          <span id="charCount" style="font-size:11px;color:var(--text-3);font-weight:400">0자</span>
        </label>
        <textarea class="form-textarea" id="bookContent" placeholder="책을 읽고 느낀 점을 자유롭게 써주세요" style="min-height:140px">${escHtml(existing?.content||'')}</textarea>
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

    // 글자수 카운터
    const textarea = document.getElementById('bookContent');
    const counter  = document.getElementById('charCount');
    const updateCount = () => { counter.textContent = `${textarea.value.length}자`; };
    textarea.addEventListener('input', updateCount);
    updateCount();

    const starObj = createStarInput(rating, v => { rating = v; });
    document.getElementById('starWrap').appendChild(starObj.el);

    const shareToggle = createShareToggle(shared, v => { shared = v; });
    document.getElementById('shareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveBook').addEventListener('click', async () => {
      const title     = document.getElementById('bookTitle').value.trim();
      const publisher = document.getElementById('bookPublisher').value.trim();
      const date      = document.getElementById('bookDate').value;
      const content   = document.getElementById('bookContent').value.trim();
      if (!title) { toast('책 제목을 입력해 주세요.'); return; }

      const data = { title, publisher, date, content, rating: starObj.getVal(), shared };
      try {
        if (existing) {
          await DB.Books.update(existing.id, data);
          me._books = me._books.map(b => b.id === existing.id ? { ...b, ...data } : b);
          toast('수정됐어요!');
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

  // ── 학습지 ────────────────────────────────
  _renderSheets(el) {
    let sheets = this._sheets;
    if (this._filterMember) sheets = sheets.filter(s => s.authorId === this._filterMember);

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-file-text" style="color:var(--blue)"></i>학습지 (${sheets.length})</div>
        </div>
        ${sheets.length === 0
          ? '<p class="text-muted">아직 학습지가 없어요</p>'
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--gap)">
              ${sheets.map(s => this._sheetCard(s)).join('')}
            </div>`}
      </div>
    `;

    el.querySelectorAll('.progress-input').forEach(input => {
      input.addEventListener('change', async () => {
        const id  = input.dataset.id;
        const val = Math.min(100, Math.max(0, parseInt(input.value)||0));
        await DB.Worksheets.updateProgress(id, val);
        const bar = document.querySelector(`.progress-bar[data-id="${id}"]`);
        const pct = document.querySelector(`.progress-pct[data-id="${id}"]`);
        if (bar) bar.style.width = val + '%';
        if (pct) pct.textContent = val + '%';
        toast('진행도 업데이트됐어요!');
      });
    });

    el.querySelectorAll('.btn-sheet-detail').forEach(btn => {
      btn.addEventListener('click', async () => {
        const s = this._sheets.find(x => x.id === btn.dataset.id);
        if (s) await this._showSheetDetail(s);
      });
    });

    el.querySelectorAll('.btn-del-sheet').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('학습지를 삭제할까요?')) return;
        await DB.Worksheets.remove(btn.dataset.id);
        this._sheets = this._sheets.filter(s => s.id !== btn.dataset.id);
        this._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _sheetCard(s) {
    const m = this._members.find(x => x.id === s.authorId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const pct = s.progress || 0;
    const myUid = App.getMyUid();
    const isParent = App.getMyRole() === 'parent';
    const checked = s.parentChecked ? '✅' : '⬜';
    return `
      <div style="background:${color.bg};border-radius:var(--radius-md);padding:12px;cursor:pointer" class="btn-sheet-detail" data-id="${s.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div>
            <div style="font-size:12px;color:${color.text};font-weight:500">${escHtml(s.subject||'기타')} · ${m?.name||''}</div>
            <div style="font-size:13px;font-weight:500;color:var(--text);margin-top:2px">${escHtml(s.title)}</div>
            ${s.workbookName ? `<div style="font-size:11px;color:var(--text-3)">${escHtml(s.workbookName)}</div>` : ''}
          </div>
          <span style="font-size:16px" title="부모 확인">${checked}</span>
        </div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">${formatDate(s.date)} ${s.count?'· '+s.count+'문제':''}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="flex:1;height:4px;background:rgba(0,0,0,.1);border-radius:2px">
            <div class="progress-bar" data-id="${s.id}" style="width:${pct}%;height:100%;background:${color.text};border-radius:2px;transition:width .3s"></div>
          </div>
          ${s.authorId===myUid
            ? `<input class="progress-input" data-id="${s.id}" type="number" min="0" max="100" value="${pct}"
                onclick="event.stopPropagation()"
                style="width:48px;font-size:12px;padding:2px 6px;border:0.5px solid ${color.text};border-radius:4px;background:transparent;color:${color.text};text-align:center">`
            : `<span class="progress-pct" data-id="${s.id}" style="font-size:11px;color:${color.text}">${pct}%</span>`}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span class="badge ${s.shared?'badge-shared':'badge-private'}">${s.shared?'공유':'나만'}</span>
          <div style="display:flex;gap:4px">
            ${isParent && !s.parentChecked ? `<button class="btn btn-sm" data-id="${s.id}" onclick="event.stopPropagation();Pages.Edu._confirmSheet('${s.id}')" style="font-size:11px;padding:3px 8px;color:var(--primary)">확인</button>` : ''}
            ${s.authorId===myUid||isParent ? `<button class="btn btn-sm btn-danger btn-del-sheet" data-id="${s.id}" onclick="event.stopPropagation()"><i class="ti ti-trash"></i></button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  async _showSheetDetail(s) {
    const m = this._members.find(x => x.id === s.authorId);
    const commentHtml = await Comments.renderSection('worksheets', s.id);
    Modal.open(`
      <div class="modal-hd">
        <h2>${escHtml(s.title)}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1rem;font-size:13px;color:var(--text-2)">
        <div><span style="color:var(--text-3)">과목</span> ${escHtml(s.subject||'-')}</div>
        <div><span style="color:var(--text-3)">문제집</span> ${escHtml(s.workbookName||'-')}</div>
        <div><span style="color:var(--text-3)">날짜</span> ${formatDate(s.date)}</div>
        <div><span style="color:var(--text-3)">문제 수</span> ${s.count||0}문제</div>
        <div><span style="color:var(--text-3)">진행도</span> ${s.progress||0}%</div>
        <div><span style="color:var(--text-3)">부모 확인</span> ${s.parentChecked ? '✅ 확인됨' : '⬜ 미확인'}</div>
      </div>
      ${commentHtml}
    `, { wide: true });
  },

  async _confirmSheet(id) {
    await DB.Worksheets.updateProgress(id, this._sheets.find(s=>s.id===id)?.progress||0, true);
    await db.collection('families').doc(Auth.getCurrentFamily().id)
      .collection('worksheets').doc(id).update({ parentChecked: true });
    this._sheets = this._sheets.map(s => s.id===id ? {...s, parentChecked:true} : s);
    this._renderContent(document.getElementById('eduContent'));
    toast('부모 확인 완료! ✅');
  },

  _showSheetForm() {
    const me = this;
    let shared = true;
    const subjects = ['국어','수학','영어','과학','사회','기타'];

    Modal.open(`
      <div class="modal-hd">
        <h2>학습지 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">제목 *</label>
          <input class="form-input" id="sheetTitle" placeholder="예) 5월 4주차 수학 학습지">
        </div>
        <div class="form-group">
          <label class="form-label">문제집 이름</label>
          <input class="form-input" id="sheetWorkbook" placeholder="예) 쎈 수학, 디딤돌">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">과목</label>
          <select class="form-select" id="sheetSubject">
            ${subjects.map(s=>`<option>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">날짜</label>
          <input class="form-input" type="date" id="sheetDate" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">문제 수</label>
          <input class="form-input" type="number" id="sheetCount" placeholder="0" min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">공개 범위</label>
        <div id="sheetShareWrap"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveSheet">저장</button>
      </div>
    `, { wide: true });

    const shareToggle = createShareToggle(shared, v => { shared = v; });
    document.getElementById('sheetShareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveSheet').addEventListener('click', async () => {
      const title        = document.getElementById('sheetTitle').value.trim();
      const workbookName = document.getElementById('sheetWorkbook').value.trim();
      const subject      = document.getElementById('sheetSubject').value;
      const date         = document.getElementById('sheetDate').value;
      const count        = parseInt(document.getElementById('sheetCount').value) || 0;
      if (!title) { toast('제목을 입력해 주세요.'); return; }

      const data = { title, workbookName, subject, date, count, shared, progress: 0, parentChecked: false };
      try {
        const ref = await DB.Worksheets.add(data);
        me._sheets.unshift({ id: ref.id, ...data, authorId: App.getMyUid() });
        toast('학습지가 추가됐어요! 📄');
        Modal.close();
        me._renderContent(document.getElementById('eduContent'));
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  }
};
