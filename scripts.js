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
        '.shelter-card',
        '.shelter-details > *',
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

    const DEFAULT_FEED_SOURCE = 'https://api.codetabs.com/v1/proxy/?quest=https://api.tzevaadom.co.il/ios/feed';
    const STORAGE_SOURCE_KEY = 'shelter-feed-source';
    const STORAGE_CITY_KEY = 'shelter-manual-city';
    const ALERT_WINDOW_MS = 10 * 60 * 1000;

    const locateButton = document.getElementById('locate-button');
    const refreshButton = document.getElementById('refresh-button');
    const applyCityButton = document.getElementById('apply-city-button');
    const sourceInput = document.getElementById('source-endpoint');
    const saveSourceButton = document.getElementById('save-source-button');
    const resetSourceButton = document.getElementById('reset-source-button');
    const manualCityInput = document.getElementById('manual-city');
    const statusNode = document.getElementById('shelter-status');
    const updatedNode = document.getElementById('shelter-last-updated');
    const metricTodayNode = document.getElementById('metric-today');
    const metric24hNode = document.getElementById('metric-24h');
    const alertsTodayNode = document.getElementById('alerts-today');
    const alerts24hNode = document.getElementById('alerts-24h');
    const locationMatchNode = document.getElementById('location-match');
    const recentAlertsNode = document.getElementById('recent-alerts');

    const appState = {
        lat: null,
        lon: null,
        cityCandidates: [],
        manualCity: localStorage.getItem(STORAGE_CITY_KEY) || ''
    };

    sourceInput.value = localStorage.getItem(STORAGE_SOURCE_KEY) || DEFAULT_FEED_SOURCE;
    manualCityInput.value = appState.manualCity;

    locateButton?.addEventListener('click', async () => {
        setStatus('Detecting your location...');
        const coords = await getCurrentCoords();
        if (!coords) return;

        appState.lat = coords.lat;
        appState.lon = coords.lon;
        const candidates = await reverseGeocodeCandidates(coords.lat, coords.lon);
        appState.cityCandidates = candidates;
        const candidateText = candidates.length ? candidates.join(', ') : 'No city detected';
        locationMatchNode.textContent = `Coordinates: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)} | Candidates: ${candidateText}`;
        setStatus('Location updated. Fetching alerts...');
        await computeAndRender();
    });

    refreshButton?.addEventListener('click', async () => {
        if (!appState.manualCity && !appState.cityCandidates.length) {
            setStatus('Set a location first, or apply a manual city.');
            return;
        }
        setStatus('Refreshing alert history...');
        await computeAndRender();
    });

    applyCityButton?.addEventListener('click', async () => {
        const city = (manualCityInput.value || '').trim();
        appState.manualCity = city;
        localStorage.setItem(STORAGE_CITY_KEY, city);
        const cityText = city ? city : 'None';
        locationMatchNode.textContent = `Manual city override: ${cityText}`;
        if (!city && !appState.cityCandidates.length) {
            setStatus('Manual city removed. Set location or add a city override.');
            return;
        }
        setStatus(city ? `Manual city applied: ${city}` : 'Manual city removed.');
        await computeAndRender();
    });

    saveSourceButton?.addEventListener('click', () => {
        const value = (sourceInput.value || '').trim();
        if (!value) {
            setStatus('Source URL cannot be empty.');
            return;
        }
        localStorage.setItem(STORAGE_SOURCE_KEY, value);
        setStatus('Source URL saved.');
    });

    resetSourceButton?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_SOURCE_KEY);
        sourceInput.value = DEFAULT_FEED_SOURCE;
        setStatus('Source URL reset to default.');
    });

    if (appState.manualCity) {
        locationMatchNode.textContent = `Manual city override: ${appState.manualCity}`;
    }

    root.dataset.initialized = 'true';

    function setStatus(text) {
        statusNode.textContent = text;
    }

    async function computeAndRender() {
        try {
            const feed = await fetchAlertsFeed(sourceInput.value || DEFAULT_FEED_SOURCE);
            const alerts = flattenAlerts(feed);
            const filtered = filterAlertsByCity(alerts, getSelectedCityCandidates());
            const totals = computeShelterTotals(filtered);
            renderMetrics(totals, filtered);
            setStatus(`Computed from ${filtered.length} matching alerts.`);
            updatedNode.textContent = `Last updated: ${new Date().toLocaleString()}`;
        } catch (error) {
            setStatus(`Failed to fetch alerts. ${error.message}`);
        }
    }

    function getSelectedCityCandidates() {
        if (appState.manualCity) return [appState.manualCity];
        return appState.cityCandidates;
    }

    function renderMetrics(totals, filteredAlerts) {
        metricTodayNode.textContent = formatDuration(totals.todayMs);
        metric24hNode.textContent = formatDuration(totals.last24hMs);
        alertsTodayNode.textContent = `${totals.todayAlerts} alerts`;
        alerts24hNode.textContent = `${totals.last24hAlerts} alerts`;
        renderRecentAlerts(filteredAlerts);
    }

    function renderRecentAlerts(alerts) {
        const items = alerts
            .slice()
            .sort((a, b) => b.time - a.time)
            .slice(0, 14);

        if (!items.length) {
            recentAlertsNode.innerHTML = '<li class="shelter-empty">No matching alerts found for this location.</li>';
            return;
        }

        recentAlertsNode.innerHTML = items
            .map((item) => {
                const localTime = new Date(item.time * 1000).toLocaleString();
                const cityLabel = item.cities.join(', ');
                return `<li><strong>${localTime}</strong><br>${cityLabel}</li>`;
            })
            .join('');
    }

    async function fetchAlertsFeed(sourceUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
            const response = await fetch(sourceUrl, {
                signal: controller.signal,
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const payload = await response.json();
            return payload.alertsHistory || payload;
        } finally {
            clearTimeout(timeout);
        }
    }

    function flattenAlerts(feed) {
        if (!Array.isArray(feed)) return [];
        const all = [];
        feed.forEach((item) => {
            const alerts = Array.isArray(item.alerts) ? item.alerts : [];
            alerts.forEach((alert) => {
                if (alert.isDrill) return;
                if (!Array.isArray(alert.cities) || typeof alert.time !== 'number') return;
                all.push(alert);
            });
        });
        return all;
    }

    function filterAlertsByCity(alerts, cityCandidates) {
        const normalizedCandidates = cityCandidates
            .map((city) => normalizeCity(city))
            .filter(Boolean);

        if (!normalizedCandidates.length) return [];

        return alerts.filter((alert) =>
            alert.cities.some((city) => {
                const normalizedAlertCity = normalizeCity(city);
                return normalizedCandidates.some((candidate) => cityMatches(normalizedAlertCity, candidate));
            })
        );
    }

    function cityMatches(alertCity, candidateCity) {
        if (!alertCity || !candidateCity) return false;
        if (alertCity === candidateCity) return true;
        if (alertCity.includes(candidateCity) || candidateCity.includes(alertCity)) return true;

        const alertParts = alertCity.split(/[-,\/]/).map((part) => part.trim()).filter(Boolean);
        const candidateParts = candidateCity.split(/[-,\/]/).map((part) => part.trim()).filter(Boolean);
        return alertParts.some((alertPart) =>
            candidateParts.some((candidatePart) => alertPart === candidatePart)
        );
    }

    function normalizeCity(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0591-\u05C7]/g, '')
            .replace(/[״"'`]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function computeShelterTotals(alerts) {
        const nowMs = Date.now();
        const now = new Date(nowMs);
        const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const start24hMs = nowMs - 24 * 60 * 60 * 1000;

        const intervals = alerts.map((alert) => {
            const start = alert.time * 1000;
            return [start, start + ALERT_WINDOW_MS];
        });

        return {
            todayMs: totalInWindow(intervals, startOfTodayMs, nowMs),
            last24hMs: totalInWindow(intervals, start24hMs, nowMs),
            todayAlerts: alerts.filter((alert) => alert.time * 1000 >= startOfTodayMs).length,
            last24hAlerts: alerts.filter((alert) => alert.time * 1000 >= start24hMs).length
        };
    }

    function totalInWindow(intervals, windowStart, windowEnd) {
        const clipped = intervals
            .map(([start, end]) => [Math.max(start, windowStart), Math.min(end, windowEnd)])
            .filter(([start, end]) => end > start)
            .sort((a, b) => a[0] - b[0]);

        if (!clipped.length) return 0;

        const merged = [clipped[0].slice()];
        for (let i = 1; i < clipped.length; i += 1) {
            const [start, end] = clipped[i];
            const last = merged[merged.length - 1];
            if (start <= last[1]) {
                last[1] = Math.max(last[1], end);
            } else {
                merged.push([start, end]);
            }
        }

        return merged.reduce((sum, [start, end]) => sum + (end - start), 0);
    }

    function formatDuration(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return '0m';

        const totalMinutes = Math.round(milliseconds / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours === 0) return `${minutes}m`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    }

    async function getCurrentCoords() {
        if (!navigator.geolocation) {
            setStatus('Geolocation is not supported in this browser.');
            return null;
        }
        try {
            return await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    },
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            });
        } catch (error) {
            setStatus(`Could not get location: ${error.message}`);
            return null;
        }
    }

    async function reverseGeocodeCandidates(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=he,en`,
                {
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );
            if (!response.ok) return [];
            const data = await response.json();
            const address = data.address || {};
            const candidates = [
                address.city,
                address.town,
                address.village,
                address.municipality,
                address.suburb,
                address.county
            ]
                .filter(Boolean)
                .map((item) => String(item).trim());

            return [...new Set(candidates)];
        } catch (_error) {
            return [];
        }
    }
}
