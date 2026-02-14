# 🐣 PyungAl Idle Extension

> **웹 페이지를 떠다니는 퓽알이와 행복한 시간을 보내보세요~!**

이 프로젝트는 크롬 확장 프로그램(Manifest V3)으로, 사용자가 웹 서핑을 하는 동안 화면에 마스코트가 돌아다니며 새로운 Gmail 메시지가 도착하면 실시간으로 알려주는 아이들(Idle) 게임 컨셉의 유틸리티입니다.

## ✨ 주요 기능

- **Wandering Mascot**: 화면 어디든 랜덤하게 돌아다니는 퓽알이
- **Gmail 실시간 알림**: 1분마다 Gmail API를 체크하여 읽지 않은 새 메일이 있으면 마스코트가 말풍선으로 제목을 알려줍니다.
- **비간섭 모드**: `pointer-events: none` 설정을 통해 마스코트가 클릭을 방해하지 않아 웹 서핑에 지장을 주지 않습니다.
- **보안 강화**: Vite 환경 변수를 사용하여 OAuth2 Client ID를 안전하게 관리합니다.

## 🛠 기술 스택

- **Language**: TypeScript
- **Bundler**: Vite
- **Framework**: Chrome Extension Manifest V3
- **API**: Google Gmail API (OAuth2)

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정 (.env)
프로젝트 루트에 `.env` 파일을 생성하고 Google Cloud Console에서 발급받은 클라이언트 ID를 입력합니다. (이 파일은 `.gitignore`에 의해 깃허브에 업로드되지 않습니다.)

```env
VITE_GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### 3. 빌드하기
```bash
npm run build
```
빌드가 완료되면 `dist/` 폴더가 생성됩니다.

### 4. 크롬에 확장 프로그램 로드하기
1. 크롬 브라우저에서 `chrome://extensions/`로 이동합니다.
2. 오른쪽 상단의 **개발자 모드**를 활성화합니다.
3. **압축해제된 확장 프로그램을 로드합니다** 버튼을 클릭하고 프로젝트의 `dist/` 폴더를 선택합니다.

## 🔑 Google Cloud Console 설정 방법

이 앱의 지메일 기능을 사용하려면 본인의 Google Cloud 프로젝트 설정이 필요합니다.

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성합니다.
2. **Gmail API**를 사용 설정(Enable)합니다.
3. **OAuth 동의 화면**을 구성하고 테스트 사용자에 본인 이메일을 추가합니다.
4. **사용자 인증 정보**에서 `OAuth 클라이언트 ID`를 생성합니다.
   - 유형: `Chrome 확장 프로그램`
   - 항목 ID: 크롬 확장 프로그램 관리 페이지에서 확인한 확장 프로그램의 고유 ID
5. 발급된 `클라이언트 ID`를 위에서 만든 `.env` 파일에 넣습니다.

## 📁 프로젝트 구조

- `src/background/`: 지메일 API 폴링 및 알람 관리 (Service Worker)
- `src/content/`: 마스코트 렌더링 및 애니메이션 로직
- `src/popup/`: 확장 프로그램 팝업 UI
- `public/`: `manifest.json` 및 이미지 리소스
- `vite.config.ts`: 환경 변수 주입 및 빌드 설정

---

**Happy Idling with PyungAl!** 🐥
<img width="90" height="90" alt="image" src="https://github.com/user-attachments/assets/709d46c6-8fa0-43b5-90f0-5cf07903430d" />

