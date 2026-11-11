// Learn Korean: the on-screen keyboards, in key units (1u = one letter key). Each key:
// [code, x, y, w, label]; "ENTER" is drawn ISO-shaped where the board has one. bada roman and 2-set
// let the learner pick US (ANSI), ISO or JIS; bada is JIS only (its keys cover the whole JIS board).
import { legend } from "./keys.js";

const row = (y, x0, keys) => { let x = x0; return keys.map(([c, w = 1, label]) => { const k = [c, x, y, w, label]; x += w; return k; }); };
const codes = s => s.split(" ").map(c => [c]);
const LETTERS_Q = codes("KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP");
const LETTERS_A = codes("KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL");
const LETTERS_Z = codes("KeyZ KeyX KeyC KeyV KeyB KeyN KeyM");
const DIGITS = codes("Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0");
const BOTTOM = [["ControlLeft", 1.5, "control"], ["AltLeft", 1.25, "option"], ["MetaLeft", 1.5, "command"], ["Space", 6.5, ""],
  ["MetaRight", 1.5, "command"], ["AltRight", 1.25, "option"], ["ArrowLeft", 1.5, "←"]];
const US = { Backquote: "`", Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\",
  Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", IntlBackslash: "§" };

export const BOARDS = {
  ansi: {
    name: "US (ANSI)", width: 15, legend: c => US[c] ?? legend(c),
    keys: [
      ...row(0, 0, [["Backquote"], ...DIGITS, ["Minus"], ["Equal"], ["Backspace", 2, "delete"]]),
      ...row(1, 0, [["Tab", 1.5, "tab"], ...LETTERS_Q, ["BracketLeft"], ["BracketRight"], ["Backslash", 1.5]]),
      ...row(2, 0, [["CapsLock", 1.75, "caps lock"], ...LETTERS_A, ["Semicolon"], ["Quote"], ["Enter", 2.25, "return"]]),
      ...row(3, 0, [["ShiftLeft", 2.25, "shift"], ...LETTERS_Z, ["Comma"], ["Period"], ["Slash"], ["ShiftRight", 2.75, "shift"]]),
      ...row(4, 0, BOTTOM),
    ],
  },
  iso: {
    name: "ISO", width: 15, legend: c => US[c] ?? legend(c), enter: { top: 13.5, bottom: 13.75 },
    keys: [
      ...row(0, 0, [["Backquote"], ...DIGITS, ["Minus"], ["Equal"], ["Backspace", 2, "delete"]]),
      ...row(1, 0, [["Tab", 1.5, "tab"], ...LETTERS_Q, ["BracketLeft"], ["BracketRight"]]),
      ...row(2, 0, [["CapsLock", 1.75, "caps lock"], ...LETTERS_A, ["Semicolon"], ["Quote"], ["Backslash"]]),
      ...row(3, 0, [["ShiftLeft", 1.25, "shift"], ["IntlBackslash"], ...LETTERS_Z, ["Comma"], ["Period"], ["Slash"], ["ShiftRight", 2.75, "shift"]]),
      ...row(4, 0, BOTTOM),
      ["Enter", 13.5, 1, 1.5, "return"],
    ],
  },
  // Apple-style JIS (as bada ime's tools/render/keyboards.js draws it), 14.5u.
  jis: {
    name: "JIS", width: 14.5, legend, enter: { top: 13, bottom: 13.25 },
    keys: [
      ...row(0, 0, [["Digit1", 1.5], ...DIGITS.slice(1), ["Minus"], ["Equal"], ["IntlYen"], ["Backspace", 1, "delete"]]),
      ...row(1, 0, [["Tab", 1, "tab"], ...LETTERS_Q, ["BracketLeft"], ["BracketRight"]]),
      ...row(2, 0, [["ControlLeft", 1.25, "control"], ...LETTERS_A, ["Semicolon"], ["Quote"], ["Backslash"]]),
      ...row(3, 0, [["ShiftLeft", 1.75, "shift"], ...LETTERS_Z, ["Comma"], ["Period"], ["Slash"], ["IntlRo"], ["ShiftRight", 1.75, "shift"]]),
      ...row(4, 0, [["CapsLock", 1, "caps"], ["AltLeft", 1, "⌥"], ["MetaLeft", 1, "⌘"], ["Lang2", 1, "英数"], ["Space", 5.5, ""],
        ["Lang1", 1, "かな"], ["MetaRight", 1, "⌘"], ["ArrowLeft", 1, "←"], ["ArrowDown", 1, "↓"], ["ArrowRight", 1, "→"]]),
      ["Enter", 13, 1, 1.5, "return"],
    ],
  },
};

/** A board for a learner who hasn't picked one: JIS in Japan, ISO in most of Europe, else US. */
export function guessBoard() {
  const lang = (navigator.language || "en-US").toLowerCase();
  if (lang.startsWith("ja")) return "jis";
  if (/^(en-(gb|ie)|de|fr|es|it|pt-pt|nl|sv|da|nb|no|fi|pl|cs|hu)/.test(lang)) return "iso";
  return "ansi";
}

// bada's legends per key: [unshifted, ⇧, interlaced final], each "jamo:role" (i initial, c initial
// or final, f final only, v vowel). From bada-ime docs/layouts/13-bada.json.
export const BADA_KEYS = {
  Digit1: ["ㅒ:v"], Digit2: ["ㅆ:c"], Digit3: ["ㅉ:i"], Digit4: ["ㄲ:c"], Digit5: ["ㄸ:i"], Digit6: ["ㅟ:v"], Digit7: ["ㅝ:v"],
  Digit8: ["ㅠ:v"], Digit9: ["ㅛ:v"], Digit0: ["ㅘ:v"], Minus: ["ㅙ:v"], Equal: ["ㅞ:v"], IntlYen: ["ㅂ:f", "ㄼ:f"],
  KeyQ: ["ㅃ:i"], KeyW: ["ㅌ:c"], KeyE: ["ㄴ:c"], KeyR: ["ㅅ:c"], KeyT: ["ㅍ:c"], KeyY: ["ㅚ:v"], KeyU: ["ㅕ:v"],
  KeyI: ["ㅑ:v"], KeyO: ["ㅔ:v"], KeyP: ["ㅐ:v"], BracketLeft: ["ㅖ:v"], BracketRight: ["ㅒ:v"],
  KeyA: ["ㄷ:c"], KeyS: ["ㅈ:c"], KeyD: ["ㄱ:c"], KeyF: ["ㅇ:i"], KeyG: ["ㅁ:c"], KeyH: ["ㅏ:v"], KeyJ: ["ㅇ:f", "ㅁ:f"],
  KeyK: ["ㄴ:f", "ㄶ:f"], KeyL: ["ㄹ:f", "ㄺ:f"], Semicolon: ["ㄱ:f", "ㄲ:f"], Quote: ["ㅆ:c"], Backslash: ["ㅃ:i", null, "ㅄ:f"],
  KeyZ: ["ㅊ:c"], KeyX: ["ㅋ:c"], KeyC: ["ㄹ:c"], KeyV: ["ㅎ:c"], KeyB: ["ㅂ:c"], KeyN: ["ㅓ:v"], KeyM: ["ㅣ:v"],
  Comma: ["ㅡ:v"], Period: ["ㅗ:v"], Slash: ["ㅜ:v"], IntlRo: ["ㅢ:v"],
};
