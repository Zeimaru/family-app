// =============================================
// pages/todo.js - 할 일 / 숙제
// =============================================

Pages.Todo = {
  _members: [],
  _todos: [],
  _unsubscribe: null,

  async render(wrap, members) {
    this._members = members;

    // 기존 구독 해제
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }

    this._todos = await DB.Todos.list();
    this._renderAll(wrap);

    // 실시간 구독
    this._unsubscribe = DB.Todos.subscribe(todos => {
      this._todos = todos;
      this._renderContent(wrap);
    });
  },

  _renderAll(wrap) {
    const me = this;
    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>할 일 / 숙제</h1>
          <p>아이별 숙제와 가족 할 일을 관리해요</p>
        </div>
        <button class="btn btn-primary" id="btnAddTodo">
          <i class="ti ti-plus"></i> 추가
        </button>
      </div>
      <div id="todoContent"></div>
    `;

    this._renderContent(wrap);

    wrap.querySelector('#btnAddTodo').addEventListener('click', () => me._showForm());
  },

  _renderContent(wrap) {
    const el = wrap.querySelector('#todoContent') || document.getElementById('todoContent');
    if (!el) return;

    const myUid = App.getMyUid();
    const members = this._members;
    const todos = this._todos;

    // 구성원별로 그룹핑
    const byMember = {};
    const shared = [];

    todos.forEach(t => {
      if (t.authorId === myUid || t.shared) {
        if (!byMember[t.authorId]) byMember[t.authorId] = [];
        byMember[t.authorId].push(t);
      }
    });

    const memberHtml = members.filter(m => m.role === 'child').map(m => {
      const myTodos = byMember[m.id] || [];
      const done = myTodos.filter(t => t.done).length;
      const color = m.color || Auth.MEMBER_COLORS[0];
      return `
        <div class="card">
          <div class="card-hd">
            <div class="card-title">
              <div class="avatar" style="width:26px;height:26px;font-size:11px;background:${color.bg};color:${color.text}">
                ${m.name.slice(0,2)}
              </div>
              ${m.name}
              ${m.role==='child'?'<span style="font-size:11px;color:var(--text-3)">숙제</span>':'<span style="font-size:11px;color:var(--text-3)">할 일</span>'}
            </div>
            <span style="font-size:12px;color:var(--text-3)">${done}/${myTodos.length} 완료</span>
          </div>
          ${myTodos.length === 0
            ? '<p class="text-muted" style="font-size:13px">할 일이 없어요 🎉</p>'
            : myTodos.map(t => this._todoItem(t, m)).join('')}
          ${m.id === myUid ? `
            <button class="btn btn-sm" style="margin-top:8px;width:100%;justify-content:center" onclick="Pages.Todo._showForm('${m.id}')">
              <i class="ti ti-plus"></i> 추가
            </button>` : ''}
        </div>
      `;
    }).join('');

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--gap)">${memberHtml}</div>`;

    // 체크박스 이벤트
    el.querySelectorAll('.todo-check').forEach(chk => {
      chk.addEventListener('click', async () => {
        const id = chk.dataset.id;
        const authorId = chk.dataset.author;
        if (authorId !== myUid) { toast('본인의 할 일만 체크할 수 있어요'); return; }
        const done = !chk.classList.contains('done');
        await DB.Todos.toggle(id, done);
        toast(done ? '완료! 🎉' : '다시 할 일로');
      });
    });

    // 삭제 버튼
    el.querySelectorAll('.btn-del-todo').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('삭제할까요?')) return;
        await DB.Todos.remove(btn.dataset.id);
        toast('삭제됐어요');
      });
    });
  },

  _todoItem(t, m) {
    const myUid = App.getMyUid();
    const isOwn = t.authorId === myUid;
    return `
      <div class="todo-item">
        <div class="todo-check${t.done?' done':''}" data-id="${t.id}" data-author="${t.authorId}">
          ${t.done?'<i class="ti ti-check" style="font-size:11px"></i>':''}
        </div>
        <div style="flex:1">
          <div class="todo-label${t.done?' done':''}">${escHtml(t.title)}</div>
          ${t.dueDate?`<div style="font-size:11px;color:var(--text-3)">마감: ${formatDate(t.dueDate)}</div>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:5px">
          <span class="badge ${t.shared?'badge-shared':'badge-private'}" style="font-size:10px">${t.shared?'공유':'나만'}</span>
          ${isOwn?`<button class="btn btn-icon btn-sm btn-del-todo" data-id="${t.id}" style="padding:3px"><i class="ti ti-trash" style="font-size:13px"></i></button>`:''}
        </div>
      </div>
    `;
  },

  _showForm(defaultMemberId = null) {
    const me = this;
    let shared = true;

    Modal.open(`
      <div class="modal-hd">
        <h2>할 일 / 숙제 추가</h2>
        <button class="btn btn-icon" onclick="Modal.close()"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-group">
        <label class="form-label">내용 *</label>
        <input class="form-input" id="todoTitle" placeholder="예) 수학 문제집 p.34">
      </div>
      <div class="form-group">
        <label class="form-label">마감일 (선택)</label>
        <input class="form-input" type="date" id="todoDue">
      </div>
      <div class="form-group">
        <label class="form-label">공개 범위</label>
        <div id="todoShareWrap"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
        <button class="btn" onclick="Modal.close()">취소</button>
        <button class="btn btn-primary" id="btnSaveTodo">추가</button>
      </div>
    `);

    const shareToggle = createShareToggle(shared, v => { shared = v; });
    document.getElementById('todoShareWrap').appendChild(shareToggle);

    document.getElementById('btnSaveTodo').addEventListener('click', async () => {
      const title  = document.getElementById('todoTitle').value.trim();
      const dueDate= document.getElementById('todoDue').value;
      if (!title) { toast('내용을 입력해 주세요.'); return; }

      const data = { title, dueDate, shared };
      try {
        const ref = await DB.Todos.add(data);
        Modal.close();
        toast('추가됐어요! ✅');
      } catch(e) { toast('저장 실패: ' + e.message); }
    });
  }
};
