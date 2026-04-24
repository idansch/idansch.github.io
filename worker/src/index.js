const DEFAULT_MODEL = 'gpt-5.4-mini';
const MAX_HISTORY_MESSAGES = 30;

export default {
    async fetch(request, env) {
        const corsHeaders = buildCorsHeaders(request);

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        const url = new URL(request.url);
        if (url.pathname !== '/chat') {
            return jsonResponse(
                {
                    errorCode: 'NOT_FOUND',
                    errorMessage: 'Use POST /chat'
                },
                404,
                corsHeaders
            );
        }

        if (request.method !== 'POST') {
            return jsonResponse(
                {
                    errorCode: 'METHOD_NOT_ALLOWED',
                    errorMessage: 'Only POST is allowed on /chat'
                },
                405,
                corsHeaders
            );
        }

        if (!env.OPENAI_API_KEY) {
            return jsonResponse(
                {
                    errorCode: 'CONFIG_MISSING_KEY',
                    errorMessage: 'OPENAI_API_KEY secret is not configured.'
                },
                500,
                corsHeaders
            );
        }

        let body;
        try {
            body = await request.json();
        } catch (_error) {
            return jsonResponse(
                {
                    errorCode: 'INVALID_JSON',
                    errorMessage: 'Request body must be valid JSON.'
                },
                400,
                corsHeaders
            );
        }

        const validationError = validateBody(body);
        if (validationError) {
            return jsonResponse(validationError, 400, corsHeaders);
        }

        const personaId = body.personaId;
        const personaProfile = body.personaProfile;
        const userMessage = body.userMessage.trim();
        const history = normalizeHistory(body.messages);

        const model = (env.OPENAI_MODEL || DEFAULT_MODEL).trim();
        const requestId = crypto.randomUUID();

        const systemPrompt = buildSystemPrompt(personaId, personaProfile);
        const input = [
            {
                role: 'system',
                content: [
                    {
                        type: 'input_text',
                        text: systemPrompt
                    }
                ]
            },
            ...history.map((message) => ({
                role: message.role,
                content: [
                    {
                        type: 'input_text',
                        text: message.content
                    }
                ]
            })),
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: userMessage
                    }
                ]
            }
        ];

        let upstreamResponse;
        try {
            upstreamResponse = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    input
                })
            });
        } catch (_error) {
            return jsonResponse(
                {
                    errorCode: 'PROVIDER_NETWORK_ERROR',
                    errorMessage: 'Failed to reach OpenAI API.',
                    requestId
                },
                502,
                corsHeaders
            );
        }

        let upstreamBody;
        try {
            upstreamBody = await upstreamResponse.json();
        } catch (_error) {
            upstreamBody = null;
        }

        if (!upstreamResponse.ok) {
            const mapped = mapProviderError(upstreamResponse.status, upstreamBody);
            const { httpStatus, ...errorPayload } = mapped;
            return jsonResponse(
                {
                    ...errorPayload,
                    requestId
                },
                httpStatus,
                corsHeaders
            );
        }

        const assistantText = extractAssistantText(upstreamBody);
        if (!assistantText) {
            return jsonResponse(
                {
                    errorCode: 'PROVIDER_EMPTY_REPLY',
                    errorMessage: 'OpenAI returned no assistant text.',
                    requestId
                },
                502,
                corsHeaders
            );
        }

        return jsonResponse(
            {
                assistantText,
                usage: upstreamBody?.usage || null,
                requestId
            },
            200,
            corsHeaders
        );
    }
};

function validateBody(body) {
    if (!body || typeof body !== 'object') {
        return {
            errorCode: 'INVALID_REQUEST',
            errorMessage: 'Body must be an object.'
        };
    }

    if (typeof body.personaId !== 'string' || !body.personaId.trim()) {
        return {
            errorCode: 'INVALID_PERSONA_ID',
            errorMessage: 'personaId must be a non-empty string.'
        };
    }

    if (!body.personaProfile || typeof body.personaProfile !== 'object') {
        return {
            errorCode: 'INVALID_PERSONA_PROFILE',
            errorMessage: 'personaProfile must be a JSON object.'
        };
    }

    if (!Array.isArray(body.messages)) {
        return {
            errorCode: 'INVALID_MESSAGES',
            errorMessage: 'messages must be an array.'
        };
    }

    if (typeof body.userMessage !== 'string' || !body.userMessage.trim()) {
        return {
            errorCode: 'INVALID_USER_MESSAGE',
            errorMessage: 'userMessage must be a non-empty string.'
        };
    }

    return null;
}

function normalizeHistory(messages) {
    return messages
        .filter(
            (message) =>
                message &&
                (message.role === 'user' || message.role === 'assistant') &&
                typeof message.content === 'string' &&
                message.content.trim()
        )
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => ({
            role: message.role,
            content: message.content.trim()
        }));
}

function buildSystemPrompt(personaId, personaProfile) {
    const profileSummary = JSON.stringify(personaProfile);

    return [
        'You are assisting with initial medical guidance for a simulated persona.',
        'Do not claim diagnosis certainty. Use cautious language.',
        'If severe red-flag symptoms are described, instruct immediate emergency evaluation.',
        'Keep answers concise and practical.',
        `Persona id: ${personaId}`,
        `Persona profile: ${profileSummary}`
    ].join('\n');
}

function extractAssistantText(responseBody) {
    if (!responseBody || typeof responseBody !== 'object') return '';

    if (typeof responseBody.output_text === 'string' && responseBody.output_text.trim()) {
        return responseBody.output_text.trim();
    }

    if (!Array.isArray(responseBody.output)) return '';

    const chunks = [];
    responseBody.output.forEach((item) => {
        if (!item || !Array.isArray(item.content)) return;
        item.content.forEach((part) => {
            if (part?.type === 'output_text' && typeof part.text === 'string') {
                chunks.push(part.text);
            }
        });
    });

    return chunks.join('\n').trim();
}

function mapProviderError(status, upstreamBody) {
    const upstreamMessage =
        upstreamBody?.error?.message ||
        upstreamBody?.message ||
        `Provider request failed with HTTP ${status}.`;

    if (status === 400) {
        return {
            errorCode: 'PROVIDER_BAD_REQUEST',
            errorMessage: upstreamMessage,
            httpStatus: 400
        };
    }

    if (status === 401 || status === 403) {
        return {
            errorCode: 'PROVIDER_AUTH_ERROR',
            errorMessage: upstreamMessage,
            httpStatus: 502
        };
    }

    if (status === 429) {
        return {
            errorCode: 'PROVIDER_RATE_LIMIT',
            errorMessage: upstreamMessage,
            httpStatus: 429
        };
    }

    if (status >= 500) {
        return {
            errorCode: 'PROVIDER_UNAVAILABLE',
            errorMessage: upstreamMessage,
            httpStatus: 503
        };
    }

    return {
        errorCode: 'PROVIDER_ERROR',
        errorMessage: upstreamMessage,
        httpStatus: 502
    };
}

function buildCorsHeaders(request) {
    const requestOrigin = request.headers.get('Origin') || '*';

    return {
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
    };
}

function jsonResponse(payload, status, corsHeaders) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders
        }
    });
}
