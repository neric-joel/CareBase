// Anthropic Claude client utility.
// SERVER-SIDE ONLY — never import this in Client Components.

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = 'claude-sonnet-4-6';
const TIMEOUT_MS = 30_000;

export interface ClaudeOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Send a text message to Claude and return the response text.
 * Throws on timeout or API error — callers must wrap in try/catch.
 */
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: options.maxTokens ?? 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
      { signal: controller.signal }
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }
    return content.text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send an image to Claude Vision and return the response text.
 * imageBase64 should be a pure base64 string (no data URI prefix).
 * mimeType should be 'image/jpeg', 'image/png', etc.
 */
export async function callClaudeVision(
  systemPrompt: string,
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg',
  options: ClaudeOptions = {}
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: options.maxTokens ?? 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Extract the client registration information from this image and return it as JSON.',
              },
            ],
          },
        ],
      },
      { signal: controller.signal }
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude Vision');
    }
    return content.text;
  } finally {
    clearTimeout(timer);
  }
}
