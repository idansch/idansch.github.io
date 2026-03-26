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
    const DEFAULT_CITIES_SOURCE = 'https://api.codetabs.com/v1/proxy/?quest=https://www.tzevaadom.co.il/static/cities.json';
    const STORAGE_SOURCE_KEY = 'shelter-feed-source';
    const STORAGE_CITY_KEY = 'shelter-manual-city';
    const STORAGE_ESTIMATE_ONLY_KEY = 'shelter-estimate-only';
    const ALERT_WINDOW_MS = 10 * 60 * 1000;
    const RELEASE_LOOKAHEAD_MS = 30 * 60 * 1000;
    const MIN_SESSION_MS = 30 * 1000;

    const locateButton = document.getElementById('locate-button');
    const refreshButton = document.getElementById('refresh-button');
    const applyCityButton = document.getElementById('apply-city-button');
    const estimateOnlyCheckbox = document.getElementById('estimate-only-checkbox');
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
    const metricAvgTodayNode = document.getElementById('metric-avg-today');
    const metricAvg24hNode = document.getElementById('metric-avg-24h');
    const locationMatchNode = document.getElementById('location-match');
    const resolvedCityNode = document.getElementById('resolved-city');
    const recentAlertsNode = document.getElementById('recent-alerts');

    const appState = {
        lat: null,
        lon: null,
        cityCandidates: [],
        manualCity: localStorage.getItem(STORAGE_CITY_KEY) || '',
        cityDirectory: null,
        inferredCity: null
    };

    sourceInput.value = localStorage.getItem(STORAGE_SOURCE_KEY) || DEFAULT_FEED_SOURCE;
    manualCityInput.value = appState.manualCity;
    estimateOnlyCheckbox.checked = localStorage.getItem(STORAGE_ESTIMATE_ONLY_KEY) === 'true';

    locateButton?.addEventListener('click', async () => {
        setStatus('Detecting your location...');
        const coords = await getCurrentCoords();
        if (!coords) return;

        appState.lat = coords.lat;
        appState.lon = coords.lon;
        const candidates = await reverseGeocodeCandidates(coords.lat, coords.lon);
        appState.cityCandidates = candidates;
        const cityDirectory = await fetchCityDirectory();
        appState.inferredCity = inferCityFromLocation(coords.lat, coords.lon, candidates, cityDirectory);

        const candidateText = candidates.length ? candidates.join(', ') : 'No city detected';
        locationMatchNode.textContent = `Coordinates: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)} | Candidates: ${candidateText}`;
        updateResolvedCityLabel();
        setStatus('Location updated. Fetching alerts...');
        await computeAndRender();
    });

    refreshButton?.addEventListener('click', async () => {
        if (!hasLocationSelection()) {
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
        updateResolvedCityLabel();
        if (!city && !appState.cityCandidates.length) {
            setStatus('Manual city removed. Set location or add a city override.');
            return;
        }
        setStatus(city ? `Manual city applied: ${city}` : 'Manual city removed.');
        await computeAndRender();
    });

    estimateOnlyCheckbox?.addEventListener('change', async () => {
        localStorage.setItem(STORAGE_ESTIMATE_ONLY_KEY, String(estimateOnlyCheckbox.checked));
        if (hasLocationSelection()) {
            setStatus(estimateOnlyCheckbox.checked ? 'Estimate-only mode enabled.' : 'Release-first mode enabled.');
            await computeAndRender();
            return;
        }
        setStatus(estimateOnlyCheckbox.checked ? 'Estimate-only mode enabled.' : 'Release-first mode enabled.');
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
    updateResolvedCityLabel();

    root.dataset.initialized = 'true';

    function setStatus(text) {
        statusNode.textContent = text;
    }

    function hasLocationSelection() {
        return Boolean(appState.manualCity || appState.inferredCity || appState.cityCandidates.length);
    }

    function getSelectedCityCandidates() {
        if (appState.manualCity) return [appState.manualCity];
        if (appState.inferredCity) return appState.inferredCity.searchNames;
        return appState.cityCandidates;
    }

    function updateResolvedCityLabel() {
        if (!resolvedCityNode) return;

        if (appState.manualCity) {
            resolvedCityNode.textContent = `Data city: ${appState.manualCity} (manual)`;
            return;
        }

        if (appState.inferredCity) {
            const method = appState.inferredCity.matchMethod === 'name'
                ? 'inferred from location name + nearest match'
                : 'inferred by nearest official alert city';
            resolvedCityNode.textContent = `Data city: ${appState.inferredCity.he} (${method})`;
            return;
        }

        if (appState.cityCandidates.length) {
            resolvedCityNode.textContent = 'Data city: unresolved (using raw location names)';
            return;
        }

        resolvedCityNode.textContent = 'Data city: --';
    }

    async function computeAndRender() {
        if (!hasLocationSelection()) {
            setStatus('Set a location first, or apply a manual city.');
            return;
        }

        try {
            const [feed, cityDirectory] = await Promise.all([
                fetchAlertsFeed(sourceInput.value || DEFAULT_FEED_SOURCE),
                fetchCityDirectory()
            ]);

            const alerts = flattenAlerts(feed.alertsHistory);
            const releases = flattenReleaseInstructions(feed.instructions);
            const relevantAlerts = selectRelevantAlerts(alerts, getSelectedCityCandidates(), cityDirectory);
            const sessions = buildShelterSessions(relevantAlerts, releases, estimateOnlyCheckbox.checked);
            const totals = computeShelterTotalsFromSessions(sessions);

            renderMetrics(totals, sessions);

            const releaseBasedCount = sessions.filter((session) => session.source === 'release').length;
            const fallbackCount = sessions.length - releaseBasedCount;
            setStatus(`Computed ${sessions.length} visits (${releaseBasedCount} release-based, ${fallbackCount} estimated fallback).`);
            updatedNode.textContent = `Last updated: ${new Date().toLocaleString()}`;
        } catch (error) {
            setStatus(`Failed to fetch alerts. ${error.message}`);
        }
    }

    function renderMetrics(totals, sessions) {
        metricTodayNode.textContent = formatDuration(totals.todayMs);
        metric24hNode.textContent = formatDuration(totals.last24hMs);
        alertsTodayNode.textContent = `${totals.todayAlerts} alerts`;
        alerts24hNode.textContent = `${totals.last24hAlerts} alerts`;
        metricAvgTodayNode.textContent = formatDuration(totals.avgTodayMs);
        metricAvg24hNode.textContent = `Last 24h: ${formatDuration(totals.avg24hMs)} (${totals.last24hVisits} visits)`;
        renderRecentAlerts(sessions);
    }

    function renderRecentAlerts(sessions) {
        const items = sessions
            .slice()
            .sort((a, b) => b.start - a.start)
            .slice(0, 14);

        if (!items.length) {
            recentAlertsNode.innerHTML = '<li class="shelter-empty">No matching shelter visits found for this location.</li>';
            return;
        }

        recentAlertsNode.innerHTML = items
            .map((item) => {
                const startLabel = new Date(item.start).toLocaleString();
                const endLabel = new Date(item.end).toLocaleTimeString();
                const cityLabel = item.cities.join(', ');
                const sourceLabel = item.source === 'release' ? 'Release-based' : 'Estimated';
                return `<li><strong>${startLabel} - ${endLabel}</strong><span class="visit-source">${sourceLabel}</span><br>${cityLabel}</li>`;
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
            if (Array.isArray(payload)) {
                return {
                    alertsHistory: payload,
                    instructions: []
                };
            }

            return {
                alertsHistory: payload.alertsHistory || [],
                instructions: payload.instructions || []
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    async function fetchCityDirectory() {
        if (appState.cityDirectory) return appState.cityDirectory;

        const directory = {
            byName: new Map(),
            byId: new Map(),
            cities: []
        };

        try {
            const response = await fetch(DEFAULT_CITIES_SOURCE, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`Cities HTTP ${response.status}`);
            const payload = await response.json();
            const cities = payload?.cities || {};

            Object.values(cities).forEach((city) => {
                const cityId = Number(city.id);
                if (!Number.isFinite(cityId)) return;

                const cityRecord = {
                    id: cityId,
                    he: city.he || '',
                    en: city.en || '',
                    lat: Number(city.lat),
                    lng: Number(city.lng),
                    searchNames: []
                };

                const names = [city.he, city.en, city.ru, city.ar, city.es];
                names.forEach((name) => {
                    const normalized = normalizeCity(name);
                    if (!normalized) return;
                    cityRecord.searchNames.push(String(name).trim());
                    const bucket = directory.byName.get(normalized) || new Set();
                    bucket.add(cityId);
                    directory.byName.set(normalized, bucket);
                });

                cityRecord.searchNames = [...new Set(cityRecord.searchNames.filter(Boolean))];
                directory.byId.set(cityId, cityRecord);
                directory.cities.push(cityRecord);
            });
        } catch (_error) {
            // The page can still run estimate-only if city directory fetch fails.
        }

        appState.cityDirectory = directory;
        return directory;
    }

    function flattenAlerts(alertsHistory) {
        if (!Array.isArray(alertsHistory)) return [];
        const all = [];

        alertsHistory.forEach((item) => {
            const alerts = Array.isArray(item.alerts) ? item.alerts : [];
            alerts.forEach((alert) => {
                if (alert.isDrill) return;
                if (!Array.isArray(alert.cities) || typeof alert.time !== 'number') return;
                all.push({
                    time: alert.time,
                    cities: alert.cities
                });
            });
        });

        return all;
    }

    function flattenReleaseInstructions(instructions) {
        if (!Array.isArray(instructions)) return [];

        return instructions
            .filter((instruction) =>
                instruction &&
                instruction.instructionType === 1 &&
                typeof instruction.time === 'number' &&
                Array.isArray(instruction.citiesIds) &&
                instruction.citiesIds.length
            )
            .map((instruction) => ({
                timeMs: instruction.time * 1000,
                citiesIds: instruction.citiesIds.map((cityId) => Number(cityId)).filter(Number.isFinite)
            }))
            .sort((a, b) => a.timeMs - b.timeMs);
    }

    function selectRelevantAlerts(alerts, cityCandidates, cityDirectory) {
        const normalizedCandidates = cityCandidates
            .map((city) => normalizeCity(city))
            .filter(Boolean);

        if (!normalizedCandidates.length) return [];

        return alerts
            .map((alert) => {
                const matchedCities = alert.cities.filter((city) => {
                    const normalizedAlertCity = normalizeCity(city);
                    return normalizedCandidates.some((candidate) => cityMatches(normalizedAlertCity, candidate));
                });

                if (!matchedCities.length) return null;

                const matchedCityIdsSet = new Set();
                matchedCities.forEach((cityName) => {
                    const ids = getCityIdsForName(cityName, cityDirectory);
                    ids.forEach((id) => matchedCityIdsSet.add(id));
                });

                return {
                    ...alert,
                    matchedCities,
                    matchedCityIds: [...matchedCityIdsSet]
                };
            })
            .filter(Boolean);
    }

    function getCityIdsForName(cityName, cityDirectory) {
        if (!cityDirectory || !cityDirectory.byName || cityDirectory.byName.size === 0) return [];

        const normalized = normalizeCity(cityName);
        if (!normalized) return [];

        const direct = cityDirectory.byName.get(normalized);
        if (direct && direct.size) return [...direct];

        const parts = normalized.split(/[-,\/]/).map((part) => part.trim()).filter(Boolean);
        const ids = new Set();
        parts.forEach((part) => {
            const bucket = cityDirectory.byName.get(part);
            if (!bucket) return;
            bucket.forEach((id) => ids.add(id));
        });

        return [...ids];
    }

    function inferCityFromLocation(lat, lon, geocodeCandidates, cityDirectory) {
        if (!cityDirectory || !cityDirectory.cities || !cityDirectory.cities.length) return null;

        const candidateIds = new Set();
        geocodeCandidates.forEach((candidate) => {
            getCityIdsForName(candidate, cityDirectory).forEach((id) => candidateIds.add(id));
        });

        const byNameMatches = [...candidateIds]
            .map((id) => cityDirectory.byId.get(id))
            .filter(Boolean);

        if (byNameMatches.length) {
            const nearestNamed = findNearestCity(lat, lon, byNameMatches) || byNameMatches[0];
            return {
                ...nearestNamed,
                matchMethod: 'name',
                searchNames: [nearestNamed.he, ...nearestNamed.searchNames].filter(Boolean)
            };
        }

        const nearestOverall = findNearestCity(lat, lon, cityDirectory.cities);
        if (!nearestOverall) return null;

        return {
            ...nearestOverall,
            matchMethod: 'distance',
            searchNames: [nearestOverall.he, ...nearestOverall.searchNames].filter(Boolean)
        };
    }

    function findNearestCity(lat, lon, cities) {
        let winner = null;
        let winnerDistance = Number.POSITIVE_INFINITY;

        cities.forEach((city) => {
            if (!Number.isFinite(city.lat) || !Number.isFinite(city.lng)) return;
            const distance = geoDistanceMeters(lat, lon, city.lat, city.lng);
            if (distance < winnerDistance) {
                winnerDistance = distance;
                winner = city;
            }
        });

        return winner;
    }

    function geoDistanceMeters(lat1, lon1, lat2, lon2) {
        const toRad = (degrees) => (degrees * Math.PI) / 180;
        const earthRadius = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    function buildShelterSessions(relevantAlerts, releaseInstructions, estimateOnly) {
        return relevantAlerts.map((alert) => {
            const start = alert.time * 1000;
            const fallbackEnd = start + ALERT_WINDOW_MS;

            let end = fallbackEnd;
            let source = 'estimate';

            if (!estimateOnly && alert.matchedCityIds.length) {
                const releaseTime = findMatchingReleaseTime(
                    start,
                    start + RELEASE_LOOKAHEAD_MS,
                    new Set(alert.matchedCityIds),
                    releaseInstructions
                );
                if (releaseTime !== null) {
                    end = releaseTime;
                    source = 'release';
                }
            }

            return {
                start,
                end: Math.max(end, start + MIN_SESSION_MS),
                source,
                cities: alert.matchedCities
            };
        });
    }

    function findMatchingReleaseTime(startMs, endMs, alertCityIdsSet, releaseInstructions) {
        for (let i = 0; i < releaseInstructions.length; i += 1) {
            const release = releaseInstructions[i];
            if (release.timeMs < startMs) continue;
            if (release.timeMs > endMs) break;

            const isMatch = release.citiesIds.some((cityId) => alertCityIdsSet.has(cityId));
            if (isMatch) return release.timeMs;
        }

        return null;
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
            .replace(/[\u2010-\u2015\u2212\u05BE-]+/g, ' ')
            .replace(/[(),.]/g, ' ')
            .replace(/[״"'`]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function computeShelterTotalsFromSessions(sessions) {
        const nowMs = Date.now();
        const now = new Date(nowMs);
        const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const start24hMs = nowMs - 24 * 60 * 60 * 1000;

        const today = summarizeWindow(sessions, startOfTodayMs, nowMs);
        const last24h = summarizeWindow(sessions, start24hMs, nowMs);

        return {
            todayMs: today.totalMs,
            last24hMs: last24h.totalMs,
            todayAlerts: sessions.filter((session) => session.start >= startOfTodayMs).length,
            last24hAlerts: sessions.filter((session) => session.start >= start24hMs).length,
            avgTodayMs: today.avgVisitMs,
            avg24hMs: last24h.avgVisitMs,
            todayVisits: today.visits,
            last24hVisits: last24h.visits
        };
    }

    function summarizeWindow(sessions, windowStart, windowEnd) {
        const clippedIntervals = sessions
            .map((session) => [Math.max(session.start, windowStart), Math.min(session.end, windowEnd)])
            .filter(([start, end]) => end > start)
            .sort((a, b) => a[0] - b[0]);

        if (!clippedIntervals.length) {
            return {
                totalMs: 0,
                avgVisitMs: 0,
                visits: 0
            };
        }

        const mergedIntervals = mergeIntervals(clippedIntervals);
        const totalMs = mergedIntervals.reduce((sum, [start, end]) => sum + (end - start), 0);

        return {
            totalMs,
            avgVisitMs: totalMs / mergedIntervals.length,
            visits: mergedIntervals.length
        };
    }

    function mergeIntervals(intervals) {
        if (!intervals.length) return [];
        const merged = [intervals[0].slice()];

        for (let i = 1; i < intervals.length; i += 1) {
            const [start, end] = intervals[i];
            const last = merged[merged.length - 1];
            if (start <= last[1]) {
                last[1] = Math.max(last[1], end);
            } else {
                merged.push([start, end]);
            }
        }

        return merged;
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
