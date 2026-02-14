// src/popup/index.ts

document.addEventListener('DOMContentLoaded', async () => {
  const toggleMascot = document.getElementById('toggle-mascot') as HTMLInputElement;
  const btnCheckMail = document.getElementById('btn-check-mail') as HTMLButtonElement;
  const btnAuth = document.getElementById('btn-auth') as HTMLButtonElement;
  const statusText = document.getElementById('status') as HTMLDivElement;
  const coinCountEl = document.getElementById('coin-count') as HTMLSpanElement;
  const tabs = document.querySelectorAll('.tab');
  const buyButtons = document.querySelectorAll('.btn-buy');

  // 1. 초기 로드 (상태, 코인, 보유 아이템)
  const storage = await chrome.storage.local.get(['mascotEnabled', 'pyungAlCoins', 'ownedItems']);
  let coins = storage.pyungAlCoins || 0;
  let ownedItems = storage.ownedItems || [];
  
  toggleMascot.checked = storage.mascotEnabled !== false;
  updateCoinDisplay(coins);
  updateShopButtons(ownedItems, coins);

  // 2. 탭 전환 로직
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const target = (tab as HTMLElement).dataset.target;
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(target!)?.classList.add('active');
    });
  });

  // 3. 상점 구매 로직
  buyButtons.forEach(btn => {
    const button = btn as HTMLButtonElement;
    button.addEventListener('click', async () => {
      const itemId = button.dataset.item!;
      const price = parseInt(button.dataset.price!);

      if (ownedItems.includes(itemId)) return;

      if (coins >= price) {
        coins -= price;
        ownedItems.push(itemId);
        
        await chrome.storage.local.set({ 
          pyungAlCoins: coins, 
          ownedItems: ownedItems 
        });

        updateCoinDisplay(coins);
        updateShopButtons(ownedItems, coins);
        
        // 현재 탭에 아이템 적용 알림
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs[0]?.id) {
          chrome.tabs.sendMessage(activeTabs[0].id, { type: 'UPDATE_ITEMS', ownedItems });
        }
      }
    });
  });

  // 4. 마스코트 토글 이벤트
  toggleMascot.addEventListener('change', async () => {
    const enabled = toggleMascot.checked;
    await chrome.storage.local.set({ mascotEnabled: enabled });
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTabs[0]?.id) {
      chrome.tabs.sendMessage(activeTabs[0].id, { type: 'TOGGLE_MASCOT', enabled });
    }
  });

  // 5. 메일 확인 버튼
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

  function updateCoinDisplay(count: number) {
    coinCountEl.textContent = count.toLocaleString();
  }

  function updateShopButtons(owned: string[], currentCoins: number) {
    buyButtons.forEach(btn => {
      const button = btn as HTMLButtonElement;
      const itemId = button.dataset.item!;
      const price = parseInt(button.dataset.price!);

      if (owned.includes(itemId)) {
        button.textContent = '보유함';
        button.disabled = true;
        button.classList.add('owned');
      } else if (currentCoins < price) {
        button.disabled = true;
        button.textContent = '코인 부족';
      } else {
        button.disabled = false;
        button.textContent = '구매';
      }
    });
  }

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

  updateAuthStatus();

  // 6. 실시간 코인 동기화 (저장소 변경 감지)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.pyungAlCoins) {
      coins = changes.pyungAlCoins.newValue;
      updateCoinDisplay(coins);
      updateShopButtons(ownedItems, coins);
    }
    if (areaName === 'local' && changes.ownedItems) {
      ownedItems = changes.ownedItems.newValue;
      updateShopButtons(ownedItems, coins);
    }
  });
});
