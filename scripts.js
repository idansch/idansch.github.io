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

    const VIEW_PERSONA = 'persona_select';
    const VIEW_CHAT = 'chat';
    const CHAT_MODE_MOCK = 'mock';
    const CHAT_MODE_LIVE = 'live';
    const BACKEND_WORKER = 'worker';
    const BACKEND_PROMPT_API = 'prompt_api';
    const ENDPOINT_PLACEHOLDER_PATTERN = /(YOUR-WORKER-URL|example\.workers\.dev)/i;
    const MAX_HISTORY_MESSAGES = 30;
    const LOCAL_FALLBACK_PERSONAS = [
        {
            id: 'maya',
            displayName: 'Maya Cohen',
            shortDescription: '31-year-old product designer with migraine flares tied to stress and disrupted sleep.',
            profilePath: 'data/personas/maya.json'
        },
        {
            id: 'eli',
            displayName: 'Eli Ben-David',
            shortDescription: '75-year-old retired driver with systemic inflammation, renal strain, and cardiometabolic comorbidities.',
            profilePath: 'data/personas/eli.json'
        },
        {
            id: 'noa',
            displayName: 'Noa Levi',
            shortDescription: '26-year-old graduate student with asthma-allergy overlap and seasonal nighttime wheezing episodes.',
            profilePath: 'data/personas/noa.json'
        }
    ];
    const LOCAL_FALLBACK_PROFILES = {
        maya: {
            personaId: 'maya',
            demographics: {
                age: 31,
                sex: 'female',
                height_cm: 165,
                weight_kg: 60,
                bmi: 22,
                occupation: 'product designer',
                location: 'Tel Aviv'
            },
            medicalHistory: {
                conditions: ['episodic migraine', 'mild anxiety', 'insomnia (stress-related)'],
                allergies: ['penicillin'],
                medications: ['sumatriptan as needed', 'occasional ibuprofen', 'melatonin as needed'],
                relevantNotes: 'Reports increased migraine frequency during stressful work sprints and reduced sleep quality over the past month.'
            },
            clinicalContext: {
                knownCondition: 'migraine flare with stress-sleep interaction',
                severity: 'mild_to_moderate',
                generatedAt: '2026-04-24'
            },
            labResults: {
                inflammation: {
                    crp_mg_l: { value: 2.1, status: 'normal' },
                    esr_mm_hr: { value: 14, status: 'normal' }
                },
                cbc: {
                    hemoglobin_g_dl: { value: 12.6, status: 'normal' },
                    wbc_k_ul: { value: 7.4, status: 'normal' }
                },
                metabolic: {
                    glucose_mg_dl: { value: 91, status: 'normal' },
                    hba1c_percent: { value: 5.3, status: 'normal' }
                },
                nutritional: {
                    vitamin_d_ng_ml: { value: 24, status: 'borderline_low' },
                    vitamin_b12_pg_ml: { value: 345, status: 'normal' }
                }
            },
            agentAnalysis: {
                primaryPattern: 'stress-triggered migraine burden',
                secondaryPatterns: ['sleep_deprivation', 'screen_exposure_trigger', 'anxiety_amplification'],
                systemImpacts: {
                    neurologic: 'moderate',
                    sleep_regulation: 'moderate',
                    mental_health: 'mild_to_moderate'
                }
            },
            recommendations: {
                urgency: 'outpatient_followup_if_pattern_worsens',
                suggestedTests: ['headache_diary_tracking', 'blood_pressure_log_during_episodes', 'sleep_duration_tracking', 'followup_neurology_if_frequency_increases'],
                redFlags: ['sudden_worst_headache', 'neurologic_deficit', 'persistent_vomiting', 'vision_loss', 'confusion']
            },
            currentContext: {
                goal: 'Get initial guidance for headache episodes and identify warning signs that should trigger urgent care.',
                constraints: 'Prefers concise actionable steps and avoids sedating medication during work hours.'
            },
            toneGuidance: {
                preferredTone: 'clear and calm',
                format: 'short bullet points with a brief summary'
            }
        },
        eli: {
            personaId: 'eli',
            demographics: {
                age: 75,
                sex: 'male',
                height_cm: 171,
                weight_kg: 83,
                bmi: 28.4,
                occupation: 'retired delivery driver',
                location: 'Ramat Gan'
            },
            medicalHistory: {
                conditions: ['systemic inflammatory process', 'type 2 diabetes', 'hypertension'],
                allergies: [],
                medications: ['metformin', 'lisinopril'],
                relevantNotes: 'Occasional non-radiating chest discomfort after exertion. Last routine comprehensive follow-up was over one year ago.'
            },
            clinicalContext: {
                knownCondition: 'systemic inflammatory process',
                severity: 'moderate',
                generatedAt: '2026-04-24'
            },
            labResults: {
                inflammation: {
                    crp_mg_l: { value: 18, status: 'high' },
                    esr_mm_hr: { value: 55, status: 'high' },
                    ferritin_ng_ml: { value: 420, status: 'high' }
                },
                cbc: {
                    wbc_k_ul: { value: 12.8, status: 'high' },
                    neutrophils_percent: { value: 78, status: 'high' },
                    lymphocytes_percent: { value: 14, status: 'low' },
                    hemoglobin_g_dl: { value: 11.8, status: 'low' },
                    platelets_k_ul: { value: 420, status: 'high' }
                },
                renal: {
                    creatinine_mg_dl: { value: 1.45, status: 'high' },
                    urea_mg_dl: { value: 68, status: 'high' },
                    egfr_ml_min: { value: 48, status: 'low' }
                },
                liver: {
                    alt_u_l: { value: 52, status: 'high' },
                    ast_u_l: { value: 47, status: 'high' },
                    alp_u_l: { value: 135, status: 'high' },
                    albumin_g_dl: { value: 3.2, status: 'low' }
                },
                electrolytes: {
                    sodium_mmol_l: { value: 138, status: 'normal' },
                    potassium_mmol_l: { value: 4.7, status: 'normal' },
                    calcium_mg_dl: { value: 8.5, status: 'low' }
                },
                metabolic: {
                    glucose_mg_dl: { value: 112, status: 'high' },
                    hba1c_percent: { value: 6.1, status: 'borderline' }
                },
                lipids: {
                    total_cholesterol_mg_dl: { value: 190, status: 'normal' },
                    ldl_mg_dl: { value: 120, status: 'borderline' },
                    hdl_mg_dl: { value: 42, status: 'low' },
                    triglycerides_mg_dl: { value: 160, status: 'high' }
                },
                additional: {
                    vitamin_b12_pg_ml: { value: 280, status: 'borderline_low' },
                    vitamin_d_ng_ml: { value: 18, status: 'low' },
                    uric_acid_mg_dl: { value: 7.8, status: 'high' }
                }
            },
            agentAnalysis: {
                primaryPattern: 'systemic inflammation',
                secondaryPatterns: ['renal_function_impairment', 'anemia_of_inflammation', 'low_albumin_state', 'metabolic_dysregulation', 'nutritional_deficiencies'],
                systemImpacts: {
                    immune_system: 'moderate',
                    renal_system: 'moderate',
                    hematologic: 'mild_to_moderate',
                    nutritional_status: 'moderate',
                    metabolic: 'mild'
                }
            },
            recommendations: {
                urgency: 'medical_followup_within_days',
                suggestedTests: ['repeat_crp', 'repeat_cbc', 'urinalysis_and_culture', 'iron_panel', 'vitamin_b12_and_folate', 'repeat_renal_panel', 'repeat_liver_panel', 'chest_xray_if_symptomatic'],
                redFlags: ['high_fever', 'confusion', 'shortness_of_breath', 'chest_pain', 'reduced_urine_output', 'rapid_clinical_deterioration']
            },
            currentContext: {
                goal: 'Receive initial guidance about symptom triage and whether urgent in-person evaluation is needed.',
                constraints: 'Needs practical next steps with clear urgency thresholds and minimal unnecessary travel.'
            },
            toneGuidance: {
                preferredTone: 'direct and practical',
                format: 'prioritized checklist'
            }
        },
        noa: {
            personaId: 'noa',
            demographics: {
                age: 26,
                sex: 'female',
                height_cm: 163,
                weight_kg: 58,
                bmi: 21.8,
                occupation: 'graduate student',
                location: 'Jerusalem'
            },
            medicalHistory: {
                conditions: ['mild persistent asthma', 'seasonal allergic rhinitis'],
                allergies: ['cat dander', 'grass pollen'],
                medications: ['budesonide inhaler', 'albuterol rescue inhaler', 'cetirizine', 'saline nasal rinse'],
                relevantNotes: 'Has occasional nighttime wheezing during high pollen days and worries about overusing rescue inhaler.'
            },
            clinicalContext: {
                knownCondition: 'asthma-allergy overlap with seasonal exacerbations',
                severity: 'mild_to_moderate',
                generatedAt: '2026-04-24'
            },
            labResults: {
                inflammation: {
                    crp_mg_l: { value: 1.9, status: 'normal' },
                    eosinophils_percent: { value: 6.8, status: 'high' }
                },
                pulmonary: {
                    peak_flow_l_min: { value: 360, status: 'borderline_low' },
                    fev1_percent_predicted: { value: 82, status: 'borderline' }
                },
                cbc: {
                    wbc_k_ul: { value: 8.2, status: 'normal' },
                    hemoglobin_g_dl: { value: 12.9, status: 'normal' }
                },
                nutritional: {
                    vitamin_d_ng_ml: { value: 22, status: 'borderline_low' }
                }
            },
            agentAnalysis: {
                primaryPattern: 'allergic airway reactivity',
                secondaryPatterns: ['nighttime_symptom_variability', 'seasonal_trigger_sensitivity', 'rescue_inhaler_reliance_risk'],
                systemImpacts: {
                    respiratory: 'moderate',
                    sleep_quality: 'mild',
                    daily_function: 'mild_to_moderate'
                }
            },
            recommendations: {
                urgency: 'timely_primary_or_pulmonary_followup',
                suggestedTests: ['peak_flow_diary', 'rescue_inhaler_use_frequency_log', 'spirometry_followup', 'allergy_trigger_review'],
                redFlags: ['inability_to_speak_full_sentences', 'cyanosis', 'rescue_inhaler_no_relief', 'persistent_chest_tightness', 'rapid_breathing_worsening']
            },
            currentContext: {
                goal: 'Get initial advice for managing breathing symptoms and when to seek urgent in-person care.',
                constraints: 'Wants plain-language explanations and low-friction daily plan suggestions.'
            },
            toneGuidance: {
                preferredTone: 'supportive and precise',
                format: 'short paragraphs with concrete next actions'
            }
        }
    };

    const state = {
        view: VIEW_PERSONA,
        personas: [],
        profileCache: new Map(),
        selectedPersona: null,
        messages: [],
        isLoading: false,
        lastError: null,
        retryContext: null,
        stickToBottom: true
    };

    const personaSelectSection = document.getElementById('persona-select-section');
    const personaGrid = document.getElementById('persona-grid');
    const changePersonaButton = document.getElementById('change-persona-button');
    const statusNode = document.getElementById('medical-status');
    const summaryNode = document.getElementById('selected-persona-summary');

    const chatEmptyState = document.getElementById('chat-empty-state');
    const chatMessages = document.getElementById('chat-messages');
    const chatError = document.getElementById('chat-error');
    const chatErrorText = document.getElementById('chat-error-text');
    const retryButton = document.getElementById('retry-button');

    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    if (!personaSelectSection || !personaGrid || !changePersonaButton || !statusNode || !summaryNode || !chatEmptyState || !chatMessages || !chatError || !chatErrorText || !retryButton || !chatForm || !chatInput || !sendButton) {
        return;
    }

    changePersonaButton.addEventListener('click', () => {
        state.lastError = null;
        state.retryContext = null;
        switchView(VIEW_PERSONA);
        renderError();
        setStatus('Pick a persona to start a new chat.');
    });

    personaGrid.addEventListener('click', async (event) => {
        const trigger = event.target.closest('button[data-persona-id]');
        if (!trigger || state.isLoading) return;
        await selectPersona(trigger.dataset.personaId);
    });

    chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (state.isLoading || !state.selectedPersona) return;

        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        chatInput.value = '';
        autoSizeInput();
        await sendUserMessage(userMessage);
    });

    chatInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
        event.preventDefault();
        if (!state.isLoading) {
            chatForm.requestSubmit();
        }
    });

    chatInput.addEventListener('input', autoSizeInput);

    retryButton.addEventListener('click', async () => {
        if (!state.retryContext || state.isLoading || !state.selectedPersona) return;
        await retryLastMessage();
    });

    chatMessages.addEventListener('scroll', () => {
        const distance = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight;
        state.stickToBottom = distance <= 72;
    });

    setupKeyboardViewportTracking();
    autoSizeInput();
    render();
    root.dataset.initialized = 'true';

    loadPersonas();

    async function loadPersonas() {
        setStatus('Loading personas...');

        try {
            const response = await fetch('data/personas/index.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const items = Array.isArray(payload.personas) ? payload.personas : payload;

            const personas = items
                .filter((persona) => persona && typeof persona.id === 'string' && typeof persona.displayName === 'string' && typeof persona.shortDescription === 'string' && typeof persona.profilePath === 'string')
                .slice(0, 3);

            if (!personas.length) {
                throw new Error('No valid personas found in index.json');
            }

            state.personas = personas;
            setStatus('Select a persona to begin.');
            renderPersonaCards();
        } catch (error) {
            if (isLocalFileProtocol()) {
                state.personas = LOCAL_FALLBACK_PERSONAS.slice(0, 3);
                Object.keys(LOCAL_FALLBACK_PROFILES).forEach((id) => {
                    state.profileCache.set(id, LOCAL_FALLBACK_PROFILES[id]);
                });
                setStatus('Running from file://. Using bundled fallback persona data. Use localhost or GitHub Pages to load JSON files directly.');
                renderPersonaCards();
                return;
            }

            state.personas = [];
            personaGrid.innerHTML = '<article class="persona-card persona-card-error"><p>Failed to load personas.</p><p>Check data/personas/index.json and refresh.</p></article>';
            setStatus(`Persona load failed: ${error.message}`);
        }
    }

    function renderPersonaCards() {
        if (!state.personas.length) return;

        personaGrid.innerHTML = '';

        state.personas.forEach((persona) => {
            const card = document.createElement('article');
            card.className = 'persona-card';
            card.innerHTML = `
                <h3>${escapeHtml(persona.displayName)}</h3>
                <p>${escapeHtml(persona.shortDescription)}</p>
                <button class="cta-button" type="button" data-persona-id="${escapeHtml(persona.id)}">Use Persona</button>
            `;
            card.classList.add('reveal', 'is-visible');
            personaGrid.appendChild(card);
        });
    }

    async function selectPersona(personaId) {
        const persona = state.personas.find((entry) => entry.id === personaId);
        if (!persona) {
            setStatus('Selected persona was not found.');
            return;
        }

        setStatus(`Loading ${persona.displayName} profile...`);

        try {
            let profile = state.profileCache.get(persona.id);
            if (!profile) {
                const response = await fetch(persona.profilePath, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`Profile HTTP ${response.status}`);
                }

                profile = await response.json();
                state.profileCache.set(persona.id, profile);
            }

            state.selectedPersona = {
                ...persona,
                profile
            };
            state.messages = [
                createMessage('assistant', `You are now chatting as ${persona.displayName}. Share symptoms or concerns, and I will provide initial guidance.`)
            ];
            state.lastError = null;
            state.retryContext = null;
            state.stickToBottom = true;

            switchView(VIEW_CHAT);
            setStatus(`${persona.displayName} loaded. Start typing your question.`);
            render();
            focusComposer();
        } catch (error) {
            setStatus(`Failed to load persona profile: ${error.message}`);
        }
    }

    async function sendUserMessage(userMessage) {
        const messagesBefore = state.messages.slice(-MAX_HISTORY_MESSAGES);

        state.messages.push(createMessage('user', userMessage));
        state.lastError = null;
        state.retryContext = {
            messagesBefore,
            userMessage
        };
        state.isLoading = true;
        state.stickToBottom = true;

        setStatus('Waiting for assistant reply...');
        render();

        try {
            const response = await requestAssistantReply(messagesBefore, userMessage);
            state.messages.push(createMessage('assistant', response.assistantText));
            state.lastError = null;
            state.retryContext = null;
            setStatus('Reply received.');
        } catch (error) {
            state.lastError = {
                errorCode: error.errorCode || 'CHAT_REQUEST_FAILED',
                errorMessage: error.errorMessage || 'Could not fetch assistant reply.'
            };
            setStatus(`Reply failed: ${state.lastError.errorMessage}`);
        } finally {
            state.isLoading = false;
            render();
            focusComposer();
        }
    }

    async function retryLastMessage() {
        if (!state.retryContext) return;

        state.lastError = null;
        state.isLoading = true;
        state.stickToBottom = true;

        setStatus('Retrying last message...');
        render();

        try {
            const response = await requestAssistantReply(
                state.retryContext.messagesBefore,
                state.retryContext.userMessage
            );
            state.messages.push(createMessage('assistant', response.assistantText));
            state.lastError = null;
            state.retryContext = null;
            setStatus('Reply received.');
        } catch (error) {
            state.lastError = {
                errorCode: error.errorCode || 'CHAT_RETRY_FAILED',
                errorMessage: error.errorMessage || 'Retry failed.'
            };
            setStatus(`Retry failed: ${state.lastError.errorMessage}`);
        } finally {
            state.isLoading = false;
            render();
            focusComposer();
        }
    }

    async function requestAssistantReply(messagesBefore, userMessage) {
        const chatMode = resolveChatMode();
        if (chatMode === CHAT_MODE_MOCK) {
            return requestMockAssistantReply(messagesBefore, userMessage);
        }

        const backendType = resolveBackendType();
        if (backendType === BACKEND_PROMPT_API) {
            return requestPromptApiReply(messagesBefore, userMessage);
        }

        const endpoint = resolveEndpoint();
        if (!endpoint || ENDPOINT_PLACEHOLDER_PATTERN.test(endpoint)) {
            throw {
                errorCode: 'CONFIG_MISSING_ENDPOINT',
                errorMessage: 'Set a real Cloudflare Worker URL in shelter.html data-api-endpoint.'
            };
        }

        const payload = {
            personaId: state.selectedPersona.id,
            personaProfile: state.selectedPersona.profile,
            messages: normalizeMessages(messagesBefore),
            userMessage,
            clientMeta: {
                page: window.location.pathname,
                locale: navigator.language,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }
        };

        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (_error) {
            throw {
                errorCode: 'NETWORK_ERROR',
                errorMessage: 'Network request failed before reaching the worker.'
            };
        }

        let body = null;
        try {
            body = await response.json();
        } catch (_error) {
            body = null;
        }

        if (!response.ok) {
            throw {
                errorCode: body?.errorCode || 'WORKER_ERROR',
                errorMessage: body?.errorMessage || `Worker returned HTTP ${response.status}`
            };
        }

        if (!body || typeof body.assistantText !== 'string' || !body.assistantText.trim()) {
            throw {
                errorCode: 'INVALID_WORKER_RESPONSE',
                errorMessage: 'Worker response did not include assistantText.'
            };
        }

        return body;
    }

    async function requestPromptApiReply(messagesBefore, userMessage) {
        const endpoint = resolveEndpoint();
        if (!endpoint) {
            throw {
                errorCode: 'CONFIG_MISSING_ENDPOINT',
                errorMessage: 'Missing live endpoint for prompt API.'
            };
        }

        const securityKey = resolveSecurityKey();
        if (!securityKey) {
            throw {
                errorCode: 'CONFIG_MISSING_SECURITY_KEY',
                errorMessage: 'Missing X-Security-Key for prompt API.'
            };
        }

        const prompt = buildPromptApiRequest(messagesBefore, userMessage);
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Security-Key': securityKey
                },
                body: JSON.stringify({ prompt })
            });
        } catch (_error) {
            throw {
                errorCode: 'NETWORK_ERROR',
                errorMessage: 'Network request failed before reaching the prompt API.'
            };
        }

        let assistantText = '';
        let responseBody = null;

        try {
            responseBody = await response.json();
            assistantText = extractPromptApiAssistantText(responseBody);
        } catch (_error) {
            try {
                const fallbackText = await response.text();
                assistantText = String(fallbackText || '').trim();
            } catch (_error2) {
                assistantText = '';
            }
        }

        if (!response.ok) {
            throw {
                errorCode: 'PROMPT_API_ERROR',
                errorMessage: responseBody?.errorMessage || responseBody?.message || `Prompt API returned HTTP ${response.status}`
            };
        }

        if (!assistantText) {
            throw {
                errorCode: 'INVALID_PROMPT_API_RESPONSE',
                errorMessage: 'Prompt API returned an empty reply.'
            };
        }

        return {
            assistantText
        };
    }

    async function requestMockAssistantReply(_messagesBefore, userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        const personaName = state.selectedPersona?.displayName || 'the selected persona';
        const bullets = [];
        let severity = 'routine';

        if (matchesAny(lowerMessage, ['chest pain', 'shortness of breath', 'can\'t breathe', 'faint', 'fainted', 'confusion', 'one-sided weakness', 'slurred speech', 'seizure', 'severe bleeding'])) {
            severity = 'urgent';
            bullets.push('This could be urgent. Seek immediate in-person emergency evaluation now.');
            bullets.push('Do not wait for online advice if symptoms are severe, worsening, or include breathing/chest/neurologic warning signs.');
        } else if (matchesAny(lowerMessage, ['fever', 'cough', 'sore throat', 'vomit', 'nausea', 'diarrhea', 'headache', 'migraine', 'rash'])) {
            bullets.push('Track symptom start time, severity, and triggers over the next 24 hours.');
            bullets.push('Hydrate, rest, and use previously prescribed medications as directed on the label.');
            bullets.push('Arrange same-day clinic care if symptoms are worsening or not improving.');
        } else if (matchesAny(lowerMessage, ['asthma', 'wheezing', 'inhaler', 'breath'])) {
            bullets.push('Use your prescribed rescue inhaler exactly as instructed if active breathing symptoms are present.');
            bullets.push('Escalate to urgent care quickly if breathing effort increases or rescue medication is not helping.');
            bullets.push('Document trigger exposure (dust, pollen, exercise, infection) for your clinician.');
        } else if (matchesAny(lowerMessage, ['diabetes', 'glucose', 'blood sugar', 'insulin', 'hypertension', 'pressure'])) {
            bullets.push('Check objective readings now (glucose and/or blood pressure if available).');
            bullets.push('Keep medication schedule unchanged unless a licensed clinician instructs otherwise.');
            bullets.push('Book prompt follow-up to review trends and adjust treatment safely.');
        } else {
            bullets.push('Share when symptoms started, what makes them better/worse, and any measured vitals.');
            bullets.push('Monitor for progression over the next several hours and avoid delaying care if new warning signs appear.');
            bullets.push('If uncertain, use urgent-care triage rather than waiting for symptoms to intensify.');
        }

        const opening = severity === 'urgent'
            ? `For ${personaName}, this description raises possible red-flag concerns.`
            : `For ${personaName}, here is initial guidance based on your message.`;

        const assistantText = [
            `[Mock response] ${opening}`,
            '',
            ...bullets.map((item) => `- ${item}`),
            '',
            'This is a simulated reply while backend integration is pending and does not replace professional medical evaluation.'
        ].join('\n');

        await delay(450 + Math.round(Math.random() * 350));

        return {
            assistantText,
            requestId: `mock-${Date.now()}`
        };
    }

    function switchView(view) {
        state.view = view;
        root.dataset.view = view;

        const inChatView = view === VIEW_CHAT;
        personaSelectSection.hidden = inChatView;
        changePersonaButton.hidden = !inChatView;
        chatMessages.hidden = !inChatView;
        chatEmptyState.hidden = inChatView;

        setComposerDisabled(!inChatView || state.isLoading || !state.selectedPersona);
    }

    function setComposerDisabled(disabled) {
        chatInput.disabled = disabled;
        sendButton.disabled = disabled;
    }

    function render() {
        const inChatView = state.view === VIEW_CHAT;
        switchView(state.view);

        if (!state.selectedPersona) {
            summaryNode.textContent = 'No persona selected yet.';
        } else {
            summaryNode.textContent = `${state.selectedPersona.displayName}: ${state.selectedPersona.shortDescription}`;
        }

        renderError();

        if (!inChatView) {
            return;
        }

        chatMessages.innerHTML = '';

        state.messages.forEach((message) => {
            const node = document.createElement('article');
            node.className = `chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`;
            node.innerHTML = `
                <p class="chat-role">${message.role === 'user' ? 'You' : 'Assistant'}</p>
                <p class="chat-text"></p>
            `;
            const textNode = node.querySelector('.chat-text');
            textNode.textContent = message.text;
            chatMessages.appendChild(node);
        });

        if (state.isLoading) {
            const typingNode = document.createElement('article');
            typingNode.className = 'chat-message chat-message-assistant chat-message-typing';
            typingNode.innerHTML = `
                <p class="chat-role">Assistant</p>
                <p class="chat-text"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></p>
            `;
            chatMessages.appendChild(typingNode);
        }

        scrollMessagesToBottom();
        setComposerDisabled(state.isLoading || !state.selectedPersona);
    }

    function renderError() {
        if (!state.lastError) {
            chatError.hidden = true;
            chatErrorText.textContent = '';
            return;
        }

        chatError.hidden = false;
        chatErrorText.textContent = `${state.lastError.errorCode}: ${state.lastError.errorMessage}`;
    }

    function scrollMessagesToBottom() {
        if (!state.stickToBottom) return;

        window.requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function focusComposer() {
        if (state.view !== VIEW_CHAT || state.isLoading || !state.selectedPersona) return;
        chatInput.focus({ preventScroll: true });
    }

    function autoSizeInput() {
        chatInput.style.height = 'auto';
        const maxHeight = 180;
        const nextHeight = Math.min(chatInput.scrollHeight, maxHeight);
        chatInput.style.height = `${Math.max(nextHeight, 44)}px`;
        chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    function setupKeyboardViewportTracking() {
        if (!window.visualViewport) return;

        const updateViewportInsets = () => {
            const keyboardOffset = Math.max(
                0,
                window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
            );
            root.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
        };

        window.visualViewport.addEventListener('resize', updateViewportInsets);
        window.visualViewport.addEventListener('scroll', updateViewportInsets);
        updateViewportInsets();
    }

    function setStatus(text) {
        statusNode.textContent = text;
    }

    function resolveEndpoint() {
        const fromWindow = typeof window.MEDICAL_CHAT_ENDPOINT === 'string'
            ? window.MEDICAL_CHAT_ENDPOINT.trim()
            : '';

        if (fromWindow) return fromWindow;
        return (root.dataset.apiEndpoint || '').trim();
    }

    function resolveBackendType() {
        const fromWindow = typeof window.MEDICAL_CHAT_BACKEND === 'string'
            ? window.MEDICAL_CHAT_BACKEND.trim().toLowerCase()
            : '';
        if (fromWindow === BACKEND_PROMPT_API || fromWindow === BACKEND_WORKER) {
            return fromWindow;
        }

        const fromData = (root.dataset.backendType || '').trim().toLowerCase();
        if (fromData === BACKEND_PROMPT_API || fromData === BACKEND_WORKER) {
            return fromData;
        }

        return BACKEND_WORKER;
    }

    function resolveSecurityKey() {
        const fromWindow = typeof window.MEDICAL_CHAT_SECURITY_KEY === 'string'
            ? window.MEDICAL_CHAT_SECURITY_KEY.trim()
            : '';
        if (fromWindow) return fromWindow;
        return (root.dataset.securityKey || '').trim();
    }

    function buildPromptApiRequest(messagesBefore, userMessage) {
        const personaName = state.selectedPersona?.displayName || 'Selected persona';
        const profile = state.selectedPersona?.profile || {};
        const history = normalizeMessages(messagesBefore)
            .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
            .join('\n');

        return [
            `Persona: ${personaName}`,
            `Persona profile JSON: ${JSON.stringify(profile)}`,
            'You provide initial medical guidance only. Avoid definitive diagnosis. Mention urgent care when red flags appear.',
            history ? `Conversation so far:\n${history}` : 'Conversation so far: (none)',
            `User: ${userMessage}`,
            'Assistant:'
        ].join('\n\n');
    }

    function extractPromptApiAssistantText(body) {
        if (!body) return '';
        if (typeof body === 'string') return body.trim();
        if (typeof body.assistantText === 'string' && body.assistantText.trim()) return body.assistantText.trim();
        if (typeof body.reply === 'string' && body.reply.trim()) return body.reply.trim();
        if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
        if (typeof body.response === 'string' && body.response.trim()) return body.response.trim();
        if (typeof body.text === 'string' && body.text.trim()) return body.text.trim();

        const nestedOutput = body.output;
        if (typeof nestedOutput === 'string' && nestedOutput.trim()) return nestedOutput.trim();

        if (Array.isArray(nestedOutput)) {
            const merged = nestedOutput
                .map((item) => {
                    if (typeof item === 'string') return item;
                    if (typeof item?.text === 'string') return item.text;
                    if (typeof item?.content === 'string') return item.content;
                    return '';
                })
                .filter(Boolean)
                .join('\n')
                .trim();
            if (merged) return merged;
        }

        return '';
    }

    function resolveChatMode() {
        const fromWindow = typeof window.MEDICAL_CHAT_MODE === 'string'
            ? window.MEDICAL_CHAT_MODE.trim().toLowerCase()
            : '';
        if (fromWindow === CHAT_MODE_MOCK || fromWindow === CHAT_MODE_LIVE) {
            return fromWindow;
        }

        const fromData = (root.dataset.chatMode || '').trim().toLowerCase();
        if (fromData === CHAT_MODE_MOCK || fromData === CHAT_MODE_LIVE) {
            return fromData;
        }

        return CHAT_MODE_LIVE;
    }

    function matchesAny(text, keywords) {
        return keywords.some((keyword) => text.includes(keyword));
    }

    function delay(milliseconds) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, milliseconds);
        });
    }

    function isLocalFileProtocol() {
        return window.location.protocol === 'file:';
    }

    function normalizeMessages(messages) {
        if (!Array.isArray(messages)) return [];

        return messages
            .filter((message) =>
                message &&
                (message.role === 'user' || message.role === 'assistant') &&
                typeof message.text === 'string' &&
                message.text.trim()
            )
            .slice(-MAX_HISTORY_MESSAGES)
            .map((message) => ({
                role: message.role,
                content: message.text.trim()
            }));
    }

    function createMessage(role, text) {
        return {
            id: createId(),
            role,
            text,
            timestamp: Date.now()
        };
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
