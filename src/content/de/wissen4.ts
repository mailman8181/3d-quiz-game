import type { QuizQuestion } from './wissen';

/**
 * Content for grades 3–4 "Wissen" (roadmap M15c), KC Sachunterricht Ende Jg. 4
 * (docs/curriculum/niedersachsen.md §5/§8). Questions in German; `level` 1 = grade 3,
 * 2 = grade 4. Answers and distractors are short, with an emoji where it helps.
 */
const q = (
  id: string,
  question: string,
  answer: [string, string],
  distractors: [string, string][],
  explain: string,
  level: 1 | 2,
): QuizQuestion => ({
  id,
  question,
  answer: { label: answer[0], emoji: answer[1] },
  distractors: distractors.map(([label, emoji]) => ({ label, emoji })),
  explain,
  level,
});

/** Aggregatzustände: fest, flüssig, gasförmig — and what happens when it gets warm or cold. */
export const STATE_QUESTIONS: readonly QuizQuestion[] = [
  q('ice', 'Ist Eis fest, flüssig oder gasförmig?', ['fest', '🧊'], [['flüssig', '💧'], ['gasförmig', '💨']], 'Eis ist fest.', 1),
  q('water', 'Ist Wasser im Glas fest, flüssig oder gasförmig?', ['flüssig', '💧'], [['fest', '🧊'], ['gasförmig', '💨']], 'Wasser im Glas ist flüssig.', 1),
  q('steam', 'Ist Wasserdampf fest, flüssig oder gasförmig?', ['gasförmig', '💨'], [['fest', '🧊'], ['flüssig', '💧']], 'Wasserdampf ist gasförmig.', 1),
  q('stone', 'Ist ein Stein fest, flüssig oder gasförmig?', ['fest', '🪨'], [['flüssig', '💧'], ['gasförmig', '💨']], 'Ein Stein ist fest.', 1),
  q('milk', 'Ist Milch fest, flüssig oder gasförmig?', ['flüssig', '🥛'], [['fest', '🧊'], ['gasförmig', '💨']], 'Milch ist flüssig.', 1),
  q('air', 'Ist Luft fest, flüssig oder gasförmig?', ['gasförmig', '🌬️'], [['fest', '🧊'], ['flüssig', '💧']], 'Luft ist gasförmig.', 1),
  q('melt', 'Was passiert mit Eis in der warmen Sonne?', ['Es schmilzt.', '💧'], [['Es wird härter.', '🧊'], ['Es wird zu Stein.', '🪨']], 'Eis schmilzt und wird zu flüssigem Wasser.', 2),
  q('boil', 'Was passiert, wenn Wasser im Topf kocht?', ['Es verdampft.', '♨️'], [['Es gefriert.', '🧊'], ['Es wird fest.', '🪨']], 'Kochendes Wasser verdampft und wird gasförmig.', 2),
  q('freeze', 'Was passiert mit Wasser im Gefrierfach?', ['Es gefriert.', '🧊'], [['Es verdampft.', '♨️'], ['Es bleibt flüssig.', '💧']], 'Im Gefrierfach gefriert Wasser zu Eis.', 2),
  q('mirror', 'Warum beschlägt der Spiegel nach dem Duschen?', ['Wasserdampf wird wieder flüssig.', '🪞'], [['Der Spiegel schwitzt.', '😅'], ['Das Licht macht ihn nass.', '💡']], 'Der warme Wasserdampf wird am kalten Spiegel wieder zu Wassertropfen.', 2),
];

