import { kana } from './letters.js';

const list = (words, sentences) => [...words.split(/\s+/), ...sentences.trim().split('\n')];
const byLength = (a, b) => a.length - b.length;

const FR = list(
  `un eu ami été lit mur nez roi sac dos sol feu pot chat chien lune soleil papa maman bébé pain lait eau
fleur arbre maison ballon livre école jouet gâteau bateau cheval poisson oiseau canard lapin souris
tortue girafe éléphant crayon bonbon pomme banane fraise orange cerise citron nuage étoile rivière
montagne jardin papillon`,
  `
il pleut
le chat dort
j'ai un ballon
le soleil brille
maman fait un gâteau
la lune est ronde
papa lit un livre
j'aime les fraises
le chien court vite
nous allons à l'école
l'oiseau chante dans l'arbre
le petit lapin mange une carotte
il était une fois un petit chat gris
le soleil se lève et les oiseaux chantent
la tortue marche doucement dans le jardin
au printemps les fleurs poussent dans le jardin
un jour la petite souris trouva un gros morceau de fromage
le bateau part sur la mer et le vent souffle fort
dans la forêt un petit renard cherche son ami le hibou`,
).sort(byLength);

const EN = list(
  `a an go up sun cat dog pig hen cow fox bed cup hat bus red big run sit
moon star tree fish bird frog duck bear milk book ball cake rain snow
apple horse mouse tiger zebra lemon happy water house flower garden rabbit
turtle monkey banana orange yellow rocket pencil window` ,
  `
i see a cat
the dog runs
i like milk
the sun is hot
my mom is kind
we play in the park
the bird sings a song
i have a red ball
the frog jumps in the pond
a little duck swims on the lake
the moon is bright tonight
i love to read books with dad
once upon a time there was a small bear
the sun rises and the birds start to sing
a little mouse found a big piece of cheese
in the forest a young fox looks for his best friend the owl`,
).sort(byLength);

const JA_WORDS = `あめ ame|いし ishi|いえ ie|うみ umi|かお kao|くち kuchi|はな hana|そら sora|つき tsuki|ほし hoshi
|やま yama|かわ kawa|ねこ neko|いぬ inu|さる saru|うま uma|とり tori|かめ kame|くま kuma|ふね fune
|くつ kutsu|かさ kasa|あひる ahiru|さくら sakura|ひかり hikari|さかな sakana|たまご tamago|りんご ringo
|みかん mikan|すいか suika|くるま kuruma|たいこ taiko|とけい tokei|まくら makura|おりがみ origami
|めがね megane|てがみ tegami|でんわ denwa|ことり kotori|ともだち tomodachi|えんぴつ enpitsu
|おかあさん okaasan|おとうさん otousan|おにぎり onigiri|ふうせん fuusen|ひこうき hikouki
|たなばた tanabata|かぶとむし kabutomushi|ゆきだるま yukidaruma|ぼうし boushi|ぶどう budou
|おはよう ohayou|ありがとう arigatou|おやすみ oyasumi|さようなら sayounara|ただいま tadaima
|いただきます itadakimasu
|ねこがすき nekogasuki
|そらはあおいです sorahaaoidesu
|ねこはかわいいです nekohakawaiidesu
|ほしがきれいです hoshigakireidesu
|いぬがはしります inugahashirimasu
|あしたはあめです ashitahaamedesu
|ぼくはりんごがすきです bokuharingogasukidesu
|おおきなやまがあります ookinayamagaarimasu
|むかしむかしあるところに mukashimukashiarutokoroni
|おじいさんとおばあさんがいました ojiisantoobaasangaimashita`;

const JA = JA_WORDS.split('|').map((p) => kana(...p.trim().split(' ')))
  .sort((a, b) => a.accepts[0].length - b.accepts[0].length);

export const WORDS = { fr: FR, en: EN, ja: JA };
