// src/content/index.ts

class Character {
  private el: HTMLImageElement;
  private x: number = 100;
  private y: number = 100;
  private targetX: number = 100;
  private targetY: number = 100;
  private speed: number = 2;

  constructor() {
    this.el = document.createElement('img');
    this.el.src = chrome.runtime.getURL('pyung_Al_standing.webp');
    this.el.style.position = 'fixed';
    this.el.style.width = '100px';
    this.el.style.zIndex = '999999';
    this.el.style.pointerEvents = 'none'; // 클릭 방해 안 함
    this.el.style.transition = 'transform 0.1s linear';
    document.body.appendChild(this.el);

    this.moveRandomly();
    this.animate();
  }

  private moveRandomly() {
    this.targetX = Math.random() * (window.innerWidth - 100);
    this.targetY = Math.random() * (window.innerHeight - 100);
    setTimeout(() => this.moveRandomly(), 3000 + Math.random() * 2000);
  }

  private animate() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this.el.style.left = `${this.x}px`;
      this.el.style.top = `${this.y}px`;
      
      // 이동 방향에 따라 좌우 반전
      this.el.style.transform = dx > 0 ? 'scaleX(-1)' : 'scaleX(1)';
    }

    requestAnimationFrame(() => this.animate());
  }

  public notify(message: string) {
    // 메일이 왔을 때의 반응 (점프하거나 크기 커짐)
    this.el.style.filter = 'drop-shadow(0 0 10px yellow)';
    const bubble = document.createElement('div');
    bubble.innerText = `📩 ${message}`;
    bubble.style.position = 'fixed';
    bubble.style.left = `${this.x}px`;
    bubble.style.top = `${this.y - 30}px`;
    bubble.style.background = 'white';
    bubble.style.border = '1px solid black';
    bubble.style.padding = '5px';
    bubble.style.borderRadius = '10px';
    bubble.style.zIndex = '1000000';
    document.body.appendChild(bubble);

    setTimeout(() => {
      bubble.remove();
      this.el.style.filter = 'none';
    }, 5000);
  }
}

const pyungAl = new Character();

// 백그라운드로부터 메시지 수신
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'NEW_MAIL') {
    pyungAl.notify(request.subject);
  }
});
