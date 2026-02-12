// src/utils/dom.ts

/**
 * 사용자 입력값을 안전하게 텍스트로만 삽입합니다. (XSS 방지)
 */
export const safeSetText = (id: string, text: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
};

/**
 * 에러 핸들링을 포함한 크롬 스토리지 저장 함수
 */
export const saveToStorage = async (key: string, value: any): Promise<void> => {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('Storage save error:', error);
  }
};
