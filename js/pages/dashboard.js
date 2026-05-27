// =============================================
// pages/dashboard.js - 홈 대시보드
// =============================================

const Pages = window.Pages || {};

Pages.Dashboard = {
  async render(wrap, members) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일 ${['일','월','화','수','목','금','토'][today.getDay()]}요일`;

    // 병렬로 데이터 로드
    const [books, todos, events, growth] = await Promise.all([
      DB.Books.list(),
      DB.Todos.list(),
      DB.Calendar.listByMonth(today.getFullYear(), today.getMonth()+1),
      DB.Growth.list()
    ]);

    const todayEvents  = events.filter(e => e.date === todayStr());
    const pendingTodos = todos.filter(t => !t.done);
    const todayTodos   = todos.filter(t => !t.done).slice(0, 5);
    const recentBooks  = books.slice(0, 4);

    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>안녕하세요 👋</h1>
          <p>${dateStr}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num" style="color:var(--primary)">${books.length}</div>
          <div class="stat-label">이번 달 독서</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--blue)">${todayEvents.length}</div>
          <div class="stat-label">오늘 일정</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--amber)">${pendingTodos.length}</div>
          <div class="stat-label">남은 숙제</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--purple)">${growth.length}</div>
          <div class="stat-label">성장 기록</div>
        </div>
      </div>

      <div class="two-col" style="margin-bottom:var(--gap)">
        <div class="card">
          <div class="card-hd">
            <div class="card-title"><i class="ti ti-calendar-event" style="color:var(--blue)"></i>오늘 일정</div>
            <button class="btn btn-sm" onclick="App.navigate('calendar')">전체</button>
          </div>
          <div id="dashEvents">
            ${todayEvents.length === 0
              ? '<p class="text-muted" style="padding:8px 0">오늘 일정이 없어요</p>'
              : todayEvents.map(e => renderEventRow(e, members)).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-hd">
            <div class="card-title"><i class="ti ti-checkbox" style="color:var(--amber)"></i>오늘 할 일</div>
            <button class="btn btn-sm" onclick="App.navigate('todo')">전체</button>
          </div>
          <div id="dashTodos">
            ${todayTodos.length === 0
              ? '<p class="text-muted" style="padding:8px 0">할 일이 없어요 🎉</p>'
              : todayTodos.map(t => renderTodoRow(t, members)).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-book-2" style="color:var(--primary)"></i>최근 독서 기록</div>
          <button class="btn btn-sm" onclick="App.navigate('edu')">전체 보기</button>
        </div>
        <div class="book-grid" id="dashBooks">
          ${recentBooks.length === 0
            ? '<p class="text-muted">아직 독서 기록이 없어요</p>'
            : recentBooks.map(b => renderBookCard(b, members)).join('')}
        </div>
      </div>
    `;

    // 체크박스 이벤트
    wrap.querySelectorAll('.todo-check').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.dataset.id;
        const done = !el.classList.contains('done');
        await DB.Todos.toggle(id, done);
        el.classList.toggle('done', done);
        el.innerHTML = done ? '<i class="ti ti-check" style="font-size:11px"></i>' : '';
        const label = el.nextElementSibling;
        if (label) label.classList.toggle('done', done);
        toast(done ? '완료했어요! 🎉' : '다시 할 일로 변경했어요');
      });
    });
  }
};

function renderEventRow(e, members) {
  const m = members.find(x => x.id === e.authorId);
  const color = m?.color || Auth.MEMBER_COLORS[0];
  return `
    <div class="todo-item">
      <div style="width:8px;height:8px;border-radius:50%;background:${color.dot};flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${escHtml(e.title)}</div>
        <div style="font-size:11px;color:var(--text-3)">${m?.name || ''} ${e.time ? '· ' + e.time : ''}</div>
      </div>
      <span class="badge ${e.shared ? 'badge-shared' : 'badge-private'}">${e.shared ? '공유' : '나만'}</span>
    </div>
  `;
}

function renderTodoRow(t, members) {
  const m = members.find(x => x.id === t.authorId);
  return `
    <div class="todo-item">
      <div class="todo-check${t.done ? ' done' : ''}" data-id="${t.id}">
        ${t.done ? '<i class="ti ti-check" style="font-size:11px"></i>' : ''}
      </div>
      <div style="flex:1">
        <div class="todo-label${t.done ? ' done' : ''}">${escHtml(t.title)}</div>
        ${m ? `<div style="font-size:11px;color:var(--text-3)">${m.name}</div>` : ''}
      </div>
    </div>
  `;
}

function renderBookCard(b, members) {
  const m = members.find(x => x.id === b.authorId);
  const color = m?.color || Auth.MEMBER_COLORS[0];
  const stars = '★'.repeat(b.rating||0) + '☆'.repeat(5-(b.rating||0));
  return `
    <div class="book-card">
      <div class="book-cover" style="background:${color.bg}">📚</div>
      <div style="font-size:13px;font-weight:500;margin-bottom:3px;line-height:1.4">${escHtml(b.title)}</div>
      <div style="font-size:11px;color:var(--text-3)">${m?.name || ''} · ${formatDate(b.date)}</div>
      <div style="color:var(--amber);font-size:11px;margin-top:3px">${stars}</div>
      <div style="margin-top:6px">
        <span class="badge ${b.shared ? 'badge-shared' : 'badge-private'}">${b.shared ? '가족 공유' : '나만 보기'}</span>
      </div>
    </div>
  `;
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
