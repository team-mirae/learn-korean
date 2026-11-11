// Learn Korean (index.html): the tracks, levels, lessons, drills and the anthem. Data only, no DOM,
// so test/learn.mjs can type every drill through the engine and check what it gives.
//
// The learner picks a track: the Korean layout they aim for (bada roman, 2-set or bada), and learns
// it by typing it from the first lesson. A drill item: `ko` (what to type), `rr` (the standard
// romanization: Revised Romanization, as it's said) and `keys` (what to press, as keys.js reads it:
// one character per key, JIS legends; an uppercase letter or ⇧ before a key is ⇧ + that key). Each
// item's keys give `ko` as the top reading (the test checks).

// ── 2-set (KTS, layout 10): which keys type a syllable ──────────────────────────────────────────

const INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const VOWELS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
export const TWO_SET = {
  ㅂ: "q", ㅈ: "w", ㄷ: "e", ㄱ: "r", ㅅ: "t", ㅛ: "y", ㅕ: "u", ㅑ: "i", ㅐ: "o", ㅔ: "p",
  ㅁ: "a", ㄴ: "s", ㅇ: "d", ㄹ: "f", ㅎ: "g", ㅗ: "h", ㅓ: "j", ㅏ: "k", ㅣ: "l",
  ㅋ: "z", ㅌ: "x", ㅊ: "c", ㅍ: "v", ㅠ: "b", ㅜ: "n", ㅡ: "m",
  ㅃ: "Q", ㅉ: "W", ㄸ: "E", ㄲ: "R", ㅆ: "T", ㅒ: "O", ㅖ: "P",
  // two keys each
  ㅘ: "hk", ㅙ: "ho", ㅚ: "hl", ㅝ: "nj", ㅞ: "np", ㅟ: "nl", ㅢ: "ml",
  ㄳ: "rt", ㄵ: "sw", ㄶ: "sg", ㄺ: "fr", ㄻ: "fa", ㄼ: "fq", ㄽ: "ft", ㄾ: "fx", ㄿ: "fv", ㅀ: "fg", ㅄ: "qt",
};

/** The 2-set keys for Korean text: 한국 → gksrnr. */
export function twoSet(text) {
  let out = "";
  for (const ch of text) {
    const n = ch.codePointAt(0) - 0xac00;
    if (n < 0 || n > 11171) { out += TWO_SET[ch] ?? ch; continue; }
    out += TWO_SET[INITIALS[Math.floor(n / 588)]] + TWO_SET[VOWELS[Math.floor((n % 588) / 28)]] + (TWO_SET[FINALS[n % 28]] ?? "");
  }
  return out;
}

// ── bada (layout 13): which keys type a syllable ────────────────────────────────────────────────
// docs/bada-layout.md in bada-ime. Keys are JIS legends; ⇧ before a key is ⇧ + that key. A final
// ㅇ ㄴ ㄹ ㄱ takes its final-only key (J K L ;), as the layout's own examples do; others their
// initial-or-final key (ㅁ G, ㅂ B), ⇧ for ㄶ ㄺ ㄼ, or two keys for another double final.

const BADA_I = { ㄱ: "d", ㄲ: "4", ㄴ: "e", ㄷ: "a", ㄸ: "5", ㄹ: "c", ㅁ: "g", ㅂ: "b", ㅃ: "q", ㅅ: "r", ㅆ: "2",
  ㅇ: "f", ㅈ: "s", ㅉ: "3", ㅊ: "z", ㅋ: "x", ㅌ: "w", ㅍ: "t", ㅎ: "v" };
const BADA_V = { ㅏ: "h", ㅐ: "p", ㅑ: "i", ㅒ: "1", ㅓ: "n", ㅔ: "o", ㅕ: "u", ㅖ: "@", ㅗ: ".", ㅘ: "0", ㅙ: "-",
  ㅚ: "y", ㅛ: "9", ㅜ: "/", ㅝ: "7", ㅞ: "^", ㅟ: "6", ㅠ: "8", ㅡ: ",", ㅢ: "\\", ㅣ: "m" };
const BADA_F = { ㄱ: ";", ㄲ: "4", ㄳ: ";r", ㄴ: "k", ㄵ: "ks", ㄶ: "⇧k", ㄷ: "a", ㄹ: "l", ㄺ: "⇧l", ㄻ: "lg",
  ㄼ: "⇧¥", ㄽ: "lr", ㄾ: "lw", ㄿ: "lt", ㅀ: "lv", ㅁ: "g", ㅂ: "b", ㅄ: "]", ㅅ: "r", ㅆ: "2", ㅇ: "j",
  ㅈ: "s", ㅊ: "z", ㅋ: "x", ㅌ: "w", ㅍ: "t", ㅎ: "v" };
export const BADA = { initials: BADA_I, vowels: BADA_V, finals: BADA_F };

