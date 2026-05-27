// =============================================
// pages/growth.js - 성장 기록 / 포트폴리오
// =============================================

Pages.Growth = {
  _members: [],
  _records: [],
  _filterMember: null,
  _filterTag: null,

  async render(wrap, members) {
    this._members = members;
    this._records = await DB.Growth.list();
    this._renderAll(wrap);
  },

  _renderAll(wrap) {
    const me = this;
    const tags = ['학교','취미','가족여행','운동','예술','기타'];

    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>가족 기록</h1>
          <p>가족의 소중한 순간을 함께 기록해요</p>
        </div>
        <button class="btn btn-primary" id="btnAddGrowth">
          <i class="ti ti-plus"></i> 기록 추가
        </button>
      </div>

      <!-- 구성원 필터 -->
      <div class="filter-row" id="growthMemberFilter">
        <button class="filter-btn active" data-mid="">전체</button>
        ${this._members.map(m=>`<button class="filter-btn" data-mid="${m.id}">${m.name}</button>`).join('')}
      </div>

      <!-- 태그 필터 -->
      <div class="filter-row" id="growthTagFilter">
        <button class="filter-btn active" data-tag="">전체</button>
        ${tags.map(t=>`<button class="filter-btn" data-tag="${t}">${t}</button>`).join('')}
      </div>

      <div id="growthContent"></div>
    `;

    this._renderContent(wrap.querySelector('#growthContent'));

    wrap.querySelector('#btnAddGrowth').addEventListener('click', () => me._showForm());

    wrap.querySelector('#growthMemberFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      wrap.querySelectorAll('#growthMemberFilter .filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      me._filterMember = btn.dataset.mid || null;
      me._renderContent(wrap.querySelector('#growthContent'));
    });

    wrap.querySelector('#growthTagFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      wrap.querySelectorAll('#growthTagFilter .filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      me._filterTag = btn.dataset.tag || null;
      me._renderContent(wrap.querySelector('#growthContent'));
    });
  },

  _renderContent(el) {
    let records = this._records;
    if (this._filterMember) records = records.filter(r => r.subjectId === this._filterMember);
    if (this._filterTag)    records = records.filter(r => r.tags?.includes(this._filterTag));

    if (records.length === 0) {
      el.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem">
          <div style="font-size:32px;margin-bottom:12px">🌱</div>
          <p style="color:var(--text-2)">아직 성장 기록이 없어요.<br>첫 번째 기록을 추가해 보세요!</p>
        </div>
      `;
      return;
    }

    const myUid = App.getMyUid();

    el.innerHTML = `
      <div class="card">
        <div class="timeline">
          ${records.map(r => this._timelineItem(r, myUid)).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('.btn-del-growth').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('기록을 삭제할까요?')) return;
        await DB.Growth.remove(btn.dataset.id);
        this._records = this._records.filter(r => r.id !== btn.dataset.id);
        this._renderContent(el);
        toast('삭제됐어요');
      });
    });
  },

  _timelineItem(r, myUid) {
    const subject = this._members.find(x => x.id === r.subjectId);
    const author  = this._members.find(x => x.id === r.authorId);
    const color   = subject?.color || Auth.MEMBER_COLORS[0];
    const isOwn   = r.authorId === myUid;

    const tagBadges = (r.tags||[]).map(t =>
      `<span class="badge" style="background:${color.bg};color:${color.text}">${t}</span>`
    ).join('');

    return `
      <div class="tl-item">
        <div class="tl-avatar" style="background:${color.bg}">${subject?.name.slice(0,1)||'👶'}</div>
        <div class="tl-body" style="flex:1">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <span class="tl-meta">${subject?.name||''}</span>
              <span class="tl-meta"> · ${formatDate(r.date)}</span>
              ${author && author.id !== r.subjectId
                ? `<span class="tl-meta"> · ${author.name} 기록</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="badge ${r.shared?'badge-shared':'badge-private'}">${r.shared?'공유':'나만'}</span>
              ${isOwn?`<button class="btn btn-icon btn-sm btn-danger btn-del-growth" data-id="${r.id}">
                <i class="ti ti-trash" style="font-size:13px"></i>
              </button>`:''}
            </div>
          </div>
          <div class="tl-title">${escHtml(r.title)}</div>
          <div class="tl-text">${escHtml(r.content||'')}</div>
          ${tagBadges ? `<div class="tag-row">${tagBadges}</div>` : ''}
        </div>
      </div>
    `;
  },

  _showForm() {
    const me = this;
    let shared = true;
    const tags = ['학교','취미','가족여행','운동','예술','기타'];
    let selectedTags = [];

    Modal.open(`
      <div class="modal-hd">
        <h2>성장 기록 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">누구의 기록인가요?</label>
        <select class="form-select" id="growthSubject">
          ${me._members.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}
          <option value="family">가족 전체</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">제목 *</label>
        <input class="form-input" id="growthTitle" placeholder="예) 처음으로 자전거 혼자 탔어요!">
      </div>
      <div class="form-group">
        <label class="form-label">날짜</label>
        <input class="form-input" type="date" id="growthDate" value="${todayStr()}">
      </div>
      <div class="form-group">
        <label class="form-label">내용</label>
        <textarea class="form-textarea" id="growthContent" placeholder="소중한 순간을 자세히 기록해 주세요"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">태그</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${tags.map(t=>`
            <button type="button" class="filter-btn tag-sel" data-tag="${t}">${t}</button>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">공개 범위</label>
        <div id="growthShareWrap"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveGrowth">저장</button>
      </div>
    `);

    // 태그 선택
    document.querySelectorAll('.tag-sel').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.tag;
        if (selectedTags.includes(t)) {
          selectedTags = selectedTags.filter(x => x !== t);
          btn.classList.remove('active');
        } else {
          selectedTags.push(t);
          btn.classList.add('active');
        }
      });
    });

    const shareToggle = createShareToggle(shared, v => { shared = v; });
    document.getElementById('growthShareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveGrowth').addEventListener('click', async () => {
      const subjectId = document.getElementById('growthSubject').value;
      const title     = document.getElementById('growthTitle').value.trim();
      const date      = document.getElementById('growthDate').value;
      const content   = document.getElementById('growthContent').value.trim();
      if (!title) { toast('제목을 입력해 주세요.'); return; }

      const data = { subjectId, title, date, content, tags: selectedTags, shared };
      try {
        const ref = await DB.Growth.add(data);
        me._records.unshift({ id: ref.id, ...data, authorId: App.getMyUid() });
        Modal.close();
        me._renderContent(document.querySelector('#growthContent'));
        toast('성장 기록이 저장됐어요! 🌱');
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  }
};
