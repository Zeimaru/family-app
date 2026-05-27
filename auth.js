// =============================================
// db.js - Firestore 데이터 레이어
// =============================================

const DB = (() => {

  function familyRef() {
    const fam = Auth.getCurrentFamily();
    if (!fam) throw new Error('가족 그룹 없음');
    return db.collection('families').doc(fam.id);
  }

  function uid() { return Auth.getCurrentUser().uid; }

  function canRead(doc) {
    return doc.shared === true || doc.authorId === uid();
  }

  // ══════════════════════════════════════════
  // 📚 독서 기록
  // ══════════════════════════════════════════
  const Books = {
    async add(data) {
      return familyRef().collection('books').add({
        ...data, authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    async list(memberId = null) {
      const snap = await familyRef().collection('books').orderBy('createdAt','desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(canRead);
      if (memberId) docs = docs.filter(d => d.authorId === memberId);
      return docs;
    },
    async update(id, data) { return familyRef().collection('books').doc(id).update(data); },
    async remove(id)       { return familyRef().collection('books').doc(id).delete(); },
    subscribe(cb) {
      return familyRef().collection('books').orderBy('createdAt','desc')
        .onSnapshot(snap => cb(snap.docs.map(d=>({id:d.id,...d.data()})).filter(canRead)));
    }
  };

  // ══════════════════════════════════════════
  // 📺 엘리하이 기록
  // ══════════════════════════════════════════
  const Elihigh = {
    async add(data) {
      return familyRef().collection('elihigh').add({
        ...data, authorId: uid(),
        completed: false, parentApproved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    async list(memberId = null, dateStr = null) {
      let q = familyRef().collection('elihigh').orderBy('date','desc');
      const snap = await q.get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (memberId) docs = docs.filter(d => d.subjectId === memberId);
      if (dateStr)  docs = docs.filter(d => d.date === dateStr);
      return docs;
    },
    async listByMonth(year, month) {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end   = `${year}-${String(month+1).padStart(2,'0')}-01`;
      const snap  = await familyRef().collection('elihigh')
        .where('date','>=',start).where('date','<',end).orderBy('date','desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    async setComplete(id, completed) {
      return familyRef().collection('elihigh').doc(id).update({ completed });
    },
    async parentApprove(id) {
      return familyRef().collection('elihigh').doc(id).update({ completed: true, parentApproved: true });
    },
    async remove(id) { return familyRef().collection('elihigh').doc(id).delete(); }
  };

  // ══════════════════════════════════════════
  // 📖 문제집
  // ══════════════════════════════════════════
  const Workbooks = {
    // 부모가 문제집 등록
    async add(data) {
      return familyRef().collection('workbooks').add({
        ...data, authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    async list(childId = null) {
      const snap = await familyRef().collection('workbooks').orderBy('createdAt','desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (childId) docs = docs.filter(d => d.assignedTo === childId);
      return docs;
    },
    async remove(id) { return familyRef().collection('workbooks').doc(id).delete(); },

    // 자녀가 일별 진행 체크
    async addLog(workbookId, data) {
      return familyRef().collection('workbooks').doc(workbookId)
        .collection('logs').add({
          ...data, authorId: uid(),
          completed: false, parentApproved: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },
    async listLogs(workbookId) {
      const snap = await familyRef().collection('workbooks').doc(workbookId)
        .collection('logs').orderBy('date','desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    async setLogComplete(workbookId, logId, completed) {
      return familyRef().collection('workbooks').doc(workbookId)
        .collection('logs').doc(logId).update({ completed });
    },
    async parentApproveLog(workbookId, logId) {
      return familyRef().collection('workbooks').doc(workbookId)
        .collection('logs').doc(logId).update({ completed: true, parentApproved: true });
    },
    async removeLog(workbookId, logId) {
      return familyRef().collection('workbooks').doc(workbookId)
        .collection('logs').doc(logId).delete();
    }
  };

  // ══════════════════════════════════════════
  // ✅ 알림장 / 숙제 / 준비물
  // ══════════════════════════════════════════
  const Todos = {
    async add(data) {
      return familyRef().collection('todos').add({
        ...data, authorId: uid(), done: false, shared: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    async list(type = null, memberId = null) {
      const snap = await familyRef().collection('todos').orderBy('createdAt','desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (type)     docs = docs.filter(d => d.type === type);
      if (memberId) docs = docs.filter(d => d.authorId === memberId);
      return docs;
    },
    async toggle(id, done) {
      return familyRef().collection('todos').doc(id).update({
        done, doneAt: done ? firebase.firestore.FieldValue.serverTimestamp() : null
      });
    },
    async remove(id) { return familyRef().collection('todos').doc(id).delete(); },
    subscribe(cb) {
      return familyRef().collection('todos').orderBy('createdAt','desc')
        .onSnapshot(snap => cb(snap.docs.map(d=>({id:d.id,...d.data()}))));
    }
  };

  // ══════════════════════════════════════════
  // 📅 캘린더
  // ══════════════════════════════════════════
  const Calendar = {
    async add(data) {
      return familyRef().collection('events').add({
        ...data, authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    async listByMonth(year, month) {
      const start = new Date(year, month-1, 1).toISOString().slice(0,10);
      const end   = new Date(year, month, 1).toISOString().slice(0,10);
      const snap  = await familyRef().collection('events')
        .where('date','>=',start).where('date','<',end).orderBy('date').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.shared === true || e.authorId === uid());
    },
    async update(id, data) { return familyRef().collection('events').doc(id).update(data); },
    async remove(id)       { return familyRef().collection('events').doc(id).delete(); },
    subscribe(year, month, cb) {
      const start = new Date(year,month-1,1).toISOString().slice(0,10);
      const end   = new Date(year,month,1).toISOString().slice(0,10);
      return familyRef().collection('events')
        .where('date','>=',start).where('date','<',end).orderBy('date')
        .onSnapshot(snap => cb(snap.docs.map(d=>({id:d.id,...d.data()}))
          .filter(e=>e.shared===true||e.authorId===uid())));
    }
  };

  // ══════════════════════════════════════════
  // 🌱 가족 기록
  // ══════════════════════════════════════════
  const Growth = {
    async add(data) {
      return familyRef().collection('growth').add({
        ...data, authorId: uid(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    },
    async list(memberId = null, tag = null) {
      const snap = await familyRef().collection('growth').orderBy('date','desc').get();
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.shared === true || r.authorId === uid());
      if (memberId) docs = docs.filter(d => d.subjectId === memberId);
      if (tag)      docs = docs.filter(d => d.tags?.includes(tag));
      return docs;
    },
    async remove(id) { return familyRef().collection('growth').doc(id).delete(); },
    subscribe(cb) {
      return familyRef().collection('growth').orderBy('date','desc')
        .onSnapshot(snap => cb(snap.docs.map(d=>({id:d.id,...d.data()}))
          .filter(r=>r.shared===true||r.authorId===uid())));
    }
  };

  const Members = {
    async list() { return Auth.getFamilyMembers(); }
  };

  return { Books, Elihigh, Workbooks, Todos, Calendar, Growth, Members };
})();
