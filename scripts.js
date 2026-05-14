function sendSupportEmail() {
    window.location.href = 'mailto:support@isapps.app';
}

function resolveCurrentPath() {
    const cleanedPath = window.location.pathname.replace(/\/+$/, '');
    if (!cleanedPath) return 'index.html';

    const parts = cleanedPath.split('/').filter(Boolean);
    if (window.location.protocol === 'file:') {
        const tail = parts.slice(-2).join('/');
        if (tail === 'vs/index.html') return 'vs/index.html';
        return parts[parts.length - 1] || 'index.html';
    }

    const normalizedPath = cleanedPath.replace(/^\/+/, '');
    return normalizedPath || 'index.html';
}

function initPageContext() {
    if (document.body.dataset.pageContextReady === 'true') return;

    const currentPath = resolveCurrentPath();
    const pageClass = currentPath.replace('.html', '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();

    document.body.dataset.page = currentPath;
    document.body.classList.add(`${pageClass || 'index'}-page`);

    if (currentPath === 'index.html') {
        document.body.classList.add('home-page', 'has-floating-dock');
    }

    document.body.dataset.pageContextReady = 'true';
}

function initNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar || navbar.dataset.initialized === 'true') return;

    const toggle = navbar.querySelector('.mobile-nav-toggle');
    const navLinks = navbar.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    const currentPath = resolveCurrentPath();
    navbar.querySelectorAll('.nav-links a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        if (href === currentPath) link.classList.add('active-link');
    });

    document.addEventListener('click', (event) => {
        if (!navbar.contains(event.target) && navLinks) {
            navLinks.classList.remove('open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
    });

    navbar.dataset.initialized = 'true';
}

function initNavbarDepth() {
    const navbar = document.querySelector('.navbar');
    if (!navbar || navbar.dataset.depthReady === 'true') return;

    const onScroll = () => {
        if (window.scrollY > 14) {
            document.body.classList.add('is-scrolled');
        } else {
            document.body.classList.remove('is-scrolled');
        }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    navbar.dataset.depthReady = 'true';
}

function initRevealAnimations() {
    if (document.body.dataset.revealInitialized === 'true') return;

    const selectors = [
        '.hero-content > *',
        '.story-section',
        '.app-detail > *',
        '.policy-section',
        '.terms-section',
        '.header > *',
        '.persona-card',
        '.chat-panel > *',
        '.invite-section',
        '.download-section',
        '.footer p'
    ];

    const revealNodes = document.querySelectorAll(selectors.join(','));
    revealNodes.forEach((node, index) => {
        node.classList.add('reveal');
        node.style.setProperty('--reveal-delay', `${Math.min(index * 36, 240)}ms`);
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );

    revealNodes.forEach((node) => observer.observe(node));
    document.body.dataset.revealInitialized = 'true';
}

function initDepthEffects() {
    if (document.body.dataset.depthInitialized === 'true') return;

    const updatePointer = (event) => {
        const x = (event.clientX / window.innerWidth) * 100;
        const y = (event.clientY / window.innerHeight) * 100;
        document.body.style.setProperty('--pointer-x', `${x}%`);
        document.body.style.setProperty('--pointer-y', `${y}%`);
    };

    let ticking = false;
    const heroContent = document.querySelector('.hero-content');
    const onScroll = () => {
        if (!heroContent || ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const offset = Math.min(window.scrollY * 0.04, 18);
            heroContent.style.transform = `translate3d(0, ${offset}px, 0)`;
            ticking = false;
        });
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.body.dataset.depthInitialized = 'true';
}

function initTiltMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.body.dataset.tiltInitialized === 'true') return;

    const cards = document.querySelectorAll('.story-collapse, .app-detail, .invite-section, .patient-card');
    cards.forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) - 0.5;
            const y = ((event.clientY - rect.top) / rect.height) - 0.5;
            card.style.setProperty('--tilt-x', `${(x * 5).toFixed(2)}deg`);
            card.style.setProperty('--tilt-y', `${(-y * 5).toFixed(2)}deg`);
        });

        card.addEventListener('pointerleave', () => {
            card.style.removeProperty('--tilt-x');
            card.style.removeProperty('--tilt-y');
        });
    });

    document.body.dataset.tiltInitialized = 'true';
}

