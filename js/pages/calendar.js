// =============================================
// pages/calendar.js - 가족 캘린더
// =============================================

Pages.Calendar = {
  _members: [],
  _events: [],
  _year: new Date().getFullYear(),
  _month: new Date().getMonth() + 1,

  async render(wrap, members) {
    this._members = members;
    await this._load();
    this._renderAll(wrap);
  },

  async _load() {
    this._events = await DB.Calendar.listByMonth(this._year, this._month);
  },

  _renderAll(wrap) {
    const me = this;
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>가족 캘린더</h1>
          <p>가족 일정을 함께 관리해요</p>
        </div>
        <button class="btn btn-primary" id="btnAddEvent">
          <i class="ti ti-plus"></i> 일정 추가
        </button>
      </div>

      <!-- 구성원 색상 범례 -->
      <div style="display:flex;gap:12px;margin-bottom:1rem;flex-wrap:wrap">
        ${this._members.map(m => `
          <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-2)">
            <div style="width:10px;height:10px;border-radius:50%;background:${m.color?.dot||'#ccc'}"></div>
            ${m.name}
          </div>
        `).join('')}
      </div>

      <div class="card">
        <!-- 월 탐색 -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <button class="btn btn-icon" id="btnPrevMonth"><i class="ti ti-chevron-left"></i></button>
          <span style="font-size:16px;font-weight:500">${this._year}년 ${monthNames[this._month-1]}</span>
          <button class="btn btn-icon" id="btnNextMonth"><i class="ti ti-chevron-right"></i></button>
        </div>

        <!-- 요일 헤더 -->
        <div class="cal-grid" style="margin-bottom:4px">
          ${['일','월','화','수','목','금','토'].map((d,i)=>
            `<div class="cal-head" style="${i===0?'color:#A32D2D':i===6?'color:#185FA5':''}">${d}</div>`
          ).join('')}
        </div>

        <!-- 날짜 그리드 -->
        <div class="cal-grid" id="calGrid"></div>
      </div>

      <!-- 이번 달 전체 일정 목록 -->
      <div class="card" style="margin-top:var(--gap)">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-list" style="color:var(--blue)"></i>이번 달 일정 목록</div>
        </div>
        <div id="eventList"></div>
      </div>
    `;

    this._renderGrid();
    this._renderList();

    wrap.querySelector('#btnAddEvent').addEventListener('click', () => me._showForm());
    wrap.querySelector('#btnPrevMonth').addEventListener('click', async () => {
      me._month--;
      if (me._month < 1) { me._month = 12; me._year--; }
      await me._load();
      me._renderAll(wrap, me._members);
    });
    wrap.querySelector('#btnNextMonth').addEventListener('click', async () => {
      me._month++;
      if (me._month > 12) { me._month = 1; me._year++; }
      await me._load();
      me._renderAll(wrap, me._members);
    });
  },

  _renderGrid() {
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const firstDay = new Date(this._year, this._month-1, 1).getDay();
    const daysInMonth = new Date(this._year, this._month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear()===this._year && today.getMonth()+1===this._month;

    // 앞쪽 빈 칸
    for (let i = 0; i < firstDay; i++) {
      grid.insertAdjacentHTML('beforeend', '<div></div>');
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this._year}-${String(this._month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvents = this._events.filter(e => e.date === dateStr);
      const isToday = isCurrentMonth && today.getDate() === d;
      const dow = new Date(this._year, this._month-1, d).getDay();

      const cell = document.createElement('div');
      cell.className = 'cal-cell' + (isToday ? ' today' : '');
      cell.innerHTML = `
        <div class="cal-dn" style="${dow===0?'color:#A32D2D':dow===6?'color:#185FA5':''}">${d}</div>
        ${dayEvents.slice(0,3).map(e => {
          const m = this._members.find(x => x.id === e.authorId);
          const c = m?.color?.dot || '#888';
          return `<div class="cal-event" style="background:${c}22;color:${c}">${escHtml(e.title)}</div>`;
        }).join('')}
        ${dayEvents.length > 3 ? `<div style="font-size:10px;color:var(--text-3)">+${dayEvents.length-3}개</div>` : ''}
      `;
      cell.addEventListener('click', () => this._showDayModal(dateStr, dayEvents));
      grid.appendChild(cell);
    }
  },

  _renderList() {
    const el = document.getElementById('eventList');
    if (!el) return;

    if (this._events.length === 0) {
      el.innerHTML = '<p class="text-muted">이번 달 일정이 없어요</p>';
      return;
    }

    el.innerHTML = this._events.map(e => {
      const m = this._members.find(x => x.id === e.authorId);
      const color = m?.color || Auth.MEMBER_COLORS[0];
      const myUid = App.getMyUid();
      return `
        <div class="todo-item">
          <div style="width:8px;height:8px;border-radius:50%;background:${color.dot};flex-shrink:0;margin-top:2px"></div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${escHtml(e.title)}</div>
            <div style="font-size:11px;color:var(--text-3)">${formatDate(e.date)} ${e.time?'· '+e.time:''} · ${m?.name||''}</div>
            ${e.memo ? `<div style="font-size:12px;color:var(--text-2);margin-top:2px">${escHtml(e.memo)}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="badge ${e.shared?'badge-shared':'badge-private'}">${e.shared?'공유':'나만'}</span>
            ${e.authorId===myUid?`<button class="btn btn-icon btn-sm btn-danger" onclick="Pages.Calendar._deleteEvent('${e.id}')"><i class="ti ti-trash"></i></button>`:''}
          </div>
        </div>
      `;
    }).join('');
  },

  _showDayModal(dateStr, events) {
    const me = this;
    Modal.open(`
      <div class="modal-hd">
        <h2>${formatDate(dateStr)}</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      ${events.length === 0
        ? '<p class="text-muted">일정이 없어요</p>'
        : events.map(e => {
            const m = me._members.find(x => x.id === e.authorId);
            const c = m?.color?.dot || '#888';
            return `
              <div class="todo-item">
                <div style="width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0"></div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:500">${escHtml(e.title)}</div>
                  <div style="font-size:12px;color:var(--text-3)">${e.time||''} · ${m?.name||''}</div>
                  ${e.memo?`<div style="font-size:12px;color:var(--text-2)">${escHtml(e.memo)}</div>`:''}
                </div>
                <span class="badge ${e.shared?'badge-shared':'badge-private'}">${e.shared?'공유':'나만'}</span>
              </div>`;
          }).join('')}
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1rem"
        onclick="Modal.close();Pages.Calendar._showForm('${dateStr}')">
        <i class="ti ti-plus"></i> 이 날 일정 추가
      </button>
    `);
  },

  _showForm(defaultDate = null) {
    const me = this;
    let shared = true;

    Modal.open(`
      <div class="modal-hd">
        <h2>일정 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">제목 *</label>
        <input class="form-input" id="evTitle" placeholder="일정 제목">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group">
          <label class="form-label">날짜</label>
          <input class="form-input" type="date" id="evDate" value="${defaultDate||todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">시간 (선택)</label>
          <input class="form-input" type="time" id="evTime">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">메모 (선택)</label>
        <input class="form-input" id="evMemo" placeholder="간단한 메모">
      </div>
      <div class="form-group">
        <label class="form-label">공개 범위</label>
        <div id="evShareWrap"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveEvent">저장</button>
      </div>
    `);

    const shareToggle = createShareToggle(shared, v => { shared = v; });
    document.getElementById('evShareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveEvent').addEventListener('click', async () => {
      const title = document.getElementById('evTitle').value.trim();
      const date  = document.getElementById('evDate').value;
      const time  = document.getElementById('evTime').value;
      const memo  = document.getElementById('evMemo').value.trim();
      if (!title) { toast('제목을 입력해 주세요.'); return; }
      if (!date)  { toast('날짜를 선택해 주세요.'); return; }

      const data = { title, date, time, memo, shared };
      try {
        const ref = await DB.Calendar.add(data);
        me._events.push({ id: ref.id, ...data, authorId: App.getMyUid() });
        me._events.sort((a,b) => a.date.localeCompare(b.date));
        Modal.close();
        me._renderGrid();
        me._renderList();
        toast('일정이 추가됐어요! 📅');
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  },

  async _deleteEvent(id) {
    if (!confirm('일정을 삭제할까요?')) return;
    await DB.Calendar.remove(id);
    this._events = this._events.filter(e => e.id !== id);
    this._renderGrid();
    this._renderList();
    toast('삭제됐어요');
  }
};