/** The bada keys for Korean text: 한 → vhk. */
export function bada(text) {
  let out = "";
  for (const ch of text) {
    const n = ch.codePointAt(0) - 0xac00;
    if (n < 0 || n > 11171) { out += BADA_V[ch] ?? BADA_I[ch] ?? ch; continue; }
    out += BADA_I[INITIALS[Math.floor(n / 588)]] + BADA_V[VOWELS[Math.floor((n % 588) / 28)]] + (BADA_F[FINALS[n % 28]] ?? "");
  }
  return out;
}

// ── The anthem: 애국가, verse 1 and the refrain ─────────────────────────────────────────────────
// Each word: Korean, the standard romanization, bada roman (level 1: every jamo spelled, ; where the
// syllables split another way), bada roman with its shortcuts (level 2: the fewest keys that still
// show the word first).

const w = (ko, rr, roman, short = roman) => ({ ko, rr, roman, short });
export const ANTHEM = {
  title: "애국가 (Aegukga), verse 1 and the refrain",
  lines: [
    { words: [w("동해", "Donghae", "donghae"), w("물과", "mulgwa", "mulgwa"), w("백두산이", "Baekdusani", "baekdusan;i", "baekdusani"),
              w("마르고", "mareugo", "mareugo"), w("닳도록", "daltorok", "dalhdorok", "daltorok")],
      en: "With the East Sea and Mount Baekdu, to their last breath," },
    { words: [w("하느님이", "haneunimi", "haneunim;i", "haneunimi"), w("보우하사", "bouhasa", "bouhasa"),
              w("우리나라", "urinara", "urinara"), w("만세", "manse", "manse")],
      en: "Let God bless our great country, Manse!" },
    { words: [w("무궁화", "mugunghwa", "mugunghwa"), w("삼천리", "samcheolli", "samchunri", "samqunri"),
              w("화려", "hwaryeo", "hwaryeo", "hwaryo"), w("강산", "gangsan", "gangsan")],
      en: "Mugunghwa thousand-mile rocks and water," },
    { words: [w("대한", "Daehan", "daehan"), w("사람", "saram", "saram"), w("대한으로", "Daehaneuro", "daehan;euro", "daehaneuro"),
              w("길이", "giri", "gil;i", "giri"), w("보전하세", "bojeonhase", "bojeonhase", "bojunhase")],
      en: "The Korean people en Korea, let us long last!" },
  ],
  credit: "Adapted to English by Mirae Research.",
};

/** The anthem as drill items, for a level's keys ("roman", "short", "twoset" or "bada"). */
export function anthemItems(keys) {
  return ANTHEM.lines.flatMap((line, li) => line.words.map(word => ({
    ko: word.ko, rr: word.rr, line: li,
    keys: keys === "twoset" ? twoSet(word.ko) : keys === "bada" ? bada(word.ko) : word[keys],
  })));
}

// ── Levels ──────────────────────────────────────────────────────────────────────────────────────

const i = (ko, rr, keys) => ({ ko, rr, keys });
const ts = (ko, rr) => ({ ko, rr, keys: twoSet(ko) });
const bd = (ko, rr) => ({ ko, rr, keys: bada(ko) });

const HANGUL_NOTE = `<p>Korean is written in <b>Hangul</b>: 24 basic letters (jamo) stacked into
syllable blocks. A block is a consonant (초성, the initial), a vowel (중성), and sometimes a final
consonant (종성): ㅎ + ㅏ + ㄴ = 한. You type the jamo in that order and the keyboard builds the blocks.</p>`;

const ROMAN_NOTE = `<p class="note">Two lines sit above each word. <b>Standard</b> is the Revised
Romanization of Korean, the official system: it spells how a word sounds. <b>bada roman</b> is what
you type. Its spellings are built for unambiguous typing, not accurate pronunciation: each spelling
stands for the letters as they're written, so the keys say exactly which word you mean. 닳도록 is
<i>daltorok</i> in the standard (as it sounds) and <code>dalhdorok</code> in bada roman (as it's
written).</p>`;

