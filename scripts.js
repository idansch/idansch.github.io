function sendSupportEmail() {
    window.location.href = 'mailto:support@isapps.app';
}

function initNavigation() {
    const navbar = document.querySelector('.navbar');
    if (!navbar || navbar.dataset.initialized === 'true') return;

    const toggle = navbar.querySelector('.mobile-nav-toggle');
    const navLinks = navbar.querySelector('.nav-links');
    const dropdown = navbar.querySelector('.dropdown');
    const dropdownAnchor = dropdown ? dropdown.querySelector(':scope > a') : null;

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    if (dropdown && dropdownAnchor) {
        dropdownAnchor.addEventListener('click', (event) => {
            if (window.matchMedia('(max-width: 880px)').matches) {
                event.preventDefault();
                dropdown.classList.toggle('open');
            }
        });
    }

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    navbar.querySelectorAll('.nav-links a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        if (href === currentPath) link.classList.add('active-link');
    });

    document.addEventListener('click', (event) => {
        if (!navbar.contains(event.target) && navLinks) {
            navLinks.classList.remove('open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            if (dropdown) dropdown.classList.remove('open');
        }
    });

    navbar.dataset.initialized = 'true';
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
    revealNodes.forEach((node) => node.classList.add('reveal'));

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

function initializeSiteInteractions() {
    initNavigation();
    initRevealAnimations();
    initDepthEffects();
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
