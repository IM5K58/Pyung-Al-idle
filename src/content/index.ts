// src/content/index.ts
console.log('%c[PyungAl] Content script starting...', 'color: #ff9900; font-weight: bold;');

class Character {
  private container: HTMLDivElement;
  private spriteWrapper: HTMLDivElement;
  private el: HTMLImageElement;
  private bubbleEl: HTMLDivElement | null = null;
  private zzzEl: HTMLDivElement | null = null;
  private x: number = 100;
  private y: number = 100;
  private targetX: number = 100;
  private targetY: number = 100;
  private speed: number = 1.5;
  private equippedItems: string[] = [];
  private isIdle: boolean = false;
  private isNotifying: boolean = false;
  private animationId: number | null = null;
  private idlePhrases: string[] = [
    '아이고.. 뜨끈한 국밥 한 그릇 생각나네..',
    '허허, 날씨 보소.. 산에 가기 딱 좋구먼.',
    '아이고 허리야.. 잠깐 눈 좀 붙여야겠네.',
    '심심한데 나랑 말동무나 좀 해주게나.',
    '허허허, 인생 뭐 있나~ 다 그런 거지.',
    '자네, 메일 왔는지 확인은 해봤나?',
    '에휴.. 퇴근까지 몇 시간 남았나?',
    '영차! 영차! 아이고 삭신이야..',
    '나 때는 말이야.. 어? 이런 건 일도 아니었어.'
  ];

  constructor() {
    console.log('PyungAl (퓽알): Initializing character...');
    // 컨테이너 생성 (전체 요소를 묶음)
    this.container = document.createElement('div');
    this.container.id = 'pyung-al-container';
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '999999';
    this.container.style.pointerEvents = 'auto';
    this.container.style.cursor = 'pointer';
    this.container.style.display = 'none';
    this.container.style.left = '0';
    this.container.style.top = '0';
    this.container.style.transform = `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`;
    this.container.style.transition = 'opacity 0.3s';
    this.container.style.backfaceVisibility = 'hidden'; // 렌더링 떨림 방지
    this.container.style.webkitBackfaceVisibility = 'hidden';

    // 스프라이트 래퍼 (좌우 반전 담당)
    this.spriteWrapper = document.createElement('div');
    this.spriteWrapper.style.position = 'relative';
    this.spriteWrapper.style.display = 'flex';
    this.spriteWrapper.style.flexDirection = 'column';
    this.spriteWrapper.style.alignItems = 'center';
    // spriteWrapper의 transition도 제거하여 animate()와 충돌 방지
    this.spriteWrapper.style.transition = 'none'; 

    this.el = document.createElement('img');
    const imageUrl = chrome.runtime.getURL('pyung_Al_standing.webp');
    
    this.el.src = imageUrl;
    this.el.onerror = () => {
      console.error('PyungAl (퓽알): Failed to load mascot image. Path:', imageUrl);
    };
    this.el.style.width = '80px';
    this.el.style.height = 'auto';
    this.el.style.display = 'block';
    this.el.style.transition = 'filter 0.3s';
    
    this.spriteWrapper.appendChild(this.el);
    this.container.appendChild(this.spriteWrapper);
    
    // 방향 처리를 위한 초기값
    this.el.dataset.direction = '1';

    // 클릭 이벤트 추가
    this.container.addEventListener('click', () => this.onClicked());

    // 안전하게 DOM에 추가
    this.addToDOM();

    this.injectStyles();
    this.checkInitialState();
    this.moveRandomly();
    this.animate();
  }

  private addToDOM() {
    const tryAppend = () => {
      if (document.body) {
        document.body.appendChild(this.container);
        console.log('PyungAl (퓽알): Character added to DOM.');
      } else {
        setTimeout(tryAppend, 100);
      }
    };
    tryAppend();
  }

  private onClicked() {
    if (this.isNotifying) return;
    
    // 자고 있었다면 깨우기
    if (this.isIdle) {
      this.stopZzz();
      this.el.classList.remove('pyung-al-resting');
      this.showTempBubble('앗! 깜빡 졸았구먼! 무슨 일인가?');
      return;
    }
    
    // 점프 애니메이션 효과
    this.el.classList.add('pyung-al-jumping');
    setTimeout(() => {
      this.el.classList.remove('pyung-al-jumping');
    }, 400);

    // 말풍선 인사
    this.showTempBubble('허허, 반갑구먼! 무슨 일인가?');
  }