export const LEVELS = [
  {
    id: "R1", n: 1, track: "bada-roman", title: "Learn the letters", layout: 15, keysName: "bada roman",
    intro: `<p>Korean is written in <b>Hangul</b>: 24 basic letters (jamo) stacked into syllable
      blocks. In this level you type them with <b>bada roman</b>: spell a syllable in Latin letters,
      and bada builds the block. 한 is <code>han</code>.</p>` + ROMAN_NOTE,
    lessons: [
      {
        id: "R1.1", title: "Consonants (초성)",
        body: `<p>A syllable block starts with a consonant, its <b>초성</b> (choseong, "first sound").
          Here each one is typed with ㅏ (a) after it, since a consonant needs a vowel to make a block.</p>
          <table>
          <tr><th>Letter</th><th>Type</th><th>Sounds like</th></tr>
          <tr><td>ㄱ</td><td><code>g</code></td><td>between the g in <i>go</i> and the k in <i>skip</i></td></tr>
          <tr><td>ㄴ</td><td><code>n</code></td><td>n in <i>no</i></td></tr>
          <tr><td>ㄷ</td><td><code>d</code></td><td>between the d in <i>do</i> and the t in <i>stop</i></td></tr>
          <tr><td>ㄹ</td><td><code>r</code> or <code>l</code></td><td>a light tap of the tongue behind the top teeth, between r and l</td></tr>
          <tr><td>ㅁ</td><td><code>m</code></td><td>m in <i>me</i></td></tr>
          <tr><td>ㅂ</td><td><code>b</code></td><td>between the b in <i>be</i> and the p in <i>spin</i></td></tr>
          <tr><td>ㅅ</td><td><code>s</code></td><td>s in <i>sun</i>; before ㅣ (i), closer to <i>she</i></td></tr>
          <tr><td>ㅇ</td><td>(nothing)</td><td>silent at the start of a block: 아 is just <code>a</code></td></tr>
          <tr><td>ㅈ</td><td><code>j</code> or <code>z</code></td><td>between the j in <i>jam</i> and the ch in <i>itchy</i></td></tr>
          <tr><td>ㅊ</td><td><code>ch</code></td><td>ch in <i>chin</i>, with a puff of air</td></tr>
          <tr><td>ㅋ</td><td><code>k</code></td><td>k in <i>kite</i>, with a puff of air</td></tr>
          <tr><td>ㅌ</td><td><code>t</code></td><td>t in <i>top</i>, with a puff of air</td></tr>
          <tr><td>ㅍ</td><td><code>p</code></td><td>p in <i>pie</i>, with a puff of air</td></tr>
          <tr><td>ㅎ</td><td><code>h</code></td><td>h in <i>hat</i></td></tr>
          </table>
          <p><b>Plain, aspirated, tense.</b> Hold a hand in front of your mouth. ㄱ ㄷ ㅂ ㅈ are soft,
          with a little air. ㅋ ㅌ ㅍ ㅊ push out a strong puff. The <b>tense</b> consonants, typed
          by doubling, have no puff at all and a tight throat, like the k in <i>skin</i>, the t in
          <i>stop</i>, the p in <i>spin</i>:</p>
          <table>
          <tr><td>ㄲ</td><td><code>kk</code> or <code>gg</code></td><td>ㄸ</td><td><code>tt</code> or <code>dd</code></td><td>ㅃ</td><td><code>pp</code> or <code>bb</code></td></tr>
          <tr><td>ㅆ</td><td><code>ss</code></td><td>ㅉ</td><td><code>jj</code> or <code>zz</code></td><td></td><td></td></tr>
          </table>
          <p><code>k</code> can also be ㄱ, so on its own <code>ka</code> shows 가, the more common word. ㅋ
          is clear in a longer word: <code>kal</code> 칼, <code>keopi</code> 커피.</p>`,
        items: [i("가", "ga", "ga"), i("나", "na", "na"), i("다", "da", "da"), i("라", "ra", "ra"), i("마", "ma", "ma"),
          i("바", "ba", "ba"), i("사", "sa", "sa"), i("아", "a", "a"), i("자", "ja", "ja"), i("차", "cha", "cha"),
          i("칼", "kal", "kal"), i("커피", "keopi", "keopi"), i("타", "ta", "ta"), i("파", "pa", "pa"), i("하", "ha", "ha"),
          i("까", "kka", "kka"), i("따", "tta", "tta"), i("빠", "ppa", "ppa"), i("싸", "ssa", "ssa"), i("짜", "jja", "jja")],
      },
      {
        id: "R1.2", title: "Vowels (중성)",
        body: `<p>The vowel, the <b>중성</b> (jungseong, "middle sound"), sits to the right of the
          consonant or under it. A block with no consonant sound starts with a silent ㅇ: 아, 오.</p>
          <table>
          <tr><th>Letter</th><th>Type</th><th>Sounds like</th></tr>
          <tr><td>ㅏ</td><td><code>a</code></td><td>a in <i>father</i></td></tr>
          <tr><td>ㅓ</td><td><code>eo</code></td><td>an open "uh", between the u in <i>sun</i> and the o in <i>song</i></td></tr>
          <tr><td>ㅗ</td><td><code>o</code></td><td>o in <i>go</i>, lips rounded, without gliding into "w"</td></tr>
          <tr><td>ㅜ</td><td><code>u</code></td><td>oo in <i>moon</i></td></tr>
          <tr><td>ㅡ</td><td><code>eu</code></td><td>no English sound: say "oo" with your lips spread flat, as if smiling</td></tr>
          <tr><td>ㅣ</td><td><code>i</code></td><td>ee in <i>see</i></td></tr>
          <tr><td>ㅐ ㅔ</td><td><code>ae</code>, <code>e</code></td><td>both e in <i>bed</i>; most speakers no longer tell them apart</td></tr>
          </table>
          <p><b>Add a y:</b> ㅑ <code>ya</code>, ㅕ <code>yeo</code>, ㅛ <code>yo</code>, ㅠ <code>yu</code>,
          ㅒ <code>yae</code>, ㅖ <code>ye</code> (y in <i>yes</i>).<br>
          <b>Add a w:</b> ㅘ <code>wa</code>, ㅝ <code>wo</code> (w + ㅓ), ㅙ <code>wae</code>, ㅚ
          <code>oe</code>, ㅞ <code>we</code> (all three: we in <i>wet</i>), ㅟ <code>wi</code> (wee
          in <i>week</i>), ㅢ <code>ui</code> (ㅡ gliding into ㅣ).</p>`,
        items: [i("아", "a", "a"), i("어", "eo", "eo"), i("오", "o", "o"), i("우", "u", "u"), i("으", "eu", "eu"),
          i("이", "i", "i"), i("애", "ae", "ae"), i("에", "e", "e"), i("야", "ya", "ya"), i("여", "yeo", "yeo"),
          i("요", "yo", "yo"), i("유", "yu", "yu"), i("얘기", "yaegi", "yaegi"), i("예", "ye", "ye"), i("와", "wa", "wa"),
          i("왜", "wae", "wae"), i("외", "oe", "oe"), i("워", "wo", "wo"), i("웨이터", "weiteo", "weiteo"), i("위", "wi", "wi"),
          i("의", "ui", "ui")],
      },
      {
        id: "R1.3", title: "Finals (종성)",
        body: `<p>A consonant can close the block from below: the <b>종성</b> (jongseong, "final
          sound"). Type it after the vowel: 가 <code>ga</code>, 간 <code>gan</code>.</p>
          <p>However it's written, a final is said as one of seven sounds, held without letting the
          air out (as a word ends just before a pause):</p>
          <table>
          <tr><th>Sound</th><th>Written</th><th>Example</th></tr>
          <tr><td>k</td><td>ㄱ ㄲ ㅋ</td><td>각 <code>gak</code></td></tr>
          <tr><td>n</td><td>ㄴ</td><td>간 <code>gan</code></td></tr>
          <tr><td>t</td><td>ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ</td><td>갇 <code>gad</code>, 갓 <code>gas</code></td></tr>
          <tr><td>l</td><td>ㄹ</td><td>갈 <code>gal</code></td></tr>
          <tr><td>m</td><td>ㅁ</td><td>감 <code>gam</code></td></tr>
          <tr><td>p</td><td>ㅂ ㅍ</td><td>갑 <code>gab</code></td></tr>
          <tr><td>ng</td><td>ㅇ</td><td>강 <code>gang</code> (ng in <i>sing</i>)</td></tr>
          </table>
          <p>bada roman spells the letter that's <b>written</b>, so <code>gas</code> is 갓 (said
          "gat"). Two consonants can share the bottom: <code>dalk</code> 닭, <code>anj</code> 앉,
          <code>eops</code> 없, <code>manh</code> 많.</p>`,
        items: [i("각", "gak", "gak"), i("간", "gan", "gan"), i("갇", "gat", "gad"), i("갈", "gal", "gal"), i("감", "gam", "gam"),
          i("갑", "gap", "gab"), i("강", "gang", "gang"), i("갓", "gat", "gas"), i("닭", "dak", "dalk"), i("앉", "an", "anj"),
          i("없", "eop", "eops"), i("많", "man", "manh"), i("물", "mul", "mul"), i("한글", "Hangeul", "hangeul")],
      },
      {
        id: "R1.4", title: "Building words",
        body: `<p>Type a whole word, then <b>Space</b>. bada splits the letters into blocks: each
          consonant between two vowels starts the next block, the rest ends the block before it.
          <code>hanguk</code> is 한국.</p>
          <p>When you want a split the rule wouldn't make, type <code>;</code> there:
          <code>hang;uk</code> is 항욱. Words bada knows often come first without it.</p>
          <p>Several words can come from the same letters. The first shows as you type, and the
          others wait in the menu: press <b>Tab</b> or <b>↓</b> to move to the next one. Try
          <code>bada</code>: 받아 ("received") comes first, 바다 ("sea") is next.</p>
          <p>Some words are said differently from how they're written: 감사합니다 is said
          "gamsahamnida". bada roman types the written letters, <code>gamsahabnida</code>, and the
          said form works too.</p>`,
        items: [i("한국", "Hanguk", "hanguk"), i("항욱", "hang-uk", "hang;uk"), i("사람", "saram", "saram"), i("시간", "sigan", "sigan"),
          i("친구", "chingu", "chingu"), i("학교", "hakgyo", "hakgyo"), i("나라", "nara", "nara"), i("사랑", "sarang", "sarang"),
          i("오늘", "oneul", "oneul"), i("내일", "naeil", "naeil"), i("생각", "saenggak", "saenggak"), i("이름", "ireum", "ireum"),
          i("음식", "eumsik", "eumsik"), i("가족", "gajok", "gajok"), i("바다", "bada", "bada"), i("학생", "haksaeng", "haksaeng"),
          i("선생님", "seonsaengnim", "seonsaengnim"), i("정말", "jeongmal", "jeongmal"), i("안녕하세요", "annyeonghaseyo", "annyeonghaseyo"),
          i("감사합니다", "gamsahamnida", "gamsahabnida")],
        menu: ["바다"],
      },
      { id: "R1.5", title: "The anthem", anthem: "roman" },
    ],
  },
  {
    id: "R2", n: 2, track: "bada-roman", title: "bada roman shortcuts", layout: 15, keysName: "bada roman",
    intro: `<p>bada roman borrows a few spellings that save keys or say exactly what you mean: from
      Korean chat, from names, and from Japanese romaji.</p>` + ROMAN_NOTE,
    lessons: [
      {
        id: "R2.1", title: "q and x",
        body: `<p><code>q</code> is <b>ㅊ</b>, one key for <code>ch</code>: <code>qa</code> 차,
          <code>qingu</code> 친구.</p>
          <p><code>x</code> is <b>ㅇ at the start of a block</b>. It splits there too, as
          <code>;</code> does: <code>sanxi</code> 산이, <code>anxa</code> 안아. On its own it's ㅇ, as
          chat writes it: <code>xx</code> ㅇㅇ, <code>xk</code> ㅇㅋ.</p>`,
        items: [i("차", "cha", "qa"), i("친구", "chingu", "qingu"), i("천", "cheon", "qeon"), i("산이", "sani", "sanxi"),
          i("안아", "ana", "anxa"), i("길이", "giri", "gilxi"), i("ㅇㅇ", "", "xx"), i("ㅇㅋ", "", "xk")],
      },
      {
        id: "R2.2", title: "Vowel spellings",
        body: `<p><code>-</code> after <code>e</code> lengthens ㅔ into <b>ㅐ</b>: <code>e-</code> 애,
          <code>se-</code> 새, <code>he-</code> 해, <code>ye-</code> 얘. (The <code>-</code> key isn't
          drawn below; it's right of <code>0</code>.)</p>
          <p>Spellings from names: <code>woo</code> is ㅜ (<code>woori</code> 우리), <code>eui</code> is
          ㅢ (<code>eui</code> 의). Before a final, <code>yu</code> and <code>you</code> are ㅕ
          (<code>young</code> 영, <code>hyun</code> 현) and <code>u</code> can be ㅓ (<code>sung</code>
          성, <code>jun</code> 전), as Hyundai, Kyung and Sung are spelled.</p>`,
        items: [i("애", "ae", "e-"), i("새", "sae", "se-"), i("해", "hae", "he-"), i("얘", "yae", "ye-"), i("우리", "uri", "woori"),
          i("의", "ui", "eui"), i("영", "yeong", "young"), i("년", "nyeon", "nyun"), i("현", "hyeon", "hyun"), i("성", "seong", "sung"),
          i("전", "jeon", "jun")],
      },
      {
        id: "R2.3", title: "Finals that save keys",
        body: `<p><code>ts</code> is a final <b>ㅆ</b>: <code>its</code> 있, <code>itseo</code> 있어.
          <code>h</code> is a final <b>ㅎ</b>: <code>joh</code> 좋, <code>johayo</code> 좋아요.
          <code>j</code> and <code>z</code> are a final <b>ㅈ</b>: <code>naj</code> 낮. And
          <code>zz</code> is ㅉ, as <code>jj</code> is: <code>zzigae</code> 찌개.</p>
          <p><code>l</code> before <code>t</code> implies a <b>ㅎ</b> between them, as it's said
          (ㅎ and ㄷ together sound like ㅌ): <code>daltorok</code> 닳도록, <code>silta</code> 싫다,
          <code>ilta</code> 잃다.</p>`,
        items: [i("있", "it", "its"), i("있어", "isseo", "itseo"), i("좋", "jot", "joh"), i("좋아", "joa", "joha"),
          i("좋아요", "joayo", "johayo"), i("낮", "nat", "naj"), i("짜", "jja", "zza"), i("찌개", "jjigae", "zzigae"),
          i("닳도록", "daltorok", "daltorok"), i("싫다", "silta", "silta"), i("잃다", "ilta", "ilta")],
      },
      {
        id: "R2.4", title: "Japanese romaji shortcuts",
        body: `<p>Many Korean words come from Chinese characters that Japanese uses too. Where the
          Japanese reading of a character is shorter, bada roman takes it for the Korean syllable:
          <code>nen</code> 년 (年), and it mixes with Korean spelling in a word: <code>seigong</code>
          성공 (sei 성 + gong 공), <code>kenkang</code> 건강.</p>
          <p>A short one can mean several syllables, so it may be second in the menu: <code>mei</code>
          shows 메이 and offers 명 next (Tab).</p>`,
        items: [i("년", "nyeon", "nen"), i("성공", "seonggong", "seigong"), i("건강", "geongang", "kenkang"), i("명패", "myeongpae", "meipe-")],
      },
      {
        id: "R2.5", title: "Let the ranking split",
        body: `<p>bada ranks readings by how common the word is, so a known word usually comes first
          even without <code>;</code> or <code>x</code>: <code>baekdusani</code> gives 백두산이. Keep
          <code>;</code> for words it doesn't know.</p>`,
        items: [i("백두산이", "Baekdusani", "baekdusani"), i("하느님이", "haneunimi", "haneunimi"), i("대한으로", "Daehaneuro", "daehaneuro"),
          i("길이", "giri", "giri"), i("삼천리", "samcheolli", "samqunri"), i("보전하세", "bojeonhase", "bojunhase"), i("화려", "hwaryeo", "hwaryo")],
      },
      { id: "R2.6", title: "The anthem, shorter", anthem: "short" },
    ],
  },
  {
    id: "K1", n: 1, track: "2set", title: "Korean 2-set (두벌식)", layout: 10, keysName: "2-set keys",
    intro: HANGUL_NOTE + `<p><b>2-set</b> (두벌식, KS X 5002) is the standard Korean keyboard: one key per jamo,
      consonants under the left hand and vowels under the right. Type the jamo of each block in
      order and the blocks build themselves. The keys below show each jamo; above each word is
      the standard romanization and the keys to press (an uppercase letter means ⇧).</p>`,
    lessons: [
      {
        id: "K1.1", title: "Home row",
        body: `<p>Left hand: ㅁ <code>a</code>, ㄴ <code>s</code>, ㅇ <code>d</code>, ㄹ
          <code>f</code>, ㅎ <code>g</code>. Right hand: ㅗ <code>h</code>, ㅓ <code>j</code>, ㅏ
          <code>k</code>, ㅣ <code>l</code>.</p>`,
        items: [ts("아", "a"), ts("나", "na"), ts("마", "ma"), ts("하", "ha"), ts("라", "ra"), ts("어", "eo"), ts("오", "o"),
          ts("이", "i"), ts("안", "an"), ts("날", "nal"), ts("나라", "nara"), ts("하나", "hana"), ts("아니", "ani"), ts("머리", "meori"), ts("오리", "ori")],
      },
      {
        id: "K1.2", title: "Top row",
        body: `<p>Left hand: ㅂ <code>q</code>, ㅈ <code>w</code>, ㄷ <code>e</code>, ㄱ
          <code>r</code>, ㅅ <code>t</code>. Right hand: ㅛ <code>y</code>, ㅕ <code>u</code>, ㅑ
          <code>i</code>, ㅐ <code>o</code>, ㅔ <code>p</code>.</p>`,
        items: [ts("바", "ba"), ts("자", "ja"), ts("다", "da"), ts("가", "ga"), ts("사", "sa"), ts("요", "yo"), ts("여", "yeo"),
          ts("야", "ya"), ts("애", "ae"), ts("에", "e"), ts("가방", "gabang"), ts("사랑", "sarang"), ts("고기", "gogi"), ts("기자", "gija"), ts("노래", "norae")],
      },
      {
        id: "K1.3", title: "Bottom row",
        body: `<p>Left hand: ㅋ <code>z</code>, ㅌ <code>x</code>, ㅊ <code>c</code>, ㅍ
          <code>v</code>. Right hand: ㅠ <code>b</code>, ㅜ <code>n</code>, ㅡ <code>m</code>.</p>`,
        items: [ts("카", "ka"), ts("타", "ta"), ts("차", "cha"), ts("파", "pa"), ts("유", "yu"), ts("우", "u"), ts("으", "eu"),
          ts("커피", "keopi"), ts("친구", "chingu"), ts("우유", "uyu"), ts("크다", "keuda")],
      },
      {
        id: "K1.4", title: "Shift",
        body: `<p>⇧ gives the tense consonants and two vowels: ㅃ <code>⇧Q</code>, ㅉ
          <code>⇧W</code>, ㄸ <code>⇧E</code>, ㄲ <code>⇧R</code>, ㅆ <code>⇧T</code>, ㅒ
          <code>⇧O</code>, ㅖ <code>⇧P</code>.</p>`,
        items: [ts("까", "kka"), ts("따", "tta"), ts("빠", "ppa"), ts("싸", "ssa"), ts("짜", "jja"), ts("얘기", "yaegi"),
          ts("예", "ye"), ts("있다", "itda"), ts("오빠", "oppa")],
      },
      {
        id: "K1.5", title: "Two keys for one jamo",
        body: `<p>Compound vowels are typed as their parts: ㅘ = ㅗ ㅏ (<code>hk</code>), ㅝ = ㅜ ㅓ
          (<code>nj</code>), ㅢ = ㅡ ㅣ (<code>ml</code>). Double finals too: ㄺ = ㄹ ㄱ
          (<code>fr</code>), ㅄ = ㅂ ㅅ (<code>qt</code>).</p>`,
        items: [ts("과", "gwa"), ts("왜", "wae"), ts("외", "oe"), ts("워", "wo"), ts("웨", "we"), ts("위", "wi"), ts("의", "ui"),
          ts("닭", "dak"), ts("값", "gap"), ts("앉다", "anda"), ts("많다", "manta")],
      },
      {
        id: "K1.6", title: "Words",
        body: `<p>Whole words, then Space.</p>`,
        items: [ts("한국", "Hanguk"), ts("한글", "Hangeul"), ts("사람", "saram"), ts("감사합니다", "gamsahamnida"),
          ts("안녕하세요", "annyeonghaseyo"), ts("선생님", "seonsaengnim"), ts("학교", "hakgyo"), ts("바다", "bada")],
      },
      { id: "K1.7", title: "The anthem in 2-set", anthem: "twoset" },
    ],
  },

  {
    id: "B1", n: 1, track: "bada", title: "bada (JIS)", layout: 13, keysName: "bada keys",
    intro: HANGUL_NOTE + `<p><b>bada</b> is bada ime's own layout for JIS keyboards. It types like
      2-set (consonants under the left hand, vowels under the right), keeps finals like 3-set
      (the commonest finals have keys of their own), and uses every key, the number row included,
      as JIS kana does. It's <b>deterministic</b>: the same keys always give the same text.</p>
      <p>Above each word is the standard romanization and the keys to press, by their JIS legends;
      ⇧ means Shift with that key.</p>`,
    lessons: [
      {
        id: "B1.1", title: "Home row",
        body: `<p>Left hand, initials: ㄷ <code>A</code>, ㅈ <code>S</code>, ㄱ <code>D</code>,
          ㅇ <code>F</code>, ㅁ <code>G</code>. ㅏ is <code>H</code>.</p>
          <p>Right hand, finals: ㅇ <code>J</code>, ㄴ <code>K</code>, ㄹ <code>L</code>, ㄱ
          <code>;</code>. These four are <b>final-only</b>: they always end the syllable, so 간 is
          <code>D H K</code> and 강 <code>D H J</code>.</p>`,
        items: [bd("아", "a"), bd("다", "da"), bd("자", "ja"), bd("가", "ga"), bd("마", "ma"), bd("안", "an"), bd("강", "gang"),
          bd("알", "al"), bd("악", "ak"), bd("가다", "gada"), bd("마다", "mada"), bd("잔", "jan"), bd("감자", "gamja"), bd("가장", "gajang"), bd("마당", "madang")],
      },
      {
        id: "B1.2", title: "Vowels",
        body: `<p>The simple vowels sit right and below: ㅓ <code>N</code>, ㅣ <code>M</code>, ㅡ
          <code>,</code>, ㅗ <code>.</code>, ㅜ <code>/</code>; above them ㅕ <code>U</code>, ㅑ
          <code>I</code>, ㅔ <code>O</code>, ㅐ <code>P</code>, ㅚ <code>Y</code>.</p>`,
        items: [bd("어", "eo"), bd("이", "i"), bd("으", "eu"), bd("오", "o"), bd("우", "u"), bd("여", "yeo"), bd("야", "ya"),
          bd("에", "e"), bd("애", "ae"), bd("외", "oe"), bd("아이", "ai"), bd("오이", "oi"), bd("우유", "uyu"), bd("고기", "gogi"), bd("어머니", "eomeoni")],
      },
      {
        id: "B1.3", title: "More consonants",
        body: `<p>Top row: ㅌ <code>W</code>, ㄴ <code>E</code>, ㅅ <code>R</code>, ㅍ
          <code>T</code>, and ㅃ <code>Q</code>. Bottom row: ㅊ <code>Z</code>, ㅋ <code>X</code>,
          ㄹ <code>C</code>, ㅎ <code>V</code>, ㅂ <code>B</code>.</p>
          <p>ㄴ and ㄹ have two keys: <code>E</code> and <code>C</code> start a syllable,
          <code>K</code> and <code>L</code> end one.</p>`,
        items: [bd("나", "na"), bd("라", "ra"), bd("사", "sa"), bd("하", "ha"), bd("바", "ba"), bd("차", "cha"), bd("카", "ka"),
          bd("타", "ta"), bd("파", "pa"), bd("나라", "nara"), bd("사람", "saram"), bd("한국", "Hanguk"), bd("바다", "bada"), bd("커피", "keopi"), bd("친구", "chingu")],
      },
      {
        id: "B1.4", title: "Finals",
        body: `<p>Most finals use the consonant keys: after a vowel, <code>G</code> is a final ㅁ,
          <code>B</code> ㅂ, <code>R</code> ㅅ, until a vowel comes next and takes it as its
          initial (<code>D H G</code> 감, <code>D H G H</code> 가마). Only ㅇ ㄴ ㄹ ㄱ have
          final-only keys, because they're the commonest.</p>
          <p>Double finals: ㄶ <code>⇧K</code>, ㄺ <code>⇧L</code>, ㄼ <code>⇧¥</code>; ㅄ is
          <code>]</code> after a vowel (값); the others are their two consonants (ㄵ <code>K S</code>).
          ⇧J ㅁ, ⇧; ㄲ and ¥ ㅂ are final-only keys too, for when you want them.</p>`,
        items: [bd("밤", "bam"), bd("밥", "bap"), bd("많다", "manta"), bd("닭", "dak"), bd("밖", "bak"), bd("넓다", "neolda"),
          bd("옷", "ot"), bd("값", "gap"), bd("앉다", "anda"), bd("감사", "gamsa"), bd("입", "ip"), bd("김치", "gimchi")],
      },
      {
        id: "B1.5", title: "The number row",
        body: `<p>Tense consonants: ㅆ <code>2</code> (and <code>:</code>), ㄲ <code>4</code>, ㅉ
          <code>3</code>, ㄸ <code>5</code>. Every compound vowel has a key: ㅒ <code>1</code>, ㅟ
          <code>6</code>, ㅝ <code>7</code>, ㅠ <code>8</code>, ㅛ <code>9</code>, ㅘ <code>0</code>,
          ㅙ <code>-</code>, ㅞ <code>^</code>, ㅖ <code>@</code>, ㅢ <code>\\</code>. Digits are on
          ⇧, so you never leave Korean to type them.</p>`,
        items: [bd("있다", "itda"), bd("까치", "kkachi"), bd("짜다", "jjada"), bd("딸기", "ttalgi"), bd("위", "wi"), bd("뭐", "mwo"),
          bd("유리", "yuri"), bd("요리", "yori"), bd("과자", "gwaja"), bd("왜", "wae"), bd("예", "ye"), bd("의사", "uisa"), bd("얘기", "yaegi")],
      },
      {
        id: "B1.6", title: "Words",
        body: `<p>Whole words, then Space.</p>`,
        items: [bd("한글", "Hangeul"), bd("안녕하세요", "annyeonghaseyo"), bd("감사합니다", "gamsahamnida"), bd("선생님", "seonsaengnim"),
          bd("학교", "hakgyo"), bd("것이", "geosi"), bd("대한민국", "Daehanminguk"), bd("서울", "Seoul")],
      },
      { id: "B1.7", title: "The anthem in bada", anthem: "bada" },
    ],
  },
];

