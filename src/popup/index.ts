// src/popup/index.ts

document.addEventListener('DOMContentLoaded', async () => {
  const toggleMascot = document.getElementById('toggle-mascot') as HTMLInputElement;
  const btnCheckMail = document.getElementById('btn-check-mail') as HTMLButtonElement;
  const btnAuth = document.getElementById('btn-auth') as HTMLButtonElement;
  const statusText = document.getElementById('status') as HTMLDivElement;
  const coinCountEl = document.getElementById('coin-count') as HTMLSpanElement;

  // 1. 초기 마스코트 상태 및 코인 로드
  const storage = await chrome.storage.local.get(['mascotEnabled', 'pyungAlCoins']);
  const isEnabled = storage.mascotEnabled !== false;
  toggleMascot.checked = isEnabled;
  coinCountEl.textContent = (storage.pyungAlCoins || 0).toString();

  // 2. 마스코트 토글 이벤트
  toggleMascot.addEventListener('change', async () => {
    const enabled = toggleMascot.checked;
    await chrome.storage.local.set({ mascotEnabled: enabled });
    
    // 현재 탭에 상태 변경 알림 (이미 생성된 캐릭터를 숨기거나 보이기 위함)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_MASCOT', enabled });
    }
  });

  // 3. 메일 확인 버튼
  btnCheckMail.addEventListener('click', () => {
    statusText.textContent = '메일을 확인하고 있어요...';
    chrome.runtime.sendMessage({ type: 'CHECK_MAIL_MANUAL' }, (response) => {
      if (response?.success) {
        statusText.textContent = '확인이 완료되었습니다!';
      } else {
        statusText.textContent = '확인 중 오류가 발생했습니다.';
      }
      setTimeout(() => updateAuthStatus(), 2000);
    });
  });

  // 4. 인증 버튼 (연결/해제)
  btnAuth.addEventListener('click', async () => {
    const token = await getAuthToken(true);
    if (token) {
      // 이미 연결되어 있다면 해제 로직 (선택적) 또는 재인증
      statusText.textContent = '인증에 성공했습니다!';
      updateAuthStatus();
    } else {
      statusText.textContent = '인증에 실패했습니다.';
    }
  });

  // 인증 상태 업데이트 함수
  async function updateAuthStatus() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError || !token) {
        btnAuth.textContent = 'Gmail 연결하기';
        btnAuth.classList.remove('btn-secondary');
        btnAuth.classList.add('btn-primary');
        statusText.textContent = 'Gmail 연동이 필요합니다.';
      } else {
        btnAuth.textContent = '연결됨 (로그아웃은 브라우저 설정)';
        btnAuth.classList.remove('btn-primary');
        btnAuth.classList.add('btn-secondary');
        statusText.textContent = 'Gmail과 정상적으로 연결되었습니다.';
      }
    });
  }

  function getAuthToken(interactive: boolean): Promise<string | undefined> {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          resolve(undefined);
        } else {
          resolve(token);
        }
      });
    });
  }

  // 최초 로드 시 상태 업데이트
  updateAuthStatus();
});