/** Natur und Technik: Wasserkreislauf, Strom, Magnet, Pflanzen, Bionik, Ebbe und Flut. */
export const SCIENCE_QUESTIONS: readonly QuizQuestion[] = [
  q('plants', 'Was brauchen Pflanzen zum Wachsen?', ['Licht und Wasser', '🌱'], [['Dunkelheit und Sand', '🌑'], ['Süßigkeiten', '🍬']], 'Pflanzen brauchen Licht, Wasser und Erde.', 1),
  q('magnet', 'Was zieht ein Magnet an?', ['einen Nagel', '🔩'], [['ein Stück Holz', '🪵'], ['ein Blatt Papier', '📄']], 'Ein Magnet zieht Dinge aus Eisen an, zum Beispiel einen Nagel.', 1),
  q('lamp', 'Wann leuchtet die Lampe im Stromkreis?', ['wenn der Stromkreis geschlossen ist', '💡'], [['wenn ein Kabel fehlt', '✂️'], ['wenn die Batterie leer ist', '🪫']], 'Die Lampe leuchtet nur, wenn der Stromkreis geschlossen ist.', 1),
  q('socket', 'Was darfst du an einer Steckdose nie tun?', ['etwas hineinstecken', '🔌'], [['das Licht anmachen', '💡'], ['den Fernseher ausschalten', '📺']], 'Steck nie etwas in eine Steckdose. Strom ist gefährlich.', 1),
  q('rain', 'Woraus entsteht Regen?', ['aus Wolken', '🌧️'], [['aus dem Wind', '🌬️'], ['aus der Sonne', '☀️']], 'Wasser verdunstet, bildet Wolken, und aus den Wolken fällt Regen.', 1),
  q('conduct', 'Was leitet Strom?', ['Metall', '🔩'], [['Holz', '🪵'], ['Gummi', '🎈']], 'Metall leitet Strom, Holz und Gummi nicht.', 2),
  q('cycle', 'Was passiert im Wasserkreislauf, nachdem Wasser verdunstet ist?', ['Es bildet Wolken.', '☁️'], [['Es wird zu Sand.', '🏖️'], ['Es verschwindet für immer.', '❌']], 'Verdunstetes Wasser bildet Wolken. Dann regnet es wieder.', 2),
  q('velcro', 'Welche Pflanze war das Vorbild für den Klettverschluss?', ['die Klette', '🌿'], [['die Rose', '🌹'], ['der Löwenzahn', '🌼']], 'Die Klette hat kleine Haken. So funktioniert auch der Klettverschluss.', 2),
  q('tide', 'Wie heißt es, wenn an der Nordsee das Wasser weggeht?', ['Ebbe', '🏖️'], [['Flut', '🌊'], ['Sturm', '🌪️']], 'Wenn das Wasser weggeht, ist Ebbe. Wenn es wiederkommt, ist Flut.', 2),
  q('burn', 'Was braucht ein Feuer zum Brennen?', ['Luft', '🌬️'], [['Wasser', '💧'], ['Eis', '🧊']], 'Ein Feuer braucht Luft. Ohne Luft geht es aus.', 2),
];

/** Deutschland und Niedersachsen (KC SU Raum: sich verorten). */
export const GERMANY_QUESTIONS: readonly QuizQuestion[] = [
  q('capital', 'Wie heißt die Hauptstadt von Deutschland?', ['Berlin', '🏛️'], [['Hannover', '🏙️'], ['Hamburg', '⚓']], 'Die Hauptstadt von Deutschland ist Berlin.', 1),
  q('state-capital', 'Wie heißt die Hauptstadt von Niedersachsen?', ['Hannover', '🏙️'], [['Berlin', '🏛️'], ['Bremen', '🎶']], 'Die Hauptstadt von Niedersachsen ist Hannover.', 1),
  q('sea', 'Welches Meer liegt im Norden von Niedersachsen?', ['die Nordsee', '🌊'], [['das Mittelmeer', '🏝️'], ['die Ostsee', '⛵']], 'Im Norden von Niedersachsen liegt die Nordsee.', 1),
  q('flag', 'Welche Farben hat die Flagge von Deutschland?', ['Schwarz, Rot, Gold', '⚫🔴🟡'], [['Blau, Weiß, Rot', '🔵⚪🔴'], ['Grün, Weiß, Rot', '🟢⚪🔴']], 'Die deutsche Flagge ist schwarz, rot und gold.', 1),
  q('harz', 'Wie heißt das Gebirge in Niedersachsen?', ['der Harz', '⛰️'], [['die Alpen', '🏔️'], ['der Schwarzwald', '🌲']], 'Das Gebirge in Niedersachsen heißt Harz.', 2),
  q('wadden', 'Wie heißt die Landschaft an der Nordsee, die bei Ebbe trocken fällt?', ['das Wattenmeer', '🦭'], [['die Wüste', '🏜️'], ['der Urwald', '🌴']], 'Das Wattenmeer fällt bei Ebbe trocken. Dort leben Seehunde.', 2),
  q('islands', 'Wie heißen die Inseln vor der Küste von Niedersachsen?', ['die Ostfriesischen Inseln', '🏝️'], [['die Kanarischen Inseln', '🌋'], ['die Osterinseln', '🗿']], 'Vor der Küste liegen die Ostfriesischen Inseln, zum Beispiel Norderney.', 2),
  q('neighbour', 'Welches Nachbarland grenzt im Westen an Niedersachsen?', ['die Niederlande', '🌷'], [['Frankreich', '🥖'], ['Polen', '🏰']], 'Im Westen grenzt Niedersachsen an die Niederlande.', 2),
];

