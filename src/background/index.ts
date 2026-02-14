// src/background/index.ts

chrome.alarms.create('checkGmail', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkGmail') {
    checkGmailAPI();
  }
});

async function getAuthToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        resolve(undefined);
      } else {
        resolve(token);
      }
    });
  });
}

async function checkGmailAPI() {
  const token = await getAuthToken();
  if (!token) return;

  try {
    // 읽지 않은 메일 목록 가져오기
    const response = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();

    if (data.resultSizeEstimate > 0) {
      // 마스코트가 활성화되어 있는지 확인
      const storage = await chrome.storage.local.get(['mascotEnabled', 'lastNotifiedId']);
      if (storage.mascotEnabled === false) return;

      const lastMessageId = data.messages[0].id;
      
      // 이미 알림을 보낸 메일이면 패스
      if (storage.lastNotifiedId === lastMessageId) {
        console.log('Already notified about this message:', lastMessageId);
        return;
      }

      // 가장 최근 메일 한 건의 정보 가져오기
      const msgResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${lastMessageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const msgData = await msgResponse.json();
      const subject = msgData.payload.headers.find((h: any) => h.name === 'Subject')?.value || '제목 없음';

      // 알림 완료 후 ID 저장
      await chrome.storage.local.set({ lastNotifiedId: lastMessageId });

      // 컨텐츠 스크립트로 알림 전송
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'NEW_MAIL',
            subject: subject
          });
        } catch (err) {
          // 메시지를 받을 컨텐츠 스크립트가 아직 로드되지 않은 경우 무시
          console.log('Content script not ready or not reachable on this tab.');
        }
      }
    }
  } catch (error) {
    console.error('Gmail API Error:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('PyungAl (퓽알) Gmail Integrated Extension installed');
});

// 메시지 리스너 추가
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_MAIL_MANUAL') {
    checkGmailAPI().then(() => {
      sendResponse({ success: true });
    }).catch((err) => {
      console.error(err);
      sendResponse({ success: false });
    });
    return true; // 비동기 응답을 위해 true 반환
  }
});
