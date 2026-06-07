import { fetch } from 'expo/fetch';
import type { Agent, Message, Model, Provider } from '@/types';
import { logger } from './logger';

export interface StreamParams {
  conversationId: string;
  messages: Pick<Message, 'role' | 'content'>[];
  agent: Agent;
  model: Model;
  provider: Provider;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

function parseApiError(status: number, body: string): string {
  const codes: Record<number, string> = {
    401: 'Invalid API key. Check your provider settings.',
    403: 'Access denied. Your key may lack permissions.',
    429: 'Rate limit hit. Please wait a moment and try again.',
    500: 'Provider server error. Try again shortly.',
  };
  if (codes[status]) return codes[status];
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message ?? `API error ${status}`;
  } catch {
    return `API error ${status}`;
  }
}

async function streamAnthropic(params: StreamParams): Promise<string> {
  const { agent, model, provider, onChunk, signal } = params;
  const systemMessages = params.messages.filter(m => m.role === 'system');
  const chatMessages = params.messages.filter(m => m.role !== 'system');

  const baseUrl = provider.baseUrl ?? 'https://api.anthropic.com';
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model.modelId,
      max_tokens: agent.maxTokens,
      stream: true,
      messages: chatMessages,
      system: systemMessages[0]?.content || agent.systemPrompt || undefined,
    }),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(parseApiError(res.status, errBody));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream from Anthropic');
  const decoder = new TextDecoder();
  let responseText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          responseText += parsed.delta.text;
          onChunk(responseText);
        }
      } catch { /* ignore parse errors on SSE lines */ }
    }
  }

  logger.debug('Anthropic stream complete', { chars: responseText.length });
  return responseText;
}

async function streamOpenAICompat(params: StreamParams): Promise<string> {
  const { agent, model, provider, messages, onChunk, signal } = params;

  const baseUrl = provider.baseUrl ?? (
    provider.type === 'gemini'
      ? 'https://generativelanguage.googleapis.com/v1beta/openai'
      : 'https://api.openai.com/v1'
  );

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: model.modelId,
      messages,
      stream: true,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    }),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(parseApiError(res.status, errBody));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream from API');
  const decoder = new TextDecoder();
  let responseText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]' || !data) continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          responseText += delta;
          onChunk(responseText);
        }
      } catch { /* ignore parse errors on SSE lines */ }
    }
  }

  logger.debug('OpenAI-compat stream complete', { chars: responseText.length });
  return responseText;
}

export async function streamMessage(params: StreamParams): Promise<string> {
  logger.info('Streaming message', {
    provider: params.provider.type,
    model: params.model.modelId,
  });

  try {
    if (params.provider.type === 'anthropic') {
      return await streamAnthropic(params);
    }
    return await streamOpenAICompat(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('AI stream failed', { message });
    throw err;
  }
}

export function buildMessages(
  conversationMessages: Message[],
  newContent: string,
  agent: Agent,
): Pick<Message, 'role' | 'content'>[] {
  const history = conversationMessages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const result: Pick<Message, 'role' | 'content'>[] = [];
  if (agent.systemPrompt) {
    result.push({ role: 'system', content: agent.systemPrompt });
  }
  result.push(...history);
  result.push({ role: 'user', content: newContent });
  return result;
}