function initHomeHeroEffects() {
    if (!document.body.classList.contains('home-page')) return;
    const hero = document.querySelector('.hero-content');
    if (!hero || hero.dataset.initialized === 'true') return;

    hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--hero-x', `${x}%`);
        hero.style.setProperty('--hero-y', `${y}%`);
    });

    hero.addEventListener('pointerleave', () => {
        hero.style.removeProperty('--hero-x');
        hero.style.removeProperty('--hero-y');
    });

    hero.dataset.initialized = 'true';
}

function initFloatingDock() {
    const dock = document.querySelector('.floating-app-dock');
    if (!dock || dock.dataset.initialized === 'true') return;

    const currentPath = resolveCurrentPath();
    const dockItems = Array.from(dock.querySelectorAll('.dock-item[data-dock-target]'));

    dockItems.forEach((item) => {
        if (item.dataset.dockTarget === currentPath) {
            item.classList.add('is-active');
        }

        item.addEventListener('pointermove', (event) => {
            const rect = item.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            item.style.setProperty('--dock-x', `${x}%`);
            item.style.setProperty('--dock-y', `${y}%`);
        });

        item.addEventListener('pointerleave', () => {
            item.style.removeProperty('--dock-x');
            item.style.removeProperty('--dock-y');
        });
    });

    dock.addEventListener('pointermove', (event) => {
        const dockRect = dock.getBoundingClientRect();
        const px = event.clientX - dockRect.left;
        dockItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const centerX = rect.left - dockRect.left + rect.width / 2;
            const distance = Math.abs(px - centerX);
            const scale = Math.max(1, 1.14 - distance / 260);
            item.style.setProperty('--dock-scale', scale.toFixed(3));
        });
    });

    dock.addEventListener('pointerleave', () => {
        dockItems.forEach((item) => item.style.removeProperty('--dock-scale'));
    });

    dock.dataset.initialized = 'true';
}

function initializeSiteInteractions() {
    initPageContext();
    initNavigation();
    initNavbarDepth();
    initRevealAnimations();
    initDepthEffects();
    initTiltMotion();
    initHomeHeroEffects();
    initFloatingDock();
    initShelterPage();
}

window.initializeSiteInteractions = initializeSiteInteractions;
document.addEventListener('DOMContentLoaded', initializeSiteInteractions);

