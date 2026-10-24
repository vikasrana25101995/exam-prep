import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { EXAMS, STAGES } from '@/constants';
import { GENERATION_SCHEMA, GENERATION_SYSTEM, buildGenerationPrompt } from './index';

// One structured-output call. Returns Claude's parsed JSON ({ sections: [...] }) or throws an
// Error with a message safe to show admins.
async function askForQuestions({ system, content, maxTokens, tooLong }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('AI is not set up: add ANTHROPIC_API_KEY to .env.local (or your host’s environment) and restart the server.');
  }
  const client = new Anthropic();

  let message;
  try {
    // Streaming so long papers don't hit HTTP timeouts; finalMessage() waits for the whole reply.
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5',
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // if Opus 5 declines, the API retries on Anthropic's recommended model
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: { type: 'json_schema', schema: GENERATION_SCHEMA } },
      system,
      messages: [{ role: 'user', content }],
    });
    message = await stream.finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error('The ANTHROPIC_API_KEY was rejected. Check the key.');
    if (e instanceof Anthropic.RateLimitError) throw new Error('Claude is rate-limited right now. Try again in a minute.');
    if (e instanceof Anthropic.BadRequestError) throw new Error(`Claude couldn't read this request: ${e.message}`);
    if (e instanceof Anthropic.APIError) throw new Error(`Claude API error (${e.status ?? 'network'}). Try again.`);
    throw e;
  }

  if (message.stop_reason === 'refusal') throw new Error('Claude declined this request.');
  if (message.stop_reason === 'max_tokens') throw new Error(tooLong);
  const text = message.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Claude returned no questions. Try again.');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Claude returned malformed JSON. Try again.');
  }
}

export function generateQuestions(opts) {
  return askForQuestions({
    system: GENERATION_SYSTEM,
    content: buildGenerationPrompt(opts),
    maxTokens: 64000,
    tooLong: 'The paper was too long for one run. Ask for fewer questions per section.',
  });
}

const PDF_SYSTEM = `You convert exam question papers (PDF) into structured multiple-choice questions.
Copy each question and its options faithfully; fix only obvious OCR breaks. Keep any passage, table or data the question needs inside its text (repeat a shared passage for each question that uses it).
If the paper includes an answer key, use it. Otherwise solve each question carefully and mark the correct option.
Skip questions that cannot be answered without a picture that is not described in text. Skip instructions, headers and solutions.
Give every question a short syllabus topic.`;

// sections: the exam's usual section names, so Claude files questions under names the app already uses.
export function extractPdfQuestions(bytes, { exam, stage, sections }) {
  const examLabel = `${EXAMS.find((e) => e.id === exam)?.name ?? exam} ${STAGES.find((s) => s.id === stage)?.name ?? stage}`;
  return askForQuestions({
    system: PDF_SYSTEM,
    content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(bytes).toString('base64') } },
      {
        type: 'text',
        text: [
          `This is a ${examLabel} paper. Extract every multiple-choice question.`,
          sections.length ? `Group questions into these sections where they fit (use the names exactly): ${sections.join(', ')}. Use another short name only if a question fits none.` : 'Group questions by the section headings in the paper.',
          'Use up to 5 options per question, in the order printed, without letter prefixes.',
        ].join('\n'),
      },
    ],
    maxTokens: 128000,
    tooLong: 'This PDF has too many questions for one run. Split it into smaller PDFs.',
  });
}