  private async collectCoin() {
    const storage = await chrome.storage.local.get(['pyungAlCoins']);
    const currentCoins = storage.pyungAlCoins || 0;
    const newCoins = currentCoins + 1;
    await chrome.storage.local.set({ pyungAlCoins: newCoins });
    
    this.showCoinEffect();
  }

  private showCoinEffect() {
    const coinEffect = document.createElement('div');
    coinEffect.textContent = '💰 +1';
    coinEffect.style.position = 'absolute';
    coinEffect.style.top = '-30px';
    coinEffect.style.left = '50%';
    coinEffect.style.transform = 'translateX(-50%)';
    coinEffect.style.color = '#ffd700';
    coinEffect.style.fontWeight = 'bold';
    coinEffect.style.fontSize = '18px';
    coinEffect.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
    coinEffect.style.pointerEvents = 'none';
    coinEffect.style.transition = 'all 1s ease-out';
    coinEffect.style.zIndex = '1000001';
    
    this.container.appendChild(coinEffect);
    
    setTimeout(() => {
      coinEffect.style.top = '-60px';
      coinEffect.style.opacity = '0';
      setTimeout(() => coinEffect.remove(), 1000);
    }, 50);
  }

  private showZzz() {
    if (this.zzzEl) return;
    this.zzzEl = document.createElement('div');
    this.zzzEl.className = 'pyung-al-zzz';
    this.zzzEl.textContent = 'Zzz';
    this.spriteWrapper.appendChild(this.zzzEl);
  }

  private stopZzz() {
    if (this.zzzEl) {
      this.zzzEl.remove();
      this.zzzEl = null;
    }
  }

  private showTempBubble(text: string) {
    if (this.bubbleEl) this.bubbleEl.remove();

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'pyung-al-bubble';
    this.bubbleEl.textContent = text;
    
    this.container.appendChild(this.bubbleEl);
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
    const storage = await chrome.storage.local.get(['mascotEnabled', 'equippedItems']);
    if (storage.mascotEnabled !== false) {
      this.container.style.display = 'flex';
    } else {
      this.container.style.display = 'none';
    }
    this.equippedItems = storage.equippedItems || [];
    this.applyItems();
  }

