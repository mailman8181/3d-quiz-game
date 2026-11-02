import type { StageId } from '../../core/learner/stage';

/**
 * Curriculum competencies for Niedersachsen (ADR-0009), referenced by challenge levels
 * (`LevelInfo.competencies`). Research and wording: docs/curriculum/niedersachsen.md; the
 * documents themselves: docs/curriculum/sources/ (`source` = id in sources.json).
 *
 * Id scheme: `ni.<framework><end stage>.<topic>`:
 *   op  = Orientierungsplan (Kita), a2 = KC Deutsch 2024 annex A2 (preschool / school start),
 *   ma2 / de2 / su2 = KC Mathematik / Deutsch / Sachunterricht, competences at the end of Jg. 2.
 * `text` is shown to parents (German, condensed KC wording).
 */
export interface Competency {
  id: string;
  source: string;
  /** Stage by whose end the competence is expected. */
  until: StageId;
  subject: 'math' | 'german' | 'knowledge';
  text: string;
}

const OP = 'ni-orientierungsplan-2023';
const A2 = 'ni-kc-deutsch-gs-2024-arbeitsfassung';
const MA = 'ni-kc-mathematik-gs-2017';
const MA24 = 'ni-kc-mathematik-gs-2024-anhoerfassung';
const DE = 'ni-kc-deutsch-gs-2017';
const SU = 'ni-kc-sachunterricht-gs-2017';