/** Früher und heute (KC SU Zeit und Wandel: Schule und Alltag vor 100 Jahren). */
export const PAST_QUESTIONS: readonly QuizQuestion[] = [
  q('slate', 'Worauf schrieben Kinder vor 100 Jahren in der Schule?', ['auf eine Schiefertafel', '⬛'], [['auf ein Tablet', '📱'], ['auf einen Laptop', '💻']], 'Früher schrieben Kinder mit einem Griffel auf eine Schiefertafel.', 1),
  q('light', 'Womit machten die Menschen früher Licht?', ['mit Kerzen und Öllampen', '🕯️'], [['mit Glühbirnen', '💡'], ['mit dem Handy', '📱']], 'Früher gab es keinen Strom im Haus. Man nahm Kerzen und Öllampen.', 1),
  q('travel', 'Womit reisten die Menschen früher über Land?', ['mit der Pferdekutsche', '🐴'], [['mit dem Flugzeug', '✈️'], ['mit dem E-Auto', '🚗']], 'Früher reiste man mit der Pferdekutsche.', 1),
  q('laundry', 'Wie wurde Wäsche früher gewaschen?', ['mit der Hand und einem Waschbrett', '🧺'], [['in der Waschmaschine', '🫧'], ['gar nicht', '❌']], 'Früher wusch man Wäsche mit der Hand auf einem Waschbrett.', 1),
  q('phone', 'Welches Telefon ist das älteste?', ['das Telefon mit Wählscheibe', '☎️'], [['das Smartphone', '📱'], ['das Schnurlostelefon', '📞']], 'Das Telefon mit Wählscheibe ist das älteste.', 2),
  q('music', 'Womit hörte man früher Musik, bevor es Handys gab?', ['mit einem Plattenspieler', '📻'], [['mit einem Tablet', '📱'], ['mit Kopfhörern ohne Kabel', '🎧']], 'Früher hörte man Musik mit dem Plattenspieler oder dem Radio.', 2),
  q('fridge', 'Wie hielt man Essen früher kühl, als es noch keinen Kühlschrank gab?', ['im kalten Keller', '🧊'], [['in der Sonne', '☀️'], ['im Backofen', '🔥']], 'Früher lagerte man Essen im kalten Keller.', 2),
];

/** Zusammen leben (KC SU Gesellschaft: Regeln, Wahlen, Kinderrechte, Werbung, Streit lösen). */
export const TOGETHER_QUESTIONS: readonly QuizQuestion[] = [
  q('vote', 'Wie wird in der Klasse die Klassensprecherin oder der Klassensprecher bestimmt?', ['durch eine Wahl', '🗳️'], [['durch Würfeln', '🎲'], ['das größte Kind wird es', '📏']], 'In der Klasse wird gewählt. Jedes Kind hat eine Stimme.', 1),
  q('argue', 'Zwei Kinder streiten sich. Was hilft am besten?', ['in Ruhe miteinander reden', '🗣️'], [['laut schreien', '📢'], ['den anderen schubsen', '✋']], 'Bei einem Streit hilft es, in Ruhe miteinander zu reden.', 1),
  q('rules', 'Wozu gibt es Klassenregeln?', ['damit alle gut zusammen lernen können', '🤝'], [['damit die Lehrerin Spaß hat', '😄'], ['damit es langweilig ist', '😴']], 'Regeln helfen allen, gut zusammen zu lernen.', 1),
  q('rights', 'Was ist ein Kinderrecht?', ['zur Schule gehen dürfen', '🏫'], [['immer Süßigkeiten bekommen', '🍬'], ['nie aufräumen müssen', '🧸']], 'Alle Kinder haben ein Recht auf Bildung. Sie dürfen zur Schule gehen.', 2),
  q('ad', 'Was möchte Werbung meistens?', ['dass du etwas kaufst', '🛒'], [['dass du schläfst', '😴'], ['dass du Hausaufgaben machst', '📚']], 'Werbung möchte, dass Menschen etwas kaufen.', 2),
  q('mayor', 'Wer leitet eine Stadt oder eine Gemeinde?', ['die Bürgermeisterin oder der Bürgermeister', '🏛️'], [['der Bäcker', '🥖'], ['die Schulleiterin', '🏫']], 'Eine Stadt wird von der Bürgermeisterin oder dem Bürgermeister geleitet.', 2),
];

