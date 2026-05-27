// =============================================
// Firebase 설정 파일 (MyHome-Manager 프로젝트)
// =============================================

const firebaseConfig = {
  apiKey: "AIzaSyBQcJ_MDsBjNmXoCK2VXxvpYcNu_ziKQLs",
  authDomain: "myhome-manager.firebaseapp.com",
  projectId: "myhome-manager",
  storageBucket: "myhome-manager.firebasestorage.app",
  messagingSenderId: "1024078971815",
  appId: "1:1024078971815:web:2aca9e1c06b0dd66d8ac82",
  measurementId: "G-PYBN8RLZW9"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google 로그인 프로바이더
const googleProvider = new firebase.auth.GoogleAuthProvider();