const list: Competency[] = [
  // Orientierungsplan, Lernbereich 6 "Mathematisches Grundverständnis"
  { id: 'ni.op.mengen', source: OP, until: 'preschool', subject: 'math', text: 'Mengen erfassen und vergleichen (mehr – weniger)' },
  { id: 'ni.op.zaehlen', source: OP, until: 'preschool', subject: 'math', text: 'Zählen anbahnen, Zahlsymbole erkennen' },
  { id: 'ni.op.hinzufuegen', source: OP, until: 'preschool', subject: 'math', text: 'Hinzufügen und Wegnehmen' },
  { id: 'ni.op.sortieren', source: OP, until: 'preschool', subject: 'math', text: 'Sortieren, Klassifizieren, Muster' },
  { id: 'ni.op.groessen', source: OP, until: 'preschool', subject: 'math', text: 'Größen vergleichen (groß – klein, hoch)' },
  { id: 'ni.op.raumlage', source: OP, until: 'preschool', subject: 'math', text: 'Raum-Lage-Beziehungen erkennen und bezeichnen (oben – unten)' },
  { id: 'ni.op.formen', source: OP, until: 'preschool', subject: 'math', text: 'Formen und Körper kennenlernen' },
  // Orientierungsplan, Lernbereich 8 "Natur und Lebenswelt" + Zeit (Lernbereich 6)
  { id: 'ni.op.natur', source: OP, until: 'preschool', subject: 'knowledge', text: 'Natur als Lebensraum von Pflanzen und Tieren' },
  { id: 'ni.op.zeit', source: OP, until: 'preschool', subject: 'knowledge', text: 'Zeit im eigenen Alltag erleben (Tag, Jahreszeiten)' },
  // Orientierungsplan, Lernbereich 4 "Sprache und Sprechen"
  { id: 'ni.op.wortschatz', source: OP, until: 'preschool', subject: 'german', text: 'Aktiven und passiven Wortschatz erweitern' },
  // KC Deutsch 2024, Anhang A2 "Vorschulischer Bereich und Anfangsunterricht"
  { id: 'ni.a2.reime', source: A2, until: 'grade1', subject: 'german', text: 'Reime erkennen und beherrschen' },
  { id: 'ni.a2.silben', source: A2, until: 'grade1', subject: 'german', text: 'Wörter in Silben unterteilen' },
  { id: 'ni.a2.anlaut', source: A2, until: 'grade1', subject: 'german', text: 'An- und Endlaute hören und vergleichen' },
  { id: 'ni.a2.laut-buchstabe', source: A2, until: 'grade1', subject: 'german', text: 'Einem Laut einen Buchstaben zuordnen' },
  { id: 'ni.a2.serialitaet', source: A2, until: 'grade1', subject: 'math', text: 'Muster fortsetzen (Serialität)' },
  // KC Mathematik 2017, Ende Schuljahrgang 2
  { id: 'ni.ma2.zahlen-100', source: MA, until: 'grade2', subject: 'math', text: 'Zahlen bis 100 sprechen, lesen und schreiben' },
  { id: 'ni.ma2.vergleichen', source: MA, until: 'grade2', subject: 'math', text: 'Zahlen ordnen und vergleichen (kleiner/größer)' },
  { id: 'ni.ma2.strukturiert', source: MA, until: 'grade2', subject: 'math', text: 'Strukturierte Zahldarstellungen verstehen und nutzen' },
  { id: 'ni.ma2.addition', source: MA, until: 'grade2', subject: 'math', text: 'Additionsaufgaben lösen' },
  { id: 'ni.ma2.subtraktion', source: MA, until: 'grade2', subject: 'math', text: 'Subtraktionsaufgaben lösen' },
  { id: 'ni.ma2.einspluseins', source: MA, until: 'grade2', subject: 'math', text: 'Aufgaben des kleinen 1+1 automatisiert wiedergeben' },
  { id: 'ni.ma2.muster', source: MA, until: 'grade2', subject: 'math', text: 'Muster erkennen, beschreiben und fortsetzen' },
  { id: 'ni.ma2.addition-100', source: MA, until: 'grade2', subject: 'math', text: 'Addition bis 100 mündlich und halbschriftlich' },
  { id: 'ni.ma2.subtraktion-100', source: MA, until: 'grade2', subject: 'math', text: 'Subtraktion bis 100 mündlich und halbschriftlich' },
  { id: 'ni.ma2.zerlegen', source: MA, until: 'grade2', subject: 'math', text: 'Zahlen zerlegen; Zahlzerlegungen bis 10 auswendig' },
  { id: 'ni.ma2.doppelt-haelfte', source: MA, until: 'grade2', subject: 'math', text: 'Zahlen in Beziehung setzen (die Hälfte/das Doppelte)' },
  { id: 'ni.ma2.stellenwert', source: MA, until: 'grade2', subject: 'math', text: 'Zahlen im Zehnersystem darstellen (Bündeln, Stellenwert)' },
  { id: 'ni.ma2.gerade', source: MA24, until: 'grade2', subject: 'math', text: 'Gerade und ungerade Zahlen erkennen' },
  { id: 'ni.ma2.mal', source: MA, until: 'grade2', subject: 'math', text: 'Multiplikation als wiederholtes Hinzufügen gleicher Anzahlen' },
  { id: 'ni.ma2.einmaleins', source: MA, until: 'grade2', subject: 'math', text: 'Kernaufgaben des kleinen 1×1 automatisiert wiedergeben' },
  { id: 'ni.ma2.geld', source: MA, until: 'grade2', subject: 'math', text: 'Geldbeträge erfassen, darstellen und vergleichen (€, ct)' },
  { id: 'ni.ma2.uhr', source: MA, until: 'grade2', subject: 'math', text: 'Uhrzeiten ablesen (volle Stunde, halb, viertel nach/vor)' },
  { id: 'ni.ma2.symmetrie', source: MA, until: 'grade2', subject: 'math', text: 'Achsensymmetrie untersuchen, symmetrische Muster erstellen' },
  { id: 'ni.ma2.zufall', source: MA, until: 'grade2', subject: 'math', text: 'Eintrittswahrscheinlichkeit einschätzen (sicher, möglich, unmöglich)' },
  { id: 'ni.ma2.groessen', source: MA, until: 'grade2', subject: 'math', text: 'Größen vergleichen und ordnen' },
  { id: 'ni.ma2.raumlage', source: MA, until: 'grade2', subject: 'math', text: 'Lagebeziehungen beschreiben (über, unter, neben, zwischen)' },
  // KC Deutsch 2017, Ende Schuljahrgang 2
  { id: 'ni.de2.silben', source: DE, until: 'grade2', subject: 'german', text: 'Wörter in Silben gliedern' },
  { id: 'ni.de2.laut-buchstabe', source: DE, until: 'grade2', subject: 'german', text: 'Laute und Buchstaben unterscheiden und zuordnen' },
  { id: 'ni.de2.lesen', source: DE, until: 'grade2', subject: 'german', text: 'Wörter erlesen (Syntheseprinzip, Sichtwortschatz)' },
  { id: 'ni.de2.wortarten', source: DE, until: 'grade2', subject: 'german', text: 'Nomen, Verben und Adjektive erkennen; Einzahl/Mehrzahl, Artikel' },
  { id: 'ni.de2.rechtschreiben', source: DE, until: 'grade2', subject: 'german', text: 'Besondere Buchstabenfolgen kennen (ch, sch, ng, nk, au, ei, eu, ie …)' },
  { id: 'ni.de2.lesen-saetze', source: DE, until: 'grade2', subject: 'german', text: 'Sätze und kurze Texte sinnverstehend lesen' },
  { id: 'ni.de2.satzzeichen', source: DE, until: 'grade2', subject: 'german', text: 'Satzschlusszeichen setzen' },
  { id: 'ni.de2.alphabet', source: DE, until: 'grade2', subject: 'german', text: 'Das Alphabet kennen und Wörter danach ordnen' },
  { id: 'ni.de2.wortbildung', source: DE, until: 'grade2', subject: 'german', text: 'Zusammengesetzte Nomen bilden' },
  { id: 'ni.de2.wortschatz', source: DE, until: 'grade2', subject: 'german', text: 'Einen angemessenen Wortschatz verwenden' },
  { id: 'ni.de2.woerter-ordnen', source: DE, until: 'grade2', subject: 'german', text: 'Wörter sammeln und ordnen (Oberbegriffe)' },
  // KC Sachunterricht 2017, Ende Schuljahrgang 2
  { id: 'ni.su2.tiere', source: SU, until: 'grade2', subject: 'knowledge', text: 'Typische Tiere und ihre Entwicklung kennen' },
  { id: 'ni.su2.zeit', source: SU, until: 'grade2', subject: 'knowledge', text: 'Zyklische Prozesse in der Zeit (Jahreszeiten)' },
  { id: 'ni.su2.mensch', source: SU, until: 'grade2', subject: 'knowledge', text: 'Körperteile benennen, Sinne und ihre Leistungen' },
  { id: 'ni.su2.lebensraeume', source: SU, until: 'grade2', subject: 'knowledge', text: 'Lebensräume erkunden, typische Tiere bestimmen' },
  { id: 'ni.su2.lineare-zeit', source: SU, until: 'grade2', subject: 'knowledge', text: 'Lineare Prozesse in der Zeit darstellen (Kindheit, Wachsen)' },
  { id: 'ni.su2.natur', source: SU, until: 'grade2', subject: 'knowledge', text: 'Einfache Naturphänomene (Wind, Wetter)' },
];

export const COMPETENCIES_DE_NI: Readonly<Record<string, Competency>> = Object.fromEntries(list.map((c) => [c.id, c]));
