// Card toggle functionality
let currentActiveCard = null;
let isAnimating = false;

async function toggleCard(card) {
    if (isAnimating) return;
    isAnimating = true;
    
    if (currentActiveCard === card) {
        card.classList.remove('lifted');
        await new Promise(resolve => setTimeout(resolve, 300));
        card.classList.remove('active');
        currentActiveCard = null;
        resetCardContent(card);
    } else {
        if (currentActiveCard) {
            currentActiveCard.classList.remove('lifted');
            await new Promise(resolve => setTimeout(resolve, 300));
            currentActiveCard.classList.remove('active');
            resetCardContent(currentActiveCard);
        }
        
        card.classList.add('lifted');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        card.classList.add('active');
        currentActiveCard = card;
        animateCardContent(card);
    }
    isAnimating = false;
}

function animateCardContent(card) {
    const aspectItems = card.querySelectorAll('.aspect-item');
    const aspectContents = card.querySelectorAll('.aspect-content');
    
    aspectItems.forEach(item => {
        item.classList.remove('visible');
    });
    aspectContents.forEach(content => {
        content.classList.remove('visible');
    });
    
    aspectItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
            setTimeout(() => {
                const content = item.querySelector('.aspect-content');
                content.classList.add('visible');
            }, 300);
        }, index * 600);
    });
}

function resetCardContent(card) {
    const aspectItems = card.querySelectorAll('.aspect-item');
    const aspectContents = card.querySelectorAll('.aspect-content');
    
    aspectItems.forEach(item => {
        item.classList.remove('visible');
    });
    aspectContents.forEach(content => {
        content.classList.remove('visible');
    });
}

// Click outside card to close
document.body.addEventListener('click', function(e) {
    if (currentActiveCard && !currentActiveCard.contains(e.target) && !isAnimating) {
        isAnimating = true;
        currentActiveCard.classList.remove('lifted');
        setTimeout(() => {
            currentActiveCard.classList.remove('active');
            resetCardContent(currentActiveCard);
            currentActiveCard = null;
            isAnimating = false;
        }, 300);
    }
});

