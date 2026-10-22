const az = [...'abcdefghijklmnopqrstuvwxyz'];
const digits = [...'0123456789'];

export function kana(display, romaji, hint) {
  const kunrei = romaji.replace(/shi/g, 'si').replace(/chi/g, 'ti').replace(/tsu/g, 'tu')
    .replace(/fu/g, 'hu').replace(/ji/g, 'zi');
  const e = { display, accepts: kunrei === romaji ? [romaji] : [romaji, kunrei] };
  if (hint) e.hint = hint;
  return e;
}

const HIRAGANA = `あ a い i う u え e お o か ka き ki く ku け ke こ ko
さ sa し shi す su せ se そ so た ta ち chi つ tsu て te と to
な na に ni ぬ nu ね ne の no は ha ひ hi ふ fu へ he ほ ho
ま ma み mi む mu め me も mo や ya ゆ yu よ yo
ら ra り ri る ru れ re ろ ro わ wa を wo ん n
が ga ぎ gi ぐ gu げ ge ご go ざ za じ ji ず zu ぜ ze ぞ zo
だ da で de ど do ば ba び bi ぶ bu べ be ぼ bo ぱ pa ぴ pi ぷ pu ぺ pe ぽ po`
  .split(/\s+/);

const hira = [];
for (let i = 0; i < HIRAGANA.length; i += 2) hira.push([HIRAGANA[i], HIRAGANA[i + 1]]);

const toKata = (c) => String.fromCharCode(c.charCodeAt(0) + 0x60);

const KANJI = [
  ['日', 'ひ', 'hi'], ['月', 'つき', 'tsuki'], ['火', 'ひ', 'hi'], ['水', 'みず', 'mizu'],
  ['木', 'き', 'ki'], ['山', 'やま', 'yama'], ['川', 'かわ', 'kawa'], ['人', 'ひと', 'hito'],
  ['口', 'くち', 'kuchi'], ['目', 'め', 'me'], ['手', 'て', 'te'], ['耳', 'みみ', 'mimi'],
  ['犬', 'いぬ', 'inu'], ['花', 'はな', 'hana'], ['空', 'そら', 'sora'], ['雨', 'あめ', 'ame'],
  ['森', 'もり', 'mori'], ['本', 'ほん', 'hon'],
];

export const LETTERS = {
  fr: [...az, ...digits],
  en: [...az, ...digits],
  ja: [
    ...hira.map(([k, r]) => kana(k, r)),
    ...hira.map(([k, r]) => kana(toKata(k), r)),
    ...KANJI.map(([k, h, r]) => kana(k, r, h)),
  ],
};
