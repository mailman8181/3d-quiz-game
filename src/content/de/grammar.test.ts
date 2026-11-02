import { describe, expect, it } from 'vitest';
import { CONSONANT_GROUPS, GAP_SENTENCES, GAP_WORDS, groupAt, NOUNS, PLURAL_NOUNS, RIDDLES, VOWEL_GROUPS, wrongPlurals } from './grammar';
import { WORDS } from './words';

describe('German grammar content (M13d)', () => {
  it('every word-bank noun has a gender (Nudeln is plural-only)', () => {
    expect(NOUNS.length).toBe(WORDS.filter((w) => w.word !== 'Nudeln').length);
  });

  it('wrong plurals are never the right one and there are enough of them', () => {
    for (const n of PLURAL_NOUNS) {
      const wrong = wrongPlurals(n);
      expect(wrong, n.word).not.toContain(n.plural);
      expect(wrong.length, n.word).toBeGreaterThanOrEqual(3);
    }
  });

  it('a missing-letter distractor never spells another word-bank noun', () => {
    const nouns = new Set(NOUNS.map((n) => n.word.toLowerCase()));
    for (const g of GAP_WORDS) {
      const family: readonly string[] = g.vowel ? VOWEL_GROUPS : CONSONANT_GROUPS;
      for (const d of family.filter((x) => x !== g.group)) {
        const w = g.word.word;
        const alt = `${w.slice(0, g.index)}${groupAt(d, g.index)}${w.slice(g.index + g.group.length)}`.toLowerCase();
        expect(nouns.has(alt), `${w} → ${alt}`).toBe(false);
      }
    }
  });

  it('riddle answers are word-bank nouns; gap sentences have one gap', () => {
    for (const r of RIDDLES) expect(NOUNS.some((n) => n.word === r.answer), r.id).toBe(true);
    for (const s of GAP_SENTENCES) expect(s.text.split('___')).toHaveLength(2);
  });
});