// Glow effect for cards
function createNonIntrusiveGlowEffect() {
    const glowConfig = {
        'clown-card':  { color: '#00a8ff', width: 6, blur: 35, speed: 0.40 },
        'joker-card':  { color: '#ff3333', width: 6, blur: 35, speed: 0.40 },
        'jester-card': { color: '#00cc66', width: 6, blur: 35, speed: 0.40 }
    };

    const glowContainer = document.createElement('div');
    glowContainer.id = 'glow-container';
    Object.assign(glowContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '10'
    });
    document.body.appendChild(glowContainer);

    document.querySelectorAll('.flip-card').forEach(card => {
        const canvas = document.createElement('canvas');
        canvas.className = `glow-canvas ${card.id}-glow`;
        Object.assign(canvas.style, {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: '1',
            borderRadius: '12px'
        });
        glowContainer.appendChild(canvas);
        canvas.dataset.cardId = card.id;
    });

    const canvasContexts = new Map();
    let lastTime = performance.now();

    document.querySelectorAll('.glow-canvas').forEach(canvas => {
        canvasContexts.set(canvas, {
            ctx: canvas.getContext('2d'),
            progress: 0
        });
    });

    function updateGlowPositions() {
        document.querySelectorAll('.flip-card').forEach(card => {
            const canvas = document.querySelector(`.${card.id}-glow`);
            if (!canvas) return;

            const config = glowConfig[card.id];
            const padding = config.blur + config.width;

            const rect = card.getBoundingClientRect();
            Object.assign(canvas.style, {
                top: `${rect.top - padding}px`,
                left: `${rect.left - padding}px`,
                width: `${rect.width + padding * 2}px`,
                height: `${rect.height + padding * 2}px`
            });
        });
    }

    function pointAtLength(len, w, h) {
        const perimeter = 2 * (w + h);
        len = (len + perimeter) % perimeter;
        if (len < w) return { x: len, y: 0 };
        else if (len < w + h) return { x: w, y: len - w };
        else if (len < 2 * w + h) return { x: 2 * w + h - len, y: h };
        else return { x: 0, y: perimeter - len };
    }

    function buildUniformGlowPath(w, h, startT, endT, segments = 500) {
        const path = new Path2D();
        const perimeter = 2 * (w + h);
        const start = startT * perimeter;
        const end = endT * perimeter;
        const totalLen = (end >= start) ? end - start : (perimeter - start + end);
        const step = totalLen / segments;

        let prev = pointAtLength(start, w, h);
        path.moveTo(prev.x, prev.y);

        for (let i = 1; i <= segments; i++) {
            const len = (start + step * i) % perimeter;
            const pt = pointAtLength(len, w, h);
            path.lineTo(pt.x, pt.y);
        }

        return path;
    }

    function drawEnhancedGlow(ctx, color, progress, length, width, blur, w, h) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const perimeter = 2 * (w + h);
        const center = progress * perimeter;
        const halfLen = (length * perimeter) / 2;
        const start = (center - halfLen + perimeter) % perimeter;
        const end = (center + halfLen) % perimeter;

        ctx.save();
        const offset = blur + width;
        ctx.translate(offset + 0.5, offset + 0.5);

        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const path = buildUniformGlowPath(w, h, start / perimeter, end / perimeter, 500);
        ctx.stroke(path);
        ctx.restore();
    }

    function animate(currentTime) {
        const deltaTime = Math.min(currentTime - lastTime, 33);
        lastTime = currentTime;

        updateGlowPositions();

        document.querySelectorAll('.glow-canvas').forEach(canvas => {
            const cardId = canvas.dataset.cardId;
            const config = glowConfig[cardId];
            const canvasData = canvasContexts.get(canvas);
            const card = document.getElementById(cardId);

            if (!card || card.classList.contains('active')) {
                canvasData.ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            const dpr = window.devicePixelRatio || 1;
            const styleWidth = parseInt(canvas.style.width);
            const styleHeight = parseInt(canvas.style.height);

            if (canvas.width !== styleWidth * dpr || canvas.height !== styleHeight * dpr) {
                canvas.width = styleWidth * dpr;
                canvas.height = styleHeight * dpr;
                canvasData.ctx.setTransform(1, 0, 0, 1, 0, 0);
                canvasData.ctx.scale(dpr, dpr);
            } else {
                canvasData.ctx.setTransform(1, 0, 0, 1, 0, 0);
                canvasData.ctx.scale(dpr, dpr);
            }

            canvasData.progress = (canvasData.progress + config.speed * (deltaTime / 1000)) % 1;

            const contentWidth = styleWidth - (config.blur + config.width) * 2;
            const contentHeight = styleHeight - (config.blur + config.width) * 2;

            drawEnhancedGlow(
                canvasData.ctx,
                config.color,
                canvasData.progress,
                0.3,
                config.width,
                config.blur,
                contentWidth,
                contentHeight
            );
        });

        requestAnimationFrame(animate);
    }

    updateGlowPositions();
    requestAnimationFrame(animate);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateGlowPositions, 100);
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.flip-card')) {
            updateGlowPositions();
        }
    });
}

