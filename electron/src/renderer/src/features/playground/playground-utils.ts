import type { SpeechBlock } from './playground-types';

/**
 * Normalizes user-input text so that both Google AI Studio XML-style tags
 * (<laugh>, <gasp>, <pause 0.5s>) and VoiceStudio square-bracket markers
 * ([laughter], [sigh], [pause 0.5s]) are accepted interchangeably and
 * properly synthesized.
 */
export function normalizePlaygroundText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<\s*laugh\s*>/gi, '[laughter]')
    .replace(/<\s*sigh\s*>/gi, '[sigh]')
    .replace(/<\s*gasp\s*>/gi, '[pause 0.35s]')
    .replace(/<\s*pause(?:\s+(\d+(?:\.\d+)?)(?:\s*(ms|s))?)?\s*>/gi, (_match, num, unit) => {
      if (!num) return '[pause 0.5s]';
      return `[pause ${num}${unit || 's'}]`;
    })
    .replace(/<\s*(?:yawn|throat-clearing|cough|snort)\s*>/gi, '[pause 0.4s]')
    .replace(/<\s*whisper\s*>/gi, '')
    .trim();
}

/**
 * Insert an expression or token at the current caret position in a textarea.
 */
export function insertTagAtCaret(
  text: string,
  caret: number,
  tag: string,
): { text: string; nextCaret: number } {
  const safeCaret = Math.max(0, Math.min(caret, text.length));
  const before = text.slice(0, safeCaret);
  const after = text.slice(safeCaret);

  const padLeft = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
  const padRight = after.length > 0 && !/^\s/.test(after) ? ' ' : '';

  const inserted = `${padLeft}${tag}${padRight}`;
  const nextText = `${before}${inserted}${after}`;
  const nextCaret = safeCaret + inserted.length;

  return { text: nextText, nextCaret };
}

/**
 * Calculate total word count and estimated speech runtime.
 */
export function calculateDialogueStats(
  blocks: SpeechBlock[],
  interBlockPauseMs: number = 350,
): { wordCount: number; charCount: number; estimatedSeconds: number } {
  let wordCount = 0;
  let charCount = 0;

  for (const block of blocks) {
    const raw = block.text || '';
    const clean = raw.replace(/<[^>]+>|\[[^\]]+\]/g, ' ').trim();
    if (!clean) continue;
    const words = clean.split(/\s+/).filter(Boolean);
    wordCount += words.length;
    charCount += clean.length;
  }

  // Average reading speed: ~150 words per minute (2.5 words/sec), plus pauses
  const speechSec = wordCount / 2.5;
  const pauseSec = ((blocks.length - 1) * Math.max(0, interBlockPauseMs)) / 1000;
  const estimatedSeconds = Math.max(0, Math.round(speechSec + pauseSec));

  return { wordCount, charCount, estimatedSeconds };
}

export function formatSecondsClock(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
  const mm = Math.floor(safe / 60);
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

