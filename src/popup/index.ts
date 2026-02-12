// src/popup/index.ts
console.log('Popup script loaded');
const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<p>준비가 완료되었습니다!</p>';
}
