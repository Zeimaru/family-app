// =============================================
// pages/todo.js - 학교 알림장 / 숙제 / 준비물
// =============================================

Pages.Todo = {
  _members: [], _todos: [], _filterType: 'notice', _unsubscribe: null,

  async render(wrap, members) {
    this._members = members;
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    this._todos = await DB.Todos.list();
    this._renderAll(wrap);
    this._unsubscribe = DB.Todos.subscribe(todos => {
      this._todos = todos;
      this._renderContent(wrap);
    });
  },

  _renderAll(wrap) {
    const me = this;
    wrap.innerHTML = `
      <div class="page-hd">
        <div><h1>학교 알림장 / 숙제 / 준비물</h1><p>학교에서 온 알림과 숙제, 준비물을 관리해요</p></div>
        <button class="btn btn-primary" id="btnAddTodo"><i class="ti ti-plus"></i> 추가</button>
      </div>
      <div class="filter-row" id="todoTypeFilter">
        <button class="filter-btn active" data-type="notice">📋 알림장</button>
        <button class="filter-btn" data-type="homework">📝 숙제</button>
        <button class="filter-btn" data-type="supplies">🎒 준비물</button>
      </div>
      <div id="todoContent"></div>
    `;
    this._renderContent(wrap);

    wrap.querySelector('#todoTypeFilter').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn'); if (!btn) return;
      wrap.querySelectorAll('#todoTypeFilter .filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); me._filterType = btn.dataset.type;
      me._renderContent(wrap);
    });
    wrap.querySelector('#btnAddTodo').addEventListener('click', () => me._showForm());
  },

  _renderContent(wrap) {
    const el = wrap.querySelector('#todoContent') || document.getElementById('todoContent');
    if (!el) return;
    const myUid = App.getMyUid();
    const members = this._members;
    const todos = this._todos.filter(t => t.type === this._filterType);

    const typeLabel = { notice: '알림장', homework: '숙제', supplies: '준비물' };
    const typeIcon  = { notice: '📋', homework: '📝', supplies: '🎒' };
    const done   = todos.filter(t => t.done).length;
    const undone = todos.filter(t => !t.done);
    const doneList = todos.filter(t => t.done);

    el.innerHTML = `
      <div class="card">
        <div class="card-hd">
          <div class="card-title">${typeIcon[this._filterType]} ${typeLabel[this._filterType]} (${todos.length})</div>
          <span style="font-size:12px;color:var(--text-3)">${done}/${todos.length} 완료</span>
        </div>

        ${undone.length === 0 ? '<p class="text-muted" style="margin-bottom:1rem">모두 완료됐어요 🎉</p>' : ''}
        ${undone.map(t => this._todoItem(t, myUid, members)).join('')}

        ${doneList.length > 0 ? `
          <div style="border-top:0.5px solid var(--border);margin-top:12px;padding-top:12px">
            <div style="font-size:12px;color:var(--text-3);margin-bottom:8px">완료됨 (${doneList.length})</div>
            ${doneList.map(t => this._todoItem(t, myUid, members)).join('')}
          </div>
        ` : ''}
      </div>
    `;

    el.querySelectorAll('.todo-check').forEach(chk => {
      chk.addEventListener('click', async () => {
        const id = chk.dataset.id;
        const done = !chk.classList.contains('done');
        await DB.Todos.toggle(id, done);
        toast(done ? '완료! 🎉' : '다시 할 일로');
      });
    });
    el.querySelectorAll('.btn-del-todo').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('삭제할까요?')) return;
        await DB.Todos.remove(btn.dataset.id);
        toast('삭제됐어요');
      });
    });
  },

  _todoItem(t, myUid, members) {
    const m = members.find(x => x.id === t.authorId);
    const color = m?.color || Auth.MEMBER_COLORS[0];
    const isOwn = t.authorId === myUid || App.getMyRole() === 'parent';
    return `
      <div class="todo-item">
        <div class="todo-check${t.done?' done':''}" data-id="${t.id}">
          ${t.done?'<i class="ti ti-check" style="font-size:11px"></i>':''}
        </div>
        <div style="flex:1">
          <div class="todo-label${t.done?' done':''}">${escHtml(t.title)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <div class="avatar" style="width:16px;height:16px;font-size:9px;background:${color.bg};color:${color.text}">${(m?.name||'?').slice(0,2)}</div>
            <span style="font-size:11px;color:var(--text-3)">${m?.name||''}</span>
            ${t.dueDate?`<span style="font-size:11px;color:var(--text-3)">· 마감 ${formatDate(t.dueDate)}</span>`:''}
          </div>
        </div>
        ${isOwn?`<button class="btn btn-icon btn-sm btn-del-todo" data-id="${t.id}" style="padding:3px"><i class="ti ti-trash" style="font-size:13px"></i></button>`:''}
      </div>
    `;
  },

  _showForm() {
    const me = this;
    const typeLabel = { notice:'알림장', homework:'숙제', supplies:'준비물' };
    Modal.open(`
      <div class="modal-hd">
        <h2>${typeLabel[this._filterType]} 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">내용 *</label>
        <input class="form-input" id="todoTitle" placeholder="내용을 입력하세요">
      </div>
      <div class="form-group">
        <label class="form-label">마감일 (선택)</label>
        <input class="form-input" type="date" id="todoDue">
      </div>
      <p style="font-size:12px;color:var(--text-3);margin-top:4px">
        <i class="ti ti-users"></i> 알림장/숙제/준비물은 모두 가족 공유입니다.
      </p>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveTodo">추가</button>
      </div>
    `);

    document.getElementById('btnSaveTodo').addEventListener('click', async () => {
      const title   = document.getElementById('todoTitle').value.trim();
      const dueDate = document.getElementById('todoDue').value;
      if (!title) { toast('내용을 입력해 주세요.'); return; }
      try {
        await DB.Todos.add({ title, dueDate, type: me._filterType, shared: true });
        toast('추가됐어요! ✅');
        Modal.close();
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  }
};