function initShelterPage() {
    const root = document.getElementById('shelter-app');
    if (!root || root.dataset.initialized === 'true') return;

    const statusNode = document.getElementById('medical-status');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const restartSection = document.getElementById('restart-section');
    const restartButton = document.getElementById('restart-button');

    if (!statusNode || !chatMessages || !chatForm || !chatInput || !sendButton || !restartSection || !restartButton) return;

    const complaintText = chatInput.value.trim();
    const aiScriptBlocks = [
        'I have categorized 5 patterns. Each pattern includes engine triggers, engine interpretation and severity score.',
        'Pattern 1 - Progressive Anemia of Advanced Age\n- The engine identifies relatively rapid hemoglobin decline.\n- Transition from simple anemia to a more complex anemia pattern.\n- Possible combined mechanisms: iron deficiency, B12/folate deficiency, anemia of chronic disease, renal-related anemia.\nSeverity Score: High',
        'Pattern 2 - Renal Burden / Kidney Function Decline\n- The engine identifies impaired renal clearance and dehydration risk.\n- Combined effect of advanced age and low muscle mass may increase metabolic waste accumulation.\n- Expected manifestations: nausea, weakness, fatigue, appetite loss, confusion, drowsiness.\nSeverity Score: High',
        'Pattern 3 - Malnutrition / Muscle Mass Loss\n- The engine identifies reduced nutritional reserves and low available protein stores.\n- Sarcopenia may explain leg weakness, difficulty standing and reduced strength.\n- Fall risk and slower recovery are elevated.\nSeverity Score: High',
        'Pattern 4 - Cellular Stress / Tissue Breakdown\n- Markedly elevated LDH may indicate physiological and tissue stress.\n- This may be associated with advanced anemia progression.\nSeverity Score: Moderate-High',
        'Pattern 5 - Mild Chronic Inflammatory Activity\n- No clear evidence of severe acute infection.\n- Possible mild chronic inflammatory activity and chronic systemic stress response.\nSeverity Score: Low-Moderate',
        'Summary - Metabolic Collapse in Advanced Age\nIntegrated pattern: progressive anemia + renal decline + malnutrition + muscle wasting + cellular stress.\nDominant meta-pattern: extremely reduced biological reserve capacity.',
        'Recommended Follow-Up Evaluation\nCritical missing tests: Ferritin, Vitamin B12, Folate, eGFR, Reticulocyte count, Occult blood stool test, Iron saturation.'
    ];

    let hasSent = false;
    let isSimulating = false;

    setStatus('Ready to send scripted complaint.');
    chatForm.hidden = false;
    restartSection.hidden = true;
    restartButton.disabled = true;
    root.dataset.initialized = 'true';

    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (hasSent || isSimulating) return;

        hasSent = true;
        isSimulating = true;
        sendButton.disabled = true;
        chatForm.hidden = true;
        restartSection.hidden = false;
        restartButton.disabled = true;

        appendUserComplaint(complaintText);
        setStatus('Simulating AI analysis...');

        await delay(380);
        for (const block of aiScriptBlocks) {
            await appendAssistantBlockGradual(block);
            await delay(260);
        }

        isSimulating = false;
        setStatus('Scripted AI response completed.');
        restartButton.disabled = false;
    });

    restartButton.addEventListener('click', () => {
        if (isSimulating) return;
        hasSent = false;
        restartButton.disabled = true;
        sendButton.disabled = false;
        chatMessages.innerHTML = '';
        chatForm.hidden = false;
        restartSection.hidden = true;
        setStatus('Ready to send scripted complaint.');
    });

    function appendUserComplaint(text) {
        const node = createMessageNode('user');
        const textNode = node.querySelector('.chat-text');
        textNode.textContent = text;

        const attachmentNode = document.createElement('div');
        attachmentNode.className = 'bubble-attachment';
        attachmentNode.innerHTML = '<span class="attachment-pill">📎 testResults.pdf</span>';
        node.appendChild(attachmentNode);
        chatMessages.appendChild(node);
        scrollMessagesToBottom();
    }

    async function appendAssistantBlockGradual(fullText) {
        const node = createMessageNode('assistant');
        const textNode = node.querySelector('.chat-text');
        textNode.textContent = '';
        chatMessages.appendChild(node);

        const chunks = chunkText(fullText);
        for (let i = 0; i < chunks.length; i += 1) {
            textNode.textContent += chunks[i];
            scrollMessagesToBottom();
            await delay(38 + Math.round(Math.random() * 28));
        }
    }

    function createMessageNode(role) {
        const node = document.createElement('article');
        node.className = `chat-message ${role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`;
        node.innerHTML = `
            <p class="chat-role">${role === 'user' ? 'Patient' : 'Assistant'}</p>
            <p class="chat-text"></p>
        `;
        return node;
    }

    function chunkText(text) {
        const words = text.split(/(\s+)/);
        const chunks = [];
        let buffer = '';

        words.forEach((part) => {
            buffer += part;
            if (buffer.length >= 16 || /[.!?\n]$/.test(buffer)) {
                chunks.push(buffer);
                buffer = '';
            }
        });

        if (buffer) chunks.push(buffer);
        return chunks.length ? chunks : [text];
    }

    function scrollMessagesToBottom() {
        window.requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function setStatus(text) {
        statusNode.textContent = text;
    }

    function delay(milliseconds) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, milliseconds);
        });
    }
}
