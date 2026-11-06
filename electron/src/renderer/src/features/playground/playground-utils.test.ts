import { describe, expect, it } from 'vitest';
import {
  normalizePlaygroundText,
  insertTagAtCaret,
  calculateDialogueStats,
  formatSecondsClock,
} from './playground-utils';

describe('playground-utils', () => {
  it('normalizes Google AI Studio tags to VoiceStudio compatible markers', () => {
    expect(normalizePlaygroundText("<gasp> That's a great idea! <laugh>")).toBe(
      "[pause 0.35s] That's a great idea! [laughter]",
    );
    expect(normalizePlaygroundText('Hello <pause 1.5s> world')).toBe(
      'Hello [pause 1.5s] world',
    );
    expect(normalizePlaygroundText('Take a breath <pause> and continue')).toBe(
      'Take a breath [pause 0.5s] and continue',
    );
    expect(normalizePlaygroundText('Tired now <yawn> <sigh>')).toBe(
      'Tired now [pause 0.4s] [sigh]',
    );
  });

  it('preserves native bracket tags untouched', () => {
    expect(normalizePlaygroundText('Great work [laughter] [pause 0.8s]')).toBe(
      'Great work [laughter] [pause 0.8s]',
    );
  });

  it('inserts tag at caret with proper padding', () => {
    const res = insertTagAtCaret('Hello world', 5, '<laugh>');
    expect(res.text).toBe('Hello <laugh> world');
    expect(res.nextCaret).toBe(14);
  });

  it('calculates stats and formats clock', () => {
    const stats = calculateDialogueStats([
      { id: '1', speakerId: 's1', style: 'natural', speed: 1, text: 'This is a test sentence with seven words.' },
      { id: '2', speakerId: 's2', style: 'natural', speed: 1, text: 'And another five words here.' },
    ]);
    expect(stats.wordCount).toBe(13);
    expect(stats.estimatedSeconds).toBeGreaterThan(0);
    expect(formatSecondsClock(65)).toBe('1:05');
  });
});

