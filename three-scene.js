/*
 * Vosme International Sdn Bhd - 3D Neural Network Animation
 * Powered by Three.js | Support Mouse / Touch Drag with Inertia (Inspiration: oryzo.ai)
 * Fallback to 2D Canvas if WebGL is unavailable
 */

class NeuralNetwork3D {
  constructor() {
    this.container = document.getElementById('three-canvas-container');
    if (!this.container) return;

    this.particlesCount = 100;
    this.connectionDistance = 140;
    this.dots = [];
    this.lines = [];
    
    // Interaction states
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.drag = { isDragging: false, startX: 0, startY: 0 };
    this.rotation = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };
    this.inertia = { x: 0, y: 0 };
    this.friction = 0.95; // physics dampening for dragging momentum
    this.baseSpeed = { x: 0.0008, y: 0.0012 }; // slow constant rotation

    // HSL Hex colors mapped
    this.colors = [
      0x00f0ff, // neon cyan
      0xff7a00, // neon orange
      0xffffff, // pure white
      0x0077ff  // cobalt blue
    ];

    this.init();
  }

  init() {
    // Attempt Three.js WebGL initialization
    try {
      this.initThree();
    } catch (e) {
      console.warn("WebGL initialization failed, falling back to dynamic 2D canvas.", e);
      this.init2DCanvas();
    }
  }

  // --- THREE.JS WEBGL RENDERER ---
  initThree() {
    // 1. Setup Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    this.camera.position.z = 400;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 2. Create the Particle System
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particlesCount * 3);
    const customColors = new Float32Array(this.particlesCount * 3);

    this.particlesData = [];

    for (let i = 0; i < this.particlesCount; i++) {
      // Float within a sphere/box
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Assign random color from company palette
      const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
      const colorObj = new THREE.Color(colorHex);
      customColors[i * 3] = colorObj.r;
      customColors[i * 3 + 1] = colorObj.g;
      customColors[i * 3 + 2] = colorObj.b;

      this.particlesData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ),
        numConnections: 0
      });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(customColors, 3));

    // Custom material for glowing round points
    const pMaterial = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particleSystem = new THREE.Points(particleGeometry, pMaterial);
    this.scene.add(this.particleSystem);

    // 3. Create Connecting Lines Buffer
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = this.particlesCount * 8;
    this.linePositions = new Float32Array(maxLines * 2 * 3);
    this.lineColors = new Float32Array(maxLines * 2 * 3);

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.15
    });

    this.lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lineSystem);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(1, 1, 1).normalize();
    this.scene.add(dirLight);

    // 5. Events & Run
    this.addEventListeners();
    this.animateThree();
  }

  animateThree() {
    requestAnimationFrame(() => this.animateThree());

    const positions = this.particleSystem.geometry.attributes.position.array;
    let vertexIdx = 0;
    let colorIdx = 0;
    let numConnected = 0;

    // A. Move particles
    for (let i = 0; i < this.particlesCount; i++) {
      positions[i * 3] += this.particlesData[i].velocity.x;
      positions[i * 3 + 1] += this.particlesData[i].velocity.y;
      positions[i * 3 + 2] += this.particlesData[i].velocity.z;

      // Bounce boundaries
      if (positions[i * 3] < -250 || positions[i * 3] > 250) this.particlesData[i].velocity.x *= -1;
      if (positions[i * 3 + 1] < -250 || positions[i * 3 + 1] > 250) this.particlesData[i].velocity.y *= -1;
      if (positions[i * 3 + 2] < -250 || positions[i * 3 + 2] > 250) this.particlesData[i].velocity.z *= -1;
    }

    // B. Build Connecting Lines Matrix
    for (let i = 0; i < this.particlesCount; i++) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];

      for (let j = i + 1; j < this.particlesCount; j++) {
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];

        // Distance formula
        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < this.connectionDistance) {
          // Add line segment endpoints
          this.linePositions[vertexIdx++] = x1;
          this.linePositions[vertexIdx++] = y1;
          this.linePositions[vertexIdx++] = z1;

          this.linePositions[vertexIdx++] = x2;
          this.linePositions[vertexIdx++] = y2;
          this.linePositions[vertexIdx++] = z2;

          // Fade lines based on proximity
          const alpha = 1.0 - dist / this.connectionDistance;
          
          // Interpolate neon colors based on coordinates
          const colorObj = new THREE.Color(i % 2 === 0 ? this.colors[0] : this.colors[1]);
          
          this.lineColors[colorIdx++] = colorObj.r * alpha * 0.4;
          this.lineColors[colorIdx++] = colorObj.g * alpha * 0.4;
          this.lineColors[colorIdx++] = colorObj.b * alpha * 0.4;

          this.lineColors[colorIdx++] = colorObj.r * alpha * 0.4;
          this.lineColors[colorIdx++] = colorObj.g * alpha * 0.4;
          this.lineColors[colorIdx++] = colorObj.b * alpha * 0.4;

          numConnected++;
        }
      }
    }

    this.lineSystem.geometry.attributes.position.needsUpdate = true;
    this.lineSystem.geometry.attributes.color.needsUpdate = true;
    this.lineSystem.geometry.setDrawRange(0, numConnected * 2);

    this.particleSystem.geometry.attributes.position.needsUpdate = true;

    // C. Rotation Physics with Inertia & Friction
    if (!this.drag.isDragging) {
      // Slide back to slow auto rotation
      this.inertia.x *= this.friction;
      this.inertia.y *= this.friction;
      
      this.targetRotation.x += this.inertia.x + this.baseSpeed.x;
      this.targetRotation.y += this.inertia.y + this.baseSpeed.y;
    }

    // Smooth easing interpolation
    this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.1;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.1;

    // Apply rotation matrices to both particles and lines
    this.particleSystem.rotation.x = this.rotation.x;
    this.particleSystem.rotation.y = this.rotation.y;
    this.lineSystem.rotation.x = this.rotation.x;
    this.lineSystem.rotation.y = this.rotation.y;

    // D. Mouse Magnetic Pull Tilt Effect
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
    
    // Subtle view skewing based on cursor offset
    this.camera.position.x = this.mouse.x * 70;
    this.camera.position.y = -this.mouse.y * 70;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }


  // --- 2D CANVAS FALLBACK SYSTEM ---
  init2DCanvas() {
    this.container.innerHTML = ''; // clear Three.js residual elements
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.resizeCanvas();
    
    // Populate points
    this.points2D = [];
    for (let i = 0; i < this.particlesCount; i++) {
      this.points2D.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1.5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      });
    }

    // Drag inertia variables for 2D representation
    this.angle = 0;
    this.angularVelocity = 0.005;

    this.addEventListeners();
    this.animate2D();
  }

  animate2D() {
    requestAnimationFrame(() => this.animate2D());
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply dragging deceleration
    if (!this.drag.isDragging) {
      this.angularVelocity *= this.friction;
      if (Math.abs(this.angularVelocity) < 0.001) this.angularVelocity = 0.001; // floor
    }
    this.angle += this.angularVelocity;

    const widthHalf = this.canvas.width / 2;
    const heightHalf = this.canvas.height / 2;

    // Mouse skew
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Draw and connect particles
    const drawnPoints = this.points2D.map(p => {
      // Warp positioning with slow rotation matrix mapping
      const dx = p.x - widthHalf;
      const dy = p.y - heightHalf;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angleOffset = Math.atan2(dy, dx) + this.angle;
      
      const rx = widthHalf + Math.cos(angleOffset) * dist + (this.mouse.x * 30);
      const ry = heightHalf + Math.sin(angleOffset) * dist + (this.mouse.y * 30);

      return { x: rx, y: ry, radius: p.radius, color: p.color };
    });

    // Draw line connections
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i < drawnPoints.length; i++) {
      const p1 = drawnPoints[i];
      for (let j = i + 1; j < drawnPoints.length; j++) {
        const p2 = drawnPoints[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const d = Math.sqrt(dx*dx + dy*dy);

        if (d < this.connectionDistance) {
          const alpha = (1.0 - d / this.connectionDistance) * 0.15;
          const colorHex = '#' + p1.color.toString(16).padStart(6, '0');
          this.ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw dots
    drawnPoints.forEach(p => {
      const colorHex = '#' + p.color.toString(16).padStart(6, '0');
      this.ctx.fillStyle = colorHex;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = colorHex;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.shadowBlur = 0; // reset
  }


  // --- INTERACTION / LISTENERS MAPPING ---
  addEventListeners() {
    // Mouse hover tracking
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Dragging mouse events
    this.container.addEventListener('mousedown', (e) => this.handleDragStart(e));
    window.addEventListener('mousemove', (e) => this.handleDragMove(e));
    window.addEventListener('mouseup', () => this.handleDragEnd());

    // Dragging mobile touch events
    this.container.addEventListener('touchstart', (e) => this.handleDragStart(e.touches[0]));
    window.addEventListener('touchmove', (e) => this.handleDragMove(e.touches[0]));
    window.addEventListener('touchend', () => this.handleDragEnd());

    // Dynamic scale resizing
    window.addEventListener('resize', () => this.handleResize());
  }

  handleMouseMove(e) {
    // Convert coordinates to range [-1, 1] relative to viewport center
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  handleDragStart(e) {
    this.drag.isDragging = true;
    this.drag.startX = e.clientX;
    this.drag.startY = e.clientY;
    this.container.style.cursor = 'grabbing';
  }

  handleDragMove(e) {
    if (!this.drag.isDragging) return;
    
    const deltaX = e.clientX - this.drag.startX;
    const deltaY = e.clientY - this.drag.startY;
    
    this.drag.startX = e.clientX;
    this.drag.startY = e.clientY;

    const dragFactor = 0.005;

    if (this.renderer) {
      // Three.js rotation update
      this.targetRotation.y += deltaX * dragFactor;
      this.targetRotation.x += deltaY * dragFactor;
      
      // Calculate physics inertia delta
      this.inertia.y = deltaX * dragFactor;
      this.inertia.x = deltaY * dragFactor;
    } else if (this.canvas) {
      // 2D Canvas velocity update
      this.angularVelocity = deltaX * 0.0005;
    }
  }

  handleDragEnd() {
    this.drag.isDragging = false;
    this.container.style.cursor = 'grab';
  }

  handleResize() {
    if (this.renderer) {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
    } else if (this.canvas) {
      this.resizeCanvas();
    }
  }

  resizeCanvas() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }
}

// Instantiate on document completion
document.addEventListener('DOMContentLoaded', () => {
  new NeuralNetwork3D();
});
