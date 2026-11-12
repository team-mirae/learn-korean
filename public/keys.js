// Learn Korean: a drill's keys as key presses, and back. One character per key, by its JIS legend
// (the letters, digits and symbols of a JIS keyboard; the letters and ; - sit in the same place on
// US and ISO boards); an uppercase letter, or ⇧ before a key, is ⇧ + that key.

const JIS = {
  "1": "Digit1", "2": "Digit2", "3": "Digit3", "4": "Digit4", "5": "Digit5", "6": "Digit6", "7": "Digit7",
  "8": "Digit8", "9": "Digit9", "0": "Digit0", "-": "Minus", "^": "Equal", "¥": "IntlYen",
  "@": "BracketLeft", "[": "BracketRight", ";": "Semicolon", ":": "Quote", "]": "Backslash",
  ",": "Comma", ".": "Period", "/": "Slash", "\\": "IntlRo",
};
const LEGEND = Object.fromEntries(Object.entries(JIS).map(([k, v]) => [v, k]));

/** A key's code and Shift: "a" → KeyA, "A" → ⇧KeyA, ";" → Semicolon. */
export function keyOf(ch) {
  if (JIS[ch]) return { code: JIS[ch], shift: false };
  if (/^[a-zA-Z]$/.test(ch)) return { code: "Key" + ch.toUpperCase(), shift: ch !== ch.toLowerCase() };
  return null;
}

/** "dh⇧k" → [{code, shift, label}], one per key press. Throws on a character that's no key. */
export function tokens(keys) {
  const out = [];
  let shift = false;
  for (const ch of keys) {
    if (ch === "⇧") { shift = true; continue; }
    const k = keyOf(ch);
    if (!k) throw new Error(`"${ch}" is not a key`);
    out.push({ code: k.code, shift: shift || k.shift, label: legend(k.code) });
    shift = false;
  }
  return out;
}

/** The JIS legend of a key code: KeyA → A, Semicolon → ;. */
export function legend(code) {
  return LEGEND[code] ?? (code.startsWith("Key") ? code.slice(3) : code);
}

/** How a drill shows its keys: bada roman and 2-set as typed (dhk), bada and bada plain as legends (D H ⇧K). */
export function showKeys(keys, layout) {
  if (layout !== 13 && layout !== 16) return keys;
  return tokens(keys).map(t => (t.shift ? "⇧" : "") + t.label).join(" ");
}

// bada plain's jamo keys beyond the letters and ; (its number row is punctuation).
const PLAIN_EDGE = new Set(["Quote", "BracketLeft", "BracketRight", "Backslash", "Comma", "Period", "Slash", "IntlRo"]);

/** The keys the drill takes from the keyboard for a layout: letters, ; and - ; for bada every key;
 * for bada plain its jamo keys. */
export function isDrillKey(code, layout) {
  if (layout === 16) return /^Key[A-Z]$/.test(code) || code === "Semicolon" || PLAIN_EDGE.has(code);
  if (/^Key[A-Z]$/.test(code) || code === "Semicolon" || code === "Minus") return true;
  return layout === 13 && code in LEGEND;
}