/** Sicher unterwegs, grades 3–4: Fahrrad und Verkehrsregeln (Radfahrausbildung in Klasse 4). */
export const BIKE_QUESTIONS: readonly QuizQuestion[] = [
  q('bell', 'Was muss ein verkehrssicheres Fahrrad haben?', ['Klingel, Licht und Bremsen', '🚲'], [['einen Korb', '🧺'], ['bunte Bänder', '🎀']], 'Ein verkehrssicheres Fahrrad hat Klingel, Licht, Bremsen und Reflektoren.', 1),
  q('stop', 'Was bedeutet das rote Schild mit dem Wort STOP?', ['anhalten', '🛑'], [['schneller fahren', '💨'], ['hupen', '📯']], 'Am Stoppschild musst du anhalten.', 1),
  q('left', 'Du willst mit dem Fahrrad links abbiegen. Was zeigst du an?', ['den linken Arm ausstrecken', '👈'], [['den rechten Arm ausstrecken', '👉'], ['klingeln', '🔔']], 'Vor dem Abbiegen streckst du den Arm in die Richtung aus.', 1),
  q('right-before-left', 'An einer Kreuzung ohne Schilder: Wer darf zuerst fahren?', ['wer von rechts kommt', '➡️'], [['wer von links kommt', '⬅️'], ['wer schneller ist', '🏎️']], 'Es gilt rechts vor links.', 1),
];

// ── Himmelsrichtungen ────────────────────────────────────────────────────────────────────
export const DIRECTIONS = ['north', 'east', 'south', 'west'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const DIRECTION_NAMES: Record<Direction, { name: string; short: string }> = {
  north: { name: 'Norden', short: 'N' },
  east: { name: 'Osten', short: 'O' },
  south: { name: 'Süden', short: 'S' },
  west: { name: 'Westen', short: 'W' },
};

/** Places around the school on the little map; `name` with article (nominative). */
export const MAP_PLACES: readonly { id: string; name: string; emoji: string }[] = [
  { id: 'forest', name: 'der Wald', emoji: '🌲' },
  { id: 'pool', name: 'das Schwimmbad', emoji: '🏊' },
  { id: 'church', name: 'die Kirche', emoji: '⛪' },
  { id: 'shop', name: 'der Laden', emoji: '🏪' },
  { id: 'playground', name: 'der Spielplatz', emoji: '🛝' },
  { id: 'station', name: 'der Bahnhof', emoji: '🚉' },
];

/** Körper, grades 3–4: what the organs do (KC SU Natur: Funktionen des menschlichen Körpers). */
export const BODY_QUESTIONS: readonly QuizQuestion[] = [
  q('heart', 'Was pumpt das Blut durch den Körper?', ['das Herz', '🫀'], [['die Lunge', '🫁'], ['das Gehirn', '🧠']], 'Das Herz pumpt das Blut durch den ganzen Körper.', 1),
  q('lungs', 'Womit atmest du?', ['mit der Lunge', '🫁'], [['mit dem Herz', '🫀'], ['mit den Knochen', '🦴']], 'Mit der Lunge atmest du Luft ein und aus.', 1),
  q('bones', 'Was gibt dem Körper Halt?', ['das Skelett aus Knochen', '🦴'], [['die Haare', '💇'], ['die Zunge', '👅']], 'Das Skelett aus Knochen gibt dem Körper Halt.', 1),
  q('brain', 'Womit denkst du?', ['mit dem Gehirn', '🧠'], [['mit dem Herz', '🫀'], ['mit dem Magen', '🍽️']], 'Mit dem Gehirn denkst du. Es steuert den ganzen Körper.', 1),
  q('teeth', 'Wozu brauchst du die Zähne?', ['zum Kauen', '🦷'], [['zum Hören', '👂'], ['zum Atmen', '🫁']], 'Mit den Zähnen kaust du dein Essen.', 1),
];
