// =============================================
// auth.js - 인증 및 가족 그룹 관리
// =============================================

const Auth = (() => {
  let currentUser = null;
  let currentFamily = null;

  // ── 로그인 상태 감지 ──────────────────────────
  function onAuthReady(callback) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        try {
          currentFamily = await loadFamilyData(user.uid);
        } catch(e) {
          console.error('loadFamilyData error:', e);
          currentFamily = null;
        }
        callback({ user, family: currentFamily });
      } else {
        currentUser = null;
        currentFamily = null;
        callback({ user: null, family: null });
      }
    });
  }

  // ── Google 로그인 ─────────────────────────────
  async function loginWithGoogle() {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      return { success: true, user: result.user };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ── 로그아웃 ──────────────────────────────────
  async function logout() {
    await auth.signOut();
  }

  // ── 가족 그룹 데이터 로드 ──────────────────────
  // collectionGroup 대신 유저 문서에 familyId 저장하는 방식으로 변경
  async function loadFamilyData(uid) {
    // 유저 프로필 문서에서 familyId 읽기
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return null;

    const familyId = userDoc.data().familyId;
    if (!familyId) return null;

    const familyDoc = await db.collection('families').doc(familyId).get();
    if (!familyDoc.exists) return null;

    return { id: familyId, ...familyDoc.data() };
  }

  // ── 가족 그룹 생성 ────────────────────────────
  async function createFamily(familyName, myName, role) {
    const uid = currentUser.uid;
    const inviteCode = generateInviteCode();

    // 가족 문서 생성
    const familyRef = await db.collection('families').add({
      name: familyName,
      inviteCode,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: uid
    });

    const color = MEMBER_COLORS[0];

    // 구성원 등록
    await familyRef.collection('members').doc(uid).set({
      uid,
      name: myName,
      role,
      email: currentUser.email,
      photoURL: currentUser.photoURL || '',
      color,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 유저 프로필에 familyId 저장 (빠른 조회용)
    await db.collection('users').doc(uid).set({
      familyId: familyRef.id,
      name: myName,
      email: currentUser.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentFamily = { id: familyRef.id, name: familyName, inviteCode };
    return currentFamily;
  }

  // ── 초대코드로 가족 합류 ──────────────────────
  async function joinFamily(inviteCode, myName, role) {
    const uid = currentUser.uid;

    // 초대코드로 가족 찾기
    const snap = await db.collection('families')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return { success: false, error: '유효하지 않은 초대 코드입니다.' };
    }

    const familyDoc = snap.docs[0];
    const familyId = familyDoc.id;

    // 이미 가입 확인
    const existing = await db.collection('families').doc(familyId)
      .collection('members').doc(uid).get();
    if (existing.exists) {
      return { success: false, error: '이미 가입된 가족입니다.' };
    }

    // 색상 지정
    const membersSnap = await db.collection('families').doc(familyId)
      .collection('members').get();
    const color = MEMBER_COLORS[membersSnap.size % MEMBER_COLORS.length];

    // 구성원 등록
    await db.collection('families').doc(familyId)
      .collection('members').doc(uid).set({
        uid,
        name: myName,
        role,
        email: currentUser.email,
        photoURL: currentUser.photoURL || '',
        color,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    // 유저 프로필에 familyId 저장
    await db.collection('users').doc(uid).set({
      familyId,
      name: myName,
      email: currentUser.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentFamily = { id: familyId, ...familyDoc.data() };
    return { success: true, family: currentFamily };
  }

  // ── 가족 구성원 목록 ──────────────────────────
  async function getFamilyMembers() {
    if (!currentFamily) return [];
    const snap = await db.collection('families').doc(currentFamily.id)
      .collection('members').orderBy('joinedAt').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // ── 초대코드 재발급 ───────────────────────────
  async function refreshInviteCode() {
    if (!currentFamily) return null;
    const newCode = generateInviteCode();
    await db.collection('families').doc(currentFamily.id)
      .update({ inviteCode: newCode });
    currentFamily.inviteCode = newCode;
    return newCode;
  }

  // ── Helpers ───────────────────────────────────
  function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'FAM-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  const MEMBER_COLORS = [
    { bg: '#E6F1FB', text: '#185FA5', dot: '#185FA5' },
    { bg: '#FBEAF0', text: '#993556', dot: '#993556' },
    { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
    { bg: '#FAEEDA', text: '#854F0B', dot: '#BA7517' },
    { bg: '#EEEDFE', text: '#534AB7', dot: '#534AB7' },
    { bg: '#FAECE7', text: '#993C1D', dot: '#D85A30' },
  ];

  function getCurrentUser()   { return currentUser; }
  function getCurrentFamily() { return currentFamily; }

  return {
    onAuthReady, loginWithGoogle, logout,
    createFamily, joinFamily, getFamilyMembers, refreshInviteCode,
    getCurrentUser, getCurrentFamily, MEMBER_COLORS
  };
})();
