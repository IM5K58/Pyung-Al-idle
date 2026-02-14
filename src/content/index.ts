// src/content/index.ts

class Character {
  private container: HTMLDivElement;
  private el: HTMLImageElement;
  private bubbleEl: HTMLDivElement | null = null;
  private x: number = 100;
  private y: number = 100;
  private targetX: number = 100;
  private targetY: number = 100;
  private speed: number = 1.5;
  private isIdle: boolean = false;
  private isNotifying: boolean = false;
  private idlePhrases: string[] = [
    '배고파 삐약..',
    '오늘 날씨 좋다 삐약!',
    '졸려 삐약.. (Zzz)',
    '나랑 놀자 삐약!',
    '삐약삐약!',
    '주인님 메일 왔나? 삐약',
    '심심해 삐약..',
    '운동 중 삐약! 하나 둘!'
  ];

  constructor() {
    console.log('PyungAl: Initializing character...');
    // 컨테이너 생성 (캐릭터와 말풍선을 묶음)
    this.container = document.createElement('div');
    this.container.id = 'pyung-al-container';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '999999';
    this.container.style.pointerEvents = 'auto'; // 클릭 이벤트를 받기 위해 auto로 변경
    this.container.style.cursor = 'pointer';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.transition = 'transform 0.1s linear, opacity 0.3s';
    this.container.style.left = `${this.x}px`;
    this.container.style.top = `${this.y}px`;

    this.el = document.createElement('img');
    const imageUrl = chrome.runtime.getURL('pyung_Al_standing.webp');
    
    this.el.src = imageUrl;
    this.el.style.width = '80px';
    this.el.style.height = 'auto';
    this.el.style.display = 'block';
    this.el.style.transition = 'transform 0.2s ease-out, filter 0.3s';
    
    this.container.appendChild(this.el);
    
    // 클릭 이벤트 추가
    this.container.addEventListener('click', () => this.onClicked());

    if (document.body) {
      document.body.appendChild(this.container);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.container);
      });
    }

    this.injectStyles();
    this.checkInitialState();
    this.moveRandomly();
    this.animate();
  }

  private onClicked() {
    if (this.isNotifying) return;
    
    // 점프 애니메이션 효과
    this.el.style.transform += ' translateY(-20px)';
    setTimeout(() => {
      this.el.style.transform = this.el.style.transform.replace(' translateY(-20px)', '');
    }, 200);

    // 말풍선 인사
    this.showTempBubble('안녕! 반가워 삐약!');
  }

  private showTempBubble(text: string) {
    if (this.bubbleEl) this.bubbleEl.remove();

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'pyung-al-bubble';
    this.bubbleEl.textContent = text;
    
    this.container.insertBefore(this.bubbleEl, this.el);
    setTimeout(() => this.bubbleEl?.classList.add('visible'), 10);

    setTimeout(() => {
      this.bubbleEl?.classList.remove('visible');
      setTimeout(() => {
        this.bubbleEl?.remove();
        this.bubbleEl = null;
      }, 300);
    }, 2000);
  }

  private async checkInitialState() {
    const storage = await chrome.storage.local.get(['mascotEnabled']);
    if (storage.mascotEnabled === false) {
      this.container.style.display = 'none';
    }
  }

  public setVisible(visible: boolean) {
    this.container.style.display = visible ? 'flex' : 'none';
  }

  private injectStyles() {
    const styleId = 'pyung-al-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pyung-al-walk {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-8px) rotate(-8deg); }
        75% { transform: translateY(-8px) rotate(8deg); }
      }
      .pyung-al-walking {
        animation: pyung-al-walk 0.6s infinite ease-in-out;
      }
      .pyung-al-bubble {
        position: relative;
        background: #ffffff !important;
        border: 2px solid #333 !important;
        border-radius: 15px !important;
        padding: 8px 12px !important;
        margin-bottom: 10px !important;
        font-family: 'Malgun Gothic', sans-serif !important;
        font-size: 13px !important;
        font-weight: bold !important;
        color: #333 !important;
        white-space: nowrap !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s;
        pointer-events: none;
        z-index: 1000000;
      }
      .pyung-al-bubble.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .pyung-al-bubble::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 10px 10px 0;
        border-style: solid;
        border-color: #ffffff transparent transparent;
        z-index: 2;
      }
      .pyung-al-bubble::before {
        content: '';
        position: absolute;
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 11px 11px 0;
        border-style: solid;
        border-color: #333 transparent transparent;
        z-index: 1;
      }
    `;
    document.head.appendChild(style);
  }

  private moveRandomly() {
    if (this.isNotifying) {
      setTimeout(() => this.moveRandomly(), 1000);
      return;
    }

    // 30% 확률로 가만히 있기 (Idle)
    if (Math.random() < 0.3) {
      this.isIdle = true;
      this.el.classList.remove('pyung-al-walking');

      // 가만히 있을 때 50% 확률로 혼잣말 하기
      if (!this.isNotifying && Math.random() < 0.5) {
        const randomPhrase = this.idlePhrases[Math.floor(Math.random() * this.idlePhrases.length)];
        this.showTempBubble(randomPhrase);
      }

      setTimeout(() => this.moveRandomly(), 2000 + Math.random() * 3000);
      return;
    }

    this.isIdle = false;
    this.el.classList.add('pyung-al-walking');
    
    // 화면 하단 영역(바닥 쪽)에서만 이동 목표 설정
    const padding = 50;
    const bottomRegionHeight = window.innerHeight * 0.25; // 화면 하단 25% 영역
    
    this.targetX = padding + Math.random() * (window.innerWidth - 100 - padding * 2);
    this.targetY = (window.innerHeight - bottomRegionHeight - 100) + Math.random() * (bottomRegionHeight);
    
    // 화면 밖으로 나가지 않게 최종 조정
    this.targetY = Math.min(this.targetY, window.innerHeight - 150);
    this.targetY = Math.max(this.targetY, window.innerHeight - bottomRegionHeight - 100);
    
    setTimeout(() => this.moveRandomly(), 4000 + Math.random() * 4000);
  }

  private animate() {
    if (!this.isIdle && !this.isNotifying) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        
        this.container.style.left = `${this.x}px`;
        this.container.style.top = `${this.y}px`;
        
        // 이동 방향에 따라 좌우 반전
        const scaleX = dx > 0 ? -1 : 1;
        this.el.style.transform = `scaleX(${scaleX})`;
      } else {
        this.el.classList.remove('pyung-al-walking');
      }
    }

    requestAnimationFrame(() => this.animate());
  }

  public notify(subject: string) {
    this.isNotifying = true;
    this.el.classList.remove('pyung-al-walking');
    
    if (this.bubbleEl) {
      this.bubbleEl.remove();
    }

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'pyung-al-bubble';
    this.bubbleEl.innerHTML = `<div>📩 메일이 왔어요!</div><div style="font-size: 11px; font-weight: normal; color: #666; margin-top: 2px; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${subject}</div>`;
    
    this.container.insertBefore(this.bubbleEl, this.el);

    setTimeout(() => this.bubbleEl?.classList.add('visible'), 10);

    this.el.style.filter = 'drop-shadow(0 0 10px #ffd700)';

    setTimeout(() => {
      this.bubbleEl?.classList.remove('visible');
      setTimeout(() => {
        this.bubbleEl?.remove();
        this.bubbleEl = null;
        this.el.style.filter = 'none';
        this.isNotifying = false;
      }, 300);
    }, 7000);
  }
}

// 초기화 보장
const init = () => {
  if (window.hasOwnProperty('pyungAlInstance')) return;
  (window as any).pyungAlInstance = new Character();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 백그라운드로부터 메시지 수신
chrome.runtime.onMessage.addListener((request) => {
  const pyungAl = (window as any).pyungAlInstance;
  if (!pyungAl) return;

  if (request.type === 'NEW_MAIL') {
    pyungAl.notify(request.subject);
  } else if (request.type === 'TOGGLE_MASCOT') {
    pyungAl.setVisible(request.enabled);
  }
});