// Background glow effect
function createDynamicBackgroundGlow() {
    const colors = {
        default: '#666666',
        'clown-card': '#00a8ff',
        'joker-card': '#ff3333',
        'jester-card': '#00cc66'
    };

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const glowWidth = isMobile ? 4 : 6;
    const glowBlur = isMobile ? 25 : 40;
    const glowSpeed = 0.2;
    const glowLength = isMobile ? 0.2 : 0.25;
    const frameRate = 60;
    const frameInterval = 1000 / frameRate;

    let progress = 0;
    let lastTime = 0;
    let timeAccumulator = 0;

    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d', { alpha: true });
    Object.assign(bgCanvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '0',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
    });
    document.body.appendChild(bgCanvas);

    let resizeTimeout;
    function resizeCanvas() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const dpr = window.devicePixelRatio || 1;
            const w = window.innerWidth;
            const h = window.innerHeight;
            bgCanvas.style.width = `${w}px`;
            bgCanvas.style.height = `${h}px`;
            bgCanvas.width = w * dpr;
            bgCanvas.height = h * dpr;
            bgCtx.setTransform(1, 0, 0, 1, 0, 0);
            bgCtx.scale(dpr, dpr);
            bgCtx.clearRect(0, 0, w, h);
        }, 100);
    }

    function getActiveCardColor() {
        const activeCard = document.querySelector('.flip-card.active');
        if (!activeCard) return colors.default;
        return colors[activeCard.id] || colors.default;
    }

    function drawGlowSegment(progressPoint, color) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const perimeter = 2 * (w + h);
        const center = progressPoint * perimeter;
        const halfLen = (glowLength * perimeter) / 2;
        const start = (center - halfLen + perimeter) % perimeter;
        const end = (center + halfLen) % perimeter;

        const step = isMobile ? 2 : 1.2;
        const points = [];

        const addPoint = (pos) => {
            if (pos < w) {
                points.push({ x: pos, y: 0 });
            } else if (pos < w + h) {
                points.push({ x: w, y: pos - w });
            } else if (pos < 2 * w + h) {
                points.push({ x: w - (pos - w - h), y: h });
            } else {
                points.push({ x: 0, y: h - (pos - 2 * w - h) });
            }
        };

        const trace = (from, to) => {
            let pos = from;
            while (pos < to) {
                addPoint(pos);
                pos += step;
            }
        };

        if (start < end) {
            trace(start, end);
        } else {
            trace(start, perimeter);
            trace(0, end);
        }

        if (points.length > 1) {
            bgCtx.beginPath();
            bgCtx.moveTo(points[0].x, points[0].y);

            if (isMobile) {
                for (let i = 1; i < points.length; i++) {
                    bgCtx.lineTo(points[i].x, points[i].y);
                }
            } else {
                for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1];
                    const curr = points[i];
                    const cx = (prev.x + curr.x) / 2;
                    const cy = (prev.y + curr.y) / 2;
                    bgCtx.quadraticCurveTo(prev.x, prev.y, cx, cy);
                }
            }

            bgCtx.lineWidth = glowWidth;
            bgCtx.strokeStyle = color;
            bgCtx.shadowColor = color;
            bgCtx.shadowBlur = glowBlur;
            bgCtx.lineCap = 'round';
            bgCtx.stroke();
        }
    }

    function draw(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        timeAccumulator += deltaTime;

        while (timeAccumulator >= frameInterval) {
            timeAccumulator -= frameInterval;

            const w = window.innerWidth;
            const h = window.innerHeight;
            const color = getActiveCardColor();

            progress = (progress + glowSpeed * (frameInterval / 1000)) % 1;

            bgCtx.clearRect(0, 0, w, h);

            if (document.visibilityState === 'hidden') {
                requestAnimationFrame(draw);
                return;
            }

            drawGlowSegment(progress, color);
            drawGlowSegment((progress + 0.5) % 1, color);
        }

        requestAnimationFrame(draw);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const observer = new MutationObserver(() => {});
    document.querySelectorAll('.flip-card').forEach(card => {
        observer.observe(card, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: false,
            childList: false,
            characterData: false
        });
    });

    if (document.visibilityState === 'visible') {
        requestAnimationFrame(draw);
    } else {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestAnimationFrame(draw);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
}

// Stripe heading effect
function applyResponsiveStripedHeading() {
    // Load Google Font (Anton)
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Anton&display=swap";
    document.head.appendChild(fontLink);

    // Replace original <h1> with styled container
    const h1 = document.querySelector('h1');
    if (!h1) return;

    const container = document.createElement('div');
    container.className = 'stripe-heading-container';

    const styledText = document.createElement('h1');
    styledText.className = 'stripe-heading-text';
    styledText.textContent = h1.textContent;

    container.appendChild(styledText);
    h1.replaceWith(container);
}

// Initialize all effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createNonIntrusiveGlowEffect();
    createDynamicBackgroundGlow();
    applyResponsiveStripedHeading();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'complete') {
    createNonIntrusiveGlowEffect();
    createDynamicBackgroundGlow();
    applyResponsiveStripedHeading();
}