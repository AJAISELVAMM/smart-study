import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { HttpError } from '../utils.js';

let client;

function getClient() {
  if (!config.geminiApiKey) {
    throw new HttpError(503, 'Gemini API key is not configured. Add GEMINI_API_KEY to server/.env and restart the API.', 'AI_NOT_CONFIGURED');
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: { timeout: 120_000 },
    });
  }
  return client;
}

function getStatus(error) {
  const value = error?.status || error?.statusCode || error?.code;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function friendlyApiError(error) {
  const status = getStatus(error);
  const message = String(error?.message || '').toLowerCase();
  if (status === 429 || message.includes('resource_exhausted') || message.includes('quota')) {
    return new HttpError(429, 'Gemini rate limit or quota reached. Wait a little, check your API quota, and try again.', 'GEMINI_QUOTA');
  }
  if ([401, 403].includes(status) || message.includes('api key not valid') || message.includes('invalid api key')) {
    return new HttpError(401, 'Gemini rejected the API key. Check server/.env and try again.', 'GEMINI_AUTH');
  }
  if (status >= 500 || message.includes('timeout') || message.includes('network') || message.includes('demand')) {
    return new HttpError(503, 'Gemini servers are currently experiencing high load. Please try again in a moment.', 'GEMINI_UNAVAILABLE');
  }
  return new HttpError(502, 'Gemini could not complete the request. Check the server log and try again.', 'GEMINI_FAILED');
}

function retryable(error) {
  const status = getStatus(error);
  const message = String(error?.message || '').toLowerCase();
  return status === 429 || status >= 500 || message.includes('timeout') || message.includes('network');
}

function getCandidateModels() {
  const primary = config.geminiModel || 'gemini-flash-latest';
  const candidates = [
    primary,
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
  ];
  return [...new Set(candidates.filter(Boolean))];
}

async function request(prompt, { schema = null, systemInstruction = '', maxOutputTokens = 2048 } = {}) {
  const ai = getClient();
  const configOptions = {
    systemInstruction,
    maxOutputTokens,
    temperature: 1,
  };
  if (schema) {
    configOptions.responseMimeType = 'application/json';
    configOptions.responseJsonSchema = schema;
  }

  const models = getCandidateModels();
  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: configOptions,
        });
        const text = typeof response?.text === 'string' ? response.text.trim() : '';
        if (!text) throw new HttpError(502, 'Gemini returned an empty response. Try clearer or shorter study material.', 'EMPTY_AI_RESPONSE');
        return text;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        lastError = error;
        const status = getStatus(error);
        const msg = String(error?.message || '').toLowerCase();
        
        // If error is high demand (503), model deprecated/not found (404), or rate limited (429), switch model immediately
        if (status === 503 || status === 404 || status === 429 || msg.includes('high demand') || msg.includes('no longer available')) {
          console.warn(`[gemini] Model '${model}' returned ${status || 'unavailable'} (${msg.slice(0, 80)}). Trying fallback model...`);
          break; // break retry loop to try next candidate model
        }

        if (attempt === 0 && retryable(error)) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }

        console.warn(`[gemini] Model '${model}' failed attempt ${attempt + 1} (${status || error?.name || 'unknown'}): ${msg.slice(0, 80)}`);
        break;
      }
    }
  }

  console.warn(`[gemini] All candidate models failed (${getStatus(lastError) || lastError?.name || 'unknown'})`);
  throw friendlyApiError(lastError);
}

export function generateStructuredContent(prompt, options) {
  return request(prompt, options);
}

export function generateTextContent(prompt, options = {}) {
  return request(prompt, { ...options, schema: null });
}
