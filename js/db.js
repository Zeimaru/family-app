// =============================================
// db.js - Firestore 데이터 레이어 (공통 CRUD)
// =============================================

const DB = (() => {

  function familyRef() {
    const fam = Auth.getCurrentFamily();
    if (!fam) throw new Error('가족 그룹에 참여되지 않았습니다.');
    return db.collection('families').doc(fam.id);
  }

  function uid() {
    return Auth.getCurrentUser().uid;
  }

  // ── 공개범위 필터 헬퍼 ────────────────────────
  // shared: true → 가족 전체 / false → 본인만
  function visibilityFilter(query) {
    // Firestore OR 쿼리 대신 클라이언트 필터 사용
    // (복합 인덱스 없이 동작)
    return query;
  }

  function canRead(doc) {
    return doc.shared === true || doc.authorId === uid();
  }

  // ══════════════════════════════════════════
  // 📚 독서 기록
  // ══════════════════════════════════════════
  const Books = {
    async add(data) {
      return familyRef().collection('books').add({
        ...data,
        authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async list(memberId = null) {
      let q = familyRef().collection('books').orderBy('createdAt', 'desc');
      const snap = await q.get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs = docs.filter(canRead);
      if (memberId) docs = docs.filter(d => d.authorId === memberId);
      return docs;
    },

    async update(bookId, data) {
      return familyRef().collection('books').doc(bookId).update(data);
    },

    async remove(bookId) {
      return familyRef().collection('books').doc(bookId).delete();
    },

    // 실시간 구독
    subscribe(callback) {
      return familyRef().collection('books')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
          callback(docs);
        });
    }
  };

  // ══════════════════════════════════════════
  // 📄 학습지
  // ══════════════════════════════════════════
  const Worksheets = {
    async add(data) {
      return familyRef().collection('worksheets').add({
        ...data,
        authorId: uid(),
        progress: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async list(memberId = null) {
      const snap = await familyRef().collection('worksheets')
        .orderBy('createdAt', 'desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
      if (memberId) docs = docs.filter(d => d.authorId === memberId);
      return docs;
    },

    async updateProgress(wsId, progress) {
      return familyRef().collection('worksheets').doc(wsId).update({ progress });
    },

    async remove(wsId) {
      return familyRef().collection('worksheets').doc(wsId).delete();
    }
  };

  // ══════════════════════════════════════════
  // ✅ 할 일 / 숙제
  // ══════════════════════════════════════════
  const Todos = {
    async add(data) {
      return familyRef().collection('todos').add({
        ...data,
        authorId: uid(),
        done: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async list(memberId = null) {
      const snap = await familyRef().collection('todos')
        .orderBy('createdAt', 'desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
      if (memberId) docs = docs.filter(d => d.authorId === memberId);
      return docs;
    },

    async toggle(todoId, done) {
      return familyRef().collection('todos').doc(todoId).update({
        done,
        doneAt: done ? firebase.firestore.FieldValue.serverTimestamp() : null
      });
    },

    async remove(todoId) {
      return familyRef().collection('todos').doc(todoId).delete();
    },

    // 실시간 구독
    subscribe(callback) {
      return familyRef().collection('todos')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
          callback(docs);
        });
    }
  };

  // ══════════════════════════════════════════
  // 📅 캘린더 일정
  // ══════════════════════════════════════════
  const Calendar = {
    async add(data) {
      return familyRef().collection('events').add({
        ...data,
        authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    // 월별 조회
    async listByMonth(year, month) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 1);
      const snap = await familyRef().collection('events')
        .where('date', '>=', start.toISOString().slice(0, 10))
        .where('date', '<',  end.toISOString().slice(0, 10))
        .orderBy('date').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
    },

    async update(eventId, data) {
      return familyRef().collection('events').doc(eventId).update(data);
    },

    async remove(eventId) {
      return familyRef().collection('events').doc(eventId).delete();
    },

    subscribe(year, month, callback) {
      const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const end   = new Date(year, month, 1).toISOString().slice(0, 10);
      return familyRef().collection('events')
        .where('date', '>=', start)
        .where('date', '<',  end)
        .orderBy('date')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
          callback(docs);
        });
    }
  };

  // ══════════════════════════════════════════
  // 🌱 성장 기록
  // ══════════════════════════════════════════
  const Growth = {
    async add(data) {
      return familyRef().collection('growth').add({
        ...data,
        authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    async list(memberId = null, tag = null) {
      const snap = await familyRef().collection('growth')
        .orderBy('date', 'desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
      if (memberId) docs = docs.filter(d => d.subjectId === memberId);
      if (tag)      docs = docs.filter(d => d.tags?.includes(tag));
      return docs;
    },

    async remove(growthId) {
      return familyRef().collection('growth').doc(growthId).delete();
    },

    subscribe(callback) {
      return familyRef().collection('growth')
        .orderBy('date', 'desc')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
          callback(docs);
        });
    }
  };

  // ══════════════════════════════════════════
  // 👥 구성원 프로필
  // ══════════════════════════════════════════
  const Members = {
    async list() {
      return Auth.getFamilyMembers();
    },

    async updateProfile(name, color) {
      const me = uid();
      const fam = Auth.getCurrentFamily();
      return db.collection('families').doc(fam.id)
        .collection('members').doc(me).update({ name, color });
    }
  };

  return { Books, Worksheets, Todos, Calendar, Growth, Members };
})();
