# 우리 가족 웹앱 — 설정 가이드

## 1단계: Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. **새 프로젝트 만들기** 클릭
3. 프로젝트 이름: `family-app` (원하는 이름)
4. Google Analytics는 선택 사항 (필요 없으면 비활성화)

---

## 2단계: Firebase 서비스 활성화

### Authentication
1. 왼쪽 메뉴 > **Authentication** > 시작하기
2. **Sign-in method** 탭 > **Google** 활성화
3. 프로젝트 지원 이메일 입력 후 저장

### Firestore Database
1. 왼쪽 메뉴 > **Firestore Database** > 데이터베이스 만들기
2. **프로덕션 모드** 선택 (보안 규칙은 아래에서 설정)
3. 위치: `asia-northeast3` (서울)

### Firestore 보안 규칙 설정
1. Firestore > **규칙** 탭
2. `firestore.rules` 파일 내용 전체 복사 → 붙여넣기
3. **게시** 클릭

---

## 3단계: Firebase 앱 등록

1. Firebase 콘솔 > 프로젝트 설정 (⚙️)
2. **내 앱** 섹션 > **웹** 아이콘 (`</>`) 클릭
3. 앱 닉네임 입력 후 **앱 등록**
4. 아래와 같은 config 값 복사:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

5. `js/firebase-config.js` 파일에 붙여넣기

---

## 4단계: GitHub Pages 배포

### 4-1. GitHub 레포지토리 생성
```bash
git init
git add .
git commit -m "Initial commit: 우리 가족 웹앱"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/family-app.git
git push -u origin main
```

### 4-2. GitHub Pages 활성화
1. GitHub 레포지토리 > **Settings**
2. **Pages** 메뉴
3. Source: **Deploy from a branch**
4. Branch: `main` / `/ (root)` 선택 > **Save**
5. 배포 URL: `https://YOUR_USERNAME.github.io/family-app/`

### 4-3. Firebase 인증 도메인 추가
1. Firebase 콘솔 > Authentication > **Settings** 탭
2. **승인된 도메인** 섹션 > **도메인 추가**
3. `YOUR_USERNAME.github.io` 입력 후 추가

---

## 5단계: 앱 사용 시작

1. `https://YOUR_USERNAME.github.io/family-app/login.html` 접속
2. **Google로 로그인**
3. **새 가족 그룹 만들기**
4. 이름, 역할 설정 → 초대 코드 생성
5. 가족에게 초대 코드 공유 (예: `FAM-AB3K7P`)
6. 나머지 가족은 **초대 코드로 합류** 선택

---

## 파일 구조

```
family-app/
├── index.html          # 메인 앱 (로그인 후)
├── login.html          # 로그인 / 가족 설정
├── css/
│   └── style.css       # 공통 스타일
├── js/
│   ├── firebase-config.js  # ← Firebase 키 입력
│   ├── auth.js         # 인증 + 가족 그룹 관리
│   ├── db.js           # Firestore CRUD
│   ├── app.js          # 메인 컨트롤러
│   └── pages/
│       ├── dashboard.js
│       ├── edu.js
│       ├── calendar.js
│       ├── todo.js
│       └── growth.js
└── firestore.rules     # 보안 규칙 (콘솔에 붙여넣기)
```

---

## 업데이트 방법

코드 수정 후:
```bash
git add .
git commit -m "기능 추가: ..."
git push
```
GitHub Pages가 자동으로 재배포됩니다 (1~2분 소요).

---

## 무료 사용 한도 (Firebase Spark 무료 플랜)

| 항목 | 무료 한도 |
|------|-----------|
| Firestore 읽기 | 50,000회/일 |
| Firestore 쓰기 | 20,000회/일 |
| Firestore 저장 | 1GB |
| Authentication | 무제한 |

가족 앱 규모에서는 무료 한도를 초과할 일이 거의 없어요.
