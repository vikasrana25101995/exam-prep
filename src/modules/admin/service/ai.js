import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { GENERATION_SCHEMA, GENERATION_SYSTEM, buildGenerationPrompt } from './index';

// Returns Claude's parsed JSON ({ sections: [...] }) or throws an Error with a message safe to show admins.
export async function generateQuestions(opts) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('AI is not set up: add ANTHROPIC_API_KEY to .env.local and restart the server.');
  }
  const client = new Anthropic();

  let message;
  try {
    // Streaming so long papers don't hit HTTP timeouts; finalMessage() waits for the whole reply.
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 64000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // if Opus 5 declines, the API retries on Anthropic's recommended model
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: { type: 'json_schema', schema: GENERATION_SCHEMA } },
      system: GENERATION_SYSTEM,
      messages: [{ role: 'user', content: buildGenerationPrompt(opts) }],
    });
    message = await stream.finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error('The ANTHROPIC_API_KEY was rejected. Check the key in .env.local.');
    if (e instanceof Anthropic.RateLimitError) throw new Error('Claude is rate-limited right now. Try again in a minute.');
    if (e instanceof Anthropic.APIError) throw new Error(`Claude API error (${e.status ?? 'network'}). Try again.`);
    throw e;
  }

  if (message.stop_reason === 'refusal') throw new Error('Claude declined this request. Try different focus topics.');
  if (message.stop_reason === 'max_tokens') throw new Error('The paper was too long for one run. Ask for fewer questions per section.');
  const text = message.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude returned no questions. Try again.');
  return JSON.parse(text);
}