  private applyItems() {
    // 1. 축지법 장화 (속도 증가)
    if (this.equippedItems.includes('item-speed')) {
      this.speed = 3.0;
    } else {
      this.speed = 1.5;
    }

    // 2. 황금 아우라
    if (this.equippedItems.includes('item-aura')) {
      this.el.style.filter = 'drop-shadow(0 0 8px #ffd700)';
    } else {
      this.el.style.filter = 'none';
    }

    // 3. 빨간 리본 (CSS pseudo-element로 추가)
    if (this.equippedItems.includes('item-ribbon')) {
      this.container.classList.add('has-ribbon');
    } else {
      this.container.classList.remove('has-ribbon');
    }

    // 4. 네잎클로버 (행운의 기운)
    if (this.equippedItems.includes('item-lucky')) {
      this.container.classList.add('has-lucky');
    } else {
      this.container.classList.remove('has-lucky');
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
      @keyframes pyung-al-zzz {
        0% { transform: translate(20px, 0) scale(0.5); opacity: 0; }
        50% { transform: translate(30px, -20px) scale(1); opacity: 1; }
        100% { transform: translate(40px, -40px) scale(0.8); opacity: 0; }
      }
      .pyung-al-zzz {
        position: absolute;
        top: 0;
        right: 0;
        font-weight: bold;
        color: #555;
        font-size: 14px;
        animation: pyung-al-zzz 2s infinite;
        pointer-events: none;
      }
      .pyung-al-resting {
        transform: rotate(70deg) translateY(10px) !important;
      }
      @keyframes pyung-al-jump {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      .pyung-al-jumping {
        animation: pyung-al-jump 0.4s ease-out;
      }
      .pyung-al-bubble {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
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
        transition: opacity 0.3s, transform 0.3s;
        pointer-events: none;
        z-index: 1000000;
      }
      .pyung-al-bubble.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
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
      .has-ribbon::before {
        content: '🎀';
        position: absolute;
        top: 0;
        right: 0;
        font-size: 24px;
        z-index: 1000002;
        transform: translate(10px, -10px);
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
      
      // 낮잠 자기 (휴식 상태 시각화)
      this.el.classList.add('pyung-al-resting');
      this.showZzz();

      // 가만히 있을 때 50% 확률로 혼잣말 하기 (잠꼬대 포함)
      if (!this.isNotifying && Math.random() < 0.5) {
        const phrases = [...this.idlePhrases, '음냐.. 국밥.. 한 그릇..', '드르렁.. 퓽..', '아이고.. 삭신이야..'];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        this.showTempBubble(randomPhrase);
      }

      setTimeout(() => {
        this.stopZzz();
        this.el.classList.remove('pyung-al-resting');
        this.moveRandomly();
      }, 3000 + Math.random() * 4000);
      return;
    }

    this.isIdle = false;
    this.el.classList.add('pyung-al-walking');

    // 이동을 시작할 때 가끔 코인 줍기
    const coinChance = this.equippedItems.includes('item-lucky') ? 0.10 : 0.05;
    if (Math.random() < coinChance) {
      setTimeout(() => this.collectCoin(), 1000);
    }
    
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
    // 1. 컨텍스트 유효성 체크 (익스텐션 재로드 시 루프 중단)
    if (!chrome.runtime?.id) {
      this.destroy();
      return;
    }

    // 2. 이전 프레임 루프가 있다면 취소
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (!this.isIdle && !this.isNotifying) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 2px 이내면 도착한 것으로 간주 (진동 방지)
      if (dist > 2) {
        // 이동할 거리(speed)가 남은 거리(dist)보다 크면 오버슈트 방지를 위해 목표 지점으로 스냅
        const moveDist = Math.min(this.speed, dist);
        this.x += (dx / dist) * moveDist;
        this.y += (dy / dist) * moveDist;
        
        // !important를 사용하여 외부 CSS 간섭 차단
        this.container.style.setProperty('transform', `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`, 'important');
        
        // 이동 방향에 따라 좌우 반전
        const scaleX = dx > 0 ? -1 : 1;
        this.spriteWrapper.style.setProperty('transform', `scaleX(${scaleX})`, 'important');
      } else {
        // 목표 도착 시 정확히 좌표 일치시킴
        this.x = this.targetX;
        this.y = this.targetY;
        this.container.style.setProperty('transform', `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`, 'important');
        this.el.classList.remove('pyung-al-walking');
      }
    } else {
      // Idle 상태 좌표 고정
      this.container.style.setProperty('transform', `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`, 'important');
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.container.remove();
    console.log('%c[PyungAl] Instance destroyed due to context invalidation.', 'color: #ccc;');
  }

  public notify(subject: string) {
    this.isNotifying = true;
    this.el.classList.remove('pyung-al-walking');
    
    if (this.bubbleEl) {
      this.bubbleEl.remove();
    }

    this.bubbleEl = document.createElement('div');
    this.bubbleEl.className = 'pyung-al-bubble';
    this.bubbleEl.innerHTML = `<div>📩 어이, 메일 왔네!</div><div style="font-size: 11px; font-weight: normal; color: #666; margin-top: 2px; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${subject}</div>`;
    
    this.container.appendChild(this.bubbleEl);

    setTimeout(() => this.bubbleEl?.classList.add('visible'), 10);

    this.el.style.filter = 'drop-shadow(0 0 10px #ffd700)';

    setTimeout(() => {
      this.bubbleEl?.classList.remove('visible');
      setTimeout(() => {
        this.bubbleEl?.remove();
        this.bubbleEl = null;
        this.el.style.filter = 'none';
        this.isNotifying = false;
        this.applyItems(); // 아이템 효과 다시 적용 (아우라 등)
      }, 300);
    }, 7000);
  }
}

// 초기화 보장 (중복 실행 방지 및 최신화)
const init = () => {
  const existing = document.getElementById('pyung-al-container');
  if (existing) {
    existing.remove(); // 이전 버전 제거하고 새 버전으로 교체
  }
  
  (window as any).pyungAlInstance = new Character();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 백그라운드로부터 메시지 수신 (예외 처리 강화)
chrome.runtime.onMessage.addListener((request) => {
  try {
    const pyungAl = (window as any).pyungAlInstance;
    if (!pyungAl || !chrome.runtime?.id) return;

      if (request.type === 'NEW_MAIL') {

        pyungAl.notify(request.subject);

      } else if (request.type === 'TOGGLE_MASCOT') {

        pyungAl.setVisible(request.enabled);

      } else if (request.type === 'UPDATE_ITEMS') {

        (pyungAl as any).equippedItems = request.equippedItems;

        (pyungAl as any).applyItems();

      }

    
  } catch (err) {
    // 컨텍스트 무효화 시 무시
  }
});
