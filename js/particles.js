/* ==========================================================================
   CANVAS PARTICLES, FIREWORKS, & CONFETTI ENGINE
   ========================================================================== */

class CanvasEffects {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.fireworks = [];
    this.confetti = [];
    this.active = true;
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Create initial background gold dust
    for (let i = 0; i < 40; i++) {
      this.particles.push(this.createGoldDust(true));
    }
    
    // Start animation loop
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  // Create floating gold dust
  createGoldDust(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 20,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -(Math.random() * 0.5 + 0.2),
      opacity: Math.random() * 0.5 + 0.2,
      opacitySpeed: Math.random() * 0.005 + 0.002,
      color: this.getRandomGoldColor(),
      pulse: Math.random() * Math.PI
    };
  }

  getRandomGoldColor() {
    const goldColors = [
      'rgba(212, 175, 55, ',
      'rgba(251, 245, 183, ',
      'rgba(179, 135, 40, ',
      'rgba(247, 231, 206, '
    ];
    return goldColors[Math.floor(Math.random() * goldColors.length)];
  }

  // Generate a firework explosion
  createFirework(x, y) {
    const count = 60 + Math.floor(Math.random() * 40);
    const colorStyle = this.getRandomGoldColor();
    const sparks = [];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.04,
        friction: 0.96,
        opacity: 1,
        fade: Math.random() * 0.015 + 0.008,
        size: Math.random() * 2.5 + 1,
        color: colorStyle
      });
    }
    this.fireworks.push(sparks);
  }

  // Trigger firework launches automatically
  launchFirework() {
    const x = Math.random() * (this.width - 200) + 100;
    const y = Math.random() * (this.height * 0.5) + 100;
    this.createFirework(x, y);
  }

  // Generate a confetti burst
  triggerConfettiBurst() {
    const colors = ['#D4AF37', '#FCF6BA', '#AA771C', '#FAF9F6', '#E2D1A6'];
    for (let i = 0; i < 150; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        opacity: 1
      });
    }
  }

  // Animation Loop
  animate() {
    if (!this.active) return;
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw background overlay dark fade
    this.ctx.fillStyle = 'rgba(11, 11, 11, 0.08)';
    
    // 1. UPDATE & DRAW GOLD PARTICLES
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Gentle pulsing of opacity
      p.pulse += 0.01;
      const currentOpacity = p.opacity + Math.sin(p.pulse) * 0.15;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + Math.max(0.05, Math.min(1, currentOpacity)) + ')';
      this.ctx.fill();
      
      // Reset particle if it leaves the screen or fades completely
      if (p.y < -10 || p.x < -10 || p.x > this.width + 10) {
        this.particles[i] = this.createGoldDust(false);
      }
    }
    
    // 2. UPDATE & DRAW FIREWORKS
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const sparks = this.fireworks[i];
      let activeSparks = false;
      
      for (let j = 0; j < sparks.length; j++) {
        const s = sparks[j];
        if (s.opacity <= 0) continue;
        
        s.vx *= s.friction;
        s.vy *= s.friction;
        s.vy += s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.opacity -= s.fade;
        
        if (s.opacity > 0) {
          activeSparks = true;
          this.ctx.beginPath();
          this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          this.ctx.fillStyle = s.color + Math.max(0, s.opacity) + ')';
          
          // Outer glow for sparks
          this.ctx.shadowBlur = 6;
          this.ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
          
          this.ctx.fill();
          
          // Clear shadow blur configuration to prevent slow down
          this.ctx.shadowBlur = 0;
        }
      }
      
      if (!activeSparks) {
        this.fireworks.splice(i, 1);
      }
    }
    
    // 3. UPDATE & DRAW CONFETTI
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotationSpeed;
      
      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate((c.rotation * Math.PI) / 180);
      this.ctx.fillStyle = c.color;
      
      // Draw rectangular confetti piece
      this.ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size / 2);
      this.ctx.restore();
      
      // Remove confetti if it falls off bottom
      if (c.y > this.height + 20) {
        this.confetti.splice(i, 1);
      }
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// Instantiate globally so it can be called from app.js
window.weddingEffects = null;
document.addEventListener('DOMContentLoaded', () => {
  window.weddingEffects = new CanvasEffects('particle-canvas');
});
