// =============================================
// auth.js - 인증 및 가족 그룹 관리
// =============================================

const Auth = (() => {
  let currentUser = null;
  let currentFamily = null;

  function onAuthReady(callback) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        try {
          currentFamily = await loadFamilyData(user.uid);
        } catch(e) {
          console.log('loadFamilyData error:', e.code);
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

  async function loginWithGoogle() {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      return { success: true, user: result.user };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function logout() {
    await auth.signOut();
  }

  // users 컬렉션에서 familyId 조회
  async function loadFamilyData(uid) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) return null;
      const familyId = userDoc.data().familyId;
      if (!familyId) return null;
      const familyDoc = await db.collection('families').doc(familyId).get();
      if (!familyDoc.exists) return null;
      return { id: familyId, ...familyDoc.data() };
    } catch(e) {
      console.log('loadFamilyData:', e.code);
      return null;
    }
  }

  async function createFamily(familyName, myName, role) {
    const uid = currentUser.uid;
    const inviteCode = generateInviteCode();
    const color = MEMBER_COLORS[0];

    const familyRef = await db.collection('families').add({
      name: familyName,
      inviteCode,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: uid
    });

    await familyRef.collection('members').doc(uid).set({
      uid, name: myName, role,
      email: currentUser.email,
      photoURL: currentUser.photoURL || '',
      color,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('users').doc(uid).set({
      familyId: familyRef.id, name: myName,
      email: currentUser.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentFamily = { id: familyRef.id, name: familyName, inviteCode };
    return currentFamily;
  }

  async function joinFamily(inviteCode, myName, role) {
    const uid = currentUser.uid;

    // 초대코드로 가족 찾기
    const snap = await db.collection('families')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1).get();

    if (snap.empty) {
      return { success: false, error: '유효하지 않은 초대 코드입니다.' };
    }

    const familyDoc = snap.docs[0];
    const familyId = familyDoc.id;

    // 색상 랜덤 지정 (members 읽기 불필요)
    const color = MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];

    // 구성원 등록
    await db.collection('families').doc(familyId)
      .collection('members').doc(uid).set({
        uid, name: myName, role,
        email: currentUser.email,
        photoURL: currentUser.photoURL || '',
        color,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    // 유저 프로필 저장
    await db.collection('users').doc(uid).set({
      familyId, name: myName,
      email: currentUser.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentFamily = { id: familyId, ...familyDoc.data() };
    return { success: true, family: currentFamily };
  }

  async function getFamilyMembers() {
    if (!currentFamily) return [];
    const snap = await db.collection('families').doc(currentFamily.id)
      .collection('members').orderBy('joinedAt').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function refreshInviteCode() {
    if (!currentFamily) return null;
    const newCode = generateInviteCode();
    await db.collection('families').doc(currentFamily.id)
      .update({ inviteCode: newCode });
    currentFamily.inviteCode = newCode;
    return newCode;
  }

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