/** A lesson's drill items (an anthem lesson's from the anthem). */
export function lessonItems(lesson) {
  return lesson.anthem ? anthemItems(lesson.anthem) : lesson.items;
}

/** Every lesson, flat, with its level. */
export const LESSONS = LEVELS.flatMap(level => level.lessons.map(lesson => ({ ...lesson, level })));

/** The tracks: the layout a learner aims for, and its levels. */
export const TRACKS = [
  { id: "bada-roman", name: "bada roman", layout: 15, boards: ["ansi", "iso", "jis"],
    blurb: "Korean spelled in Latin letters: type 한 as han. The quickest start, on any keyboard." },
  { id: "2set", name: "Korean 2-set (KTS)", layout: 10, boards: ["ansi", "iso", "jis"],
    blurb: "The standard Korean keyboard (두벌식): one key per jamo. What most Koreans type." },
  { id: "bada", name: "bada", layout: 13, boards: ["jis"],
    blurb: "bada ime's own layout for JIS keyboards: every jamo on a key, no guessing." },
].map(t => ({ ...t, levels: LEVELS.filter(l => l.track === t.id) }));

export const trackOf = id => TRACKS.find(t => t.id === id) || TRACKS[0];

/** Lesson ids before tracks (1.x, 2.x bada roman; 3.x 2-set) to now. */
export const migrateId = id => String(id).replace(/^([123])\./, (_, n) => ({ 1: "R1.", 2: "R2.", 3: "K1." })[n]);
