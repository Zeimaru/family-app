// =============================================
// pages/dashboard.js - 홈 대시보드
// =============================================

const Pages = window.Pages || {};

Pages.Dashboard = {
  _year: new Date().getFullYear(),
  _month: new Date().getMonth() + 1,

  async render(wrap, members) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일 ${['일','월','화','수','목','금','토'][today.getDay()]}요일`;
    const children = members.filter(m => m.role === 'child');
    const todayISO = todayStr();

    // 병렬 데이터 로드
    const [events, elihighToday, workbooks] = await Promise.all([
      DB.Calendar.listByMonth(today.getFullYear(), today.getMonth()+1),
      DB.Elihigh.list(null, todayISO),
      DB.Workbooks.list()
    ]);

    // 자녀별 이번 달 독서량
    const bookCounts = {};
    for (const child of children) {
      const books = await DB.Books.list(child.id);
      const thisMonth = books.filter(b => b.date && b.date.startsWith(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`));
      bookCounts[child.id] = thisMonth.length;
    }
    const maxBooks = Math.max(...Object.values(bookCounts), 1);

    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>홈</h1>
          <p>${dateStr}</p>
        </div>
      </div>

      <!-- 독서량 게이지 -->
      <div class="card" style="margin-bottom:var(--gap)">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-book-2" style="color:var(--primary)"></i>이번 달 독서량</div>
          <button class="btn btn-sm" onclick="App.navigate('studylist')">전체 보기</button>
        </div>
        ${children.length === 0
          ? '<p class="text-muted">아직 자녀 구성원이 없어요</p>'
          : children.map(child => {
              const cnt = bookCounts[child.id] || 0;
              const color = child.color || Auth.MEMBER_COLORS[0];
              const pct = Math.round((cnt / Math.max(maxBooks, 10)) * 100);
              return `
                <div style="margin-bottom:12px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                    <span style="font-size:13px;font-weight:500">${escHtml(child.name)}</span>
                    <span style="font-size:13px;color:var(--primary);font-weight:500">${cnt}권</span>
                  </div>
                  <div style="height:10px;background:var(--bg);border-radius:5px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:${color.dot};border-radius:5px;transition:width .5s"></div>
                  </div>
                </div>
              `;
            }).join('')}
      </div>

      <!-- 오늘 엘리하이 / 문제집 현황 -->
      <div class="card" style="margin-bottom:var(--gap)">
        <div class="card-hd">
          <div class="card-title"><i class="ti ti-device-laptop" style="color:var(--blue)"></i>오늘 학습 현황</div>
          <span style="font-size:12px;color:var(--text-3)">${todayISO}</span>
        </div>
        ${children.map(child => {
          const color = child.color || Auth.MEMBER_COLORS[0];
          const eli = elihighToday.filter(e => e.subjectId === child.id);
          const eliDone = eli.filter(e => e.completed).length;
          const eliTotal = eli.length;
          const childBooks = workbooks.filter(w => w.assignedTo === child.id);
          return `
            <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:0.5px solid var(--border)">
              <div style="font-size:13px;font-weight:500;margin-bottom:8px;display:flex;align-items:center;gap:6px">
                <div class="avatar" style="width:22px;height:22px;font-size:10px;background:${color.bg};color:${color.text}">${child.name.slice(0,2)}</div>
                ${escHtml(child.name)}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <div style="background:${eliDone>0?'var(--primary-light)':'var(--bg)'};border-radius:var(--radius-md);padding:6px 12px;font-size:12px">
                  <span style="color:var(--text-3)">엘리하이</span>
                  <span style="font-weight:500;margin-left:6px;color:${eliDone>0?'var(--primary-dark)':'var(--text-2)'}">
                    ${eliTotal === 0 ? '기록 없음' : `${eliDone}/${eliTotal} 완료`}
                  </span>
                </div>
                ${childBooks.map(wb => `
                  <div style="background:var(--bg);border-radius:var(--radius-md);padding:6px 12px;font-size:12px">
                    <span style="color:var(--text-3)">${escHtml(wb.title)}</span>
                    <span style="font-weight:500;margin-left:6px;color:var(--text-2)">확인 필요</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 캘린더 -->
      <div class="card">
        <div class="card-hd">
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-icon btn-sm" id="calPrev"><i class="ti ti-chevron-left"></i></button>
            <div class="card-title" id="calTitle"><i class="ti ti-calendar" style="color:var(--blue)"></i>${this._year}년 ${this._month}월</div>
            <button class="btn btn-icon btn-sm" id="calNext"><i class="ti ti-chevron-right"></i></button>
          </div>
          <button class="btn btn-sm" onclick="App.navigate('calendar')">전체 보기</button>
        </div>
        <!-- 구성원 범례 -->
        <div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap">
          ${members.map(m => `
            <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-2)">
              <div style="width:8px;height:8px;border-radius:50%;background:${m.color?.dot||'#ccc'}"></div>${m.name}
            </div>
          `).join('')}
        </div>
        <div class="cal-grid" style="margin-bottom:4px">
          ${['일','월','화','수','목','금','토'].map((d,i)=>
            `<div class="cal-head" style="${i===0?'color:#A32D2D':i===6?'color:#185FA5':''}">${d}</div>`
          ).join('')}
        </div>
        <div class="cal-grid" id="dashCal"></div>
      </div>
    `;

    this._renderCal(wrap, members, events);

    wrap.querySelector('#calPrev').addEventListener('click', async () => {
      this._month--;
      if (this._month < 1) { this._month = 12; this._year--; }
      const evs = await DB.Calendar.listByMonth(this._year, this._month);
      wrap.querySelector('#calTitle').innerHTML = `<i class="ti ti-calendar" style="color:var(--blue)"></i>${this._year}년 ${this._month}월`;
      this._renderCal(wrap, members, evs);
    });
    wrap.querySelector('#calNext').addEventListener('click', async () => {
      this._month++;
      if (this._month > 12) { this._month = 1; this._year++; }
      const evs = await DB.Calendar.listByMonth(this._year, this._month);
      wrap.querySelector('#calTitle').innerHTML = `<i class="ti ti-calendar" style="color:var(--blue)"></i>${this._year}년 ${this._month}월`;
      this._renderCal(wrap, members, evs);
    });
  },

  _renderCal(wrap, members, events) {
    const grid = wrap.querySelector('#dashCal');
    if (!grid) return;
    grid.innerHTML = '';
    const firstDay = new Date(this._year, this._month-1, 1).getDay();
    const daysInMonth = new Date(this._year, this._month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear()===this._year && today.getMonth()+1===this._month;

    for (let i = 0; i < firstDay; i++) grid.insertAdjacentHTML('beforeend','<div></div>');

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${this._year}-${String(this._month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvs = events.filter(e => e.date === ds);
      const isToday = isCurrentMonth && today.getDate() === d;
      const dow = new Date(this._year, this._month-1, d).getDay();

      const cell = document.createElement('div');
      cell.className = 'cal-cell' + (isToday ? ' today' : '');
      cell.innerHTML = `
        <div class="cal-dn" style="${dow===0?'color:#A32D2D':dow===6?'color:#185FA5':''}">${d}</div>
        ${dayEvs.slice(0,2).map(e => {
          const m = members.find(x => x.id === e.authorId);
          const c = m?.color?.dot || '#888';
          return `<div class="cal-event" style="background:${c}22;color:${c}">${escHtml(e.title)}</div>`;
        }).join('')}
        ${dayEvs.length > 2 ? `<div style="font-size:10px;color:var(--text-3)">+${dayEvs.length-2}</div>` : ''}
      `;
      grid.appendChild(cell);
    }
  }
};

// ══════════════════════════════════════════
// 📋 학습 리스트 페이지 (홈 > 전체 보기)
// ══════════════════════════════════════════
Pages.StudyList = {
  async render(wrap, members) {
    const children = members.filter(m => m.role === 'child');
    wrap.innerHTML = `
      <div class="page-hd">
        <div>
          <h1>학습 기록</h1>
          <p>날짜별 전체 학습 현황</p>
        </div>
      </div>
      <div id="studyListContent">
        <div style="padding:2rem;color:var(--text-3);font-size:14px;text-align:center">
          <div style="font-size:24px;margin-bottom:8px">⏳</div>불러오는 중...
        </div>
      </div>
    `;

    // 데이터 로드
    const today = new Date();
    const [elihigh, workbooks, books] = await Promise.all([
      DB.Elihigh.listByMonth(today.getFullYear(), today.getMonth() + 1),
      DB.Workbooks.list(),
      DB.Books.list()
    ]);

    // 문제집별 로그 로드
    const wbLogs = {};
    for (const wb of workbooks) {
      wbLogs[wb.id] = await DB.Workbooks.listLogs(wb.id);
    }

    // 날짜 목록 수집 (최근 30일)
    const dateSet = new Set();
    elihigh.forEach(e => dateSet.add(e.date));
    Object.values(wbLogs).forEach(logs => logs.forEach(l => dateSet.add(l.date)));
    books.forEach(b => { if (b.date) dateSet.add(b.date); });

    // 최근 30일 날짜 추가
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dateSet.add(d.toISOString().slice(0, 10));
    }

    const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a)).slice(0, 30);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    const html = dates.map(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      const dayLabel = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일(${dayNames[d.getDay()]})`;

      // 이 날짜에 뭔가 기록이 있는지 확인
      const hasData = children.some(child => {
        const eli = elihigh.filter(e => e.subjectId === child.id && e.date === dateStr);
        const wbLogsToday = workbooks
          .filter(wb => wb.assignedTo === child.id)
          .flatMap(wb => (wbLogs[wb.id] || []).filter(l => l.date === dateStr));
        const booksToday = books.filter(b => b.authorId === child.id && b.date === dateStr);
        return eli.length > 0 || wbLogsToday.length > 0 || booksToday.length > 0;
      });

      if (!hasData) return '';

      const childRows = children.map(child => {
        const color = child.color || Auth.MEMBER_COLORS[0];
        const eli = elihigh.filter(e => e.subjectId === child.id && e.date === dateStr);
        const wbLogsToday = workbooks
          .filter(wb => wb.assignedTo === child.id)
          .flatMap(wb => (wbLogs[wb.id] || []).filter(l => l.date === dateStr)
            .map(l => ({ ...l, wbTitle: wb.title })));
        const booksToday = books.filter(b => b.authorId === child.id && b.date === dateStr);

        if (eli.length === 0 && wbLogsToday.length === 0 && booksToday.length === 0) return '';

        const rows = [];

        // 엘리하이
        eli.forEach(e => {
          const done = e.completed;
          const statusColor = done ? 'var(--primary)' : 'var(--amber)';
          const statusLabel = done ? '완료' : '미완료';
          rows.push(`
            <div style="display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:0.5px solid var(--border)">
              <span style="font-size:12px;flex-shrink:0;min-width:80px">
                📺 엘리하이 <span style="color:${statusColor};font-weight:500">${statusLabel}</span>
              </span>
              ${e.content ? `<span style="font-size:12px;color:var(--text-2);line-height:1.5">${escHtml(e.content)}</span>` : ''}
            </div>
          `);
        });

        // 문제집
        wbLogsToday.forEach(log => {
          const done = log.completed;
          const statusColor = done ? 'var(--primary)' : 'var(--amber)';
          const statusLabel = done ? '완료' : '미완료';
          rows.push(`
            <div style="display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:0.5px solid var(--border)">
              <span style="font-size:12px;flex-shrink:0;min-width:80px">
                📖 문제집 <span style="color:${statusColor};font-weight:500">${statusLabel}</span>
              </span>
              <span style="font-size:12px;color:var(--text-2)">
                ${escHtml(log.wbTitle)}${log.memo ? ` - ${escHtml(log.memo)}` : ''}
              </span>
            </div>
          `);
        });

        // 독서감상문
        booksToday.forEach(b => {
          rows.push(`
            <div style="display:flex;gap:6px;align-items:flex-start;padding:5px 0;border-bottom:0.5px solid var(--border)">
              <span style="font-size:12px;flex-shrink:0;min-width:80px">
                📚 독서감상문
              </span>
              <span style="font-size:12px;color:var(--text-2)">
                ${escHtml(b.title)}
                ${b.finished ? ' <span style="color:var(--primary)">완독 ✅</span>' : (b.lastPage ? ` ${b.lastPage}p까지` : '')}
              </span>
            </div>
          `);
        });

        if (rows.length === 0) return '';

        return `
          <div style="margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div class="avatar" style="width:22px;height:22px;font-size:10px;background:${color.bg};color:${color.text}">${child.name.slice(0,2)}</div>
              <span style="font-size:13px;font-weight:500;color:var(--text)">${escHtml(child.name)}</span>
            </div>
            <div style="padding-left:28px">
              ${rows.join('')}
            </div>
          </div>
        `;
      }).join('');

      if (!childRows.trim()) return '';

      return `
        <div class="card" style="margin-bottom:var(--gap)">
          <div style="font-size:14px;font-weight:500;color:var(--text);margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid var(--border)">
            📅 ${dayLabel}
          </div>
          ${childRows}
        </div>
      `;
    }).join('');

    document.getElementById('studyListContent').innerHTML = html ||
      `<div class="card" style="text-align:center;padding:3rem">
        <div style="font-size:32px;margin-bottom:12px">📖</div>
        <p style="color:var(--text-2)">이번 달 학습 기록이 없어요</p>
      </div>`;
  }
};
