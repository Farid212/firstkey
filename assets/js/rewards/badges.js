import { BLOCKS } from '../blocks.js';

const playable = BLOCKS.filter((b) => b.playable).map((b) => b.id);
const stat = (k, n) => (s) => s.rewards.stats[k] >= n;
const level = (n) => (s) => Object.values(s.progress || {}).some((p) => p && p.level >= n);
const b = (id, fr, en, ja, earned) => ({ id, names: { fr, en, ja }, earned });

export const BADGES = [
  b('first_step', 'Premier pas', 'First step', 'はじめのいっぽ', stat('totalCorrect', 1)),
  b('streak_10', 'Série de 10', '10 in a row', '10かれんぞく', stat('bestStreak', 10)),
  b('streak_25', 'Série de 25', '25 in a row', '25かれんぞく', stat('bestStreak', 25)),
  b('first_level', 'Premier niveau', 'First level', 'はじめてのレベル', (s) => s.rewards.levelUps >= 1),
  b('level_10', 'Niveau 10', 'Level 10', 'レベル10', level(10)),
  b('level_25', 'Niveau 25', 'Level 25', 'レベル25', level(25)),
  b('level_50', 'Niveau 50', 'Level 50', 'レベル50', level(50)),
  b('level_100', 'Niveau 100', 'Level 100', 'レベル100', level(100)),
  b('total_100', '100 bonnes réponses', '100 correct answers', '100もんせいかい', stat('totalCorrect', 100)),
  b('total_500', '500 bonnes réponses', '500 correct answers', '500もんせいかい', stat('totalCorrect', 500)),
  b('total_1000', '1000 bonnes réponses', '1000 correct answers', '1000もんせいかい', stat('totalCorrect', 1000)),
  b('explorer', 'Explorateur', 'Explorer', 'たんけんか', (s) => {
    const on = (s.settings?.blocks ?? []).filter((id) => playable.includes(id));
    return on.length > 0 && on.every((id) => s.rewards.stats.blocksTried.includes(id));
  }),
  b('first_word', 'Premier mot', 'First word', 'はじめてのことば', (s) => s.rewards.stats.wordTyped),
  b('first_sentence', 'Première phrase', 'First sentence', 'はじめてのぶん', (s) => s.rewards.stats.sentenceTyped),
  b('collector_12', 'Collectionneur', 'Collector', 'コレクター', (s) => s.rewards.unlocked >= 12),
  b('collector_24', 'Grand collectionneur', 'Master collector', 'だいコレクター', (s) => s.rewards.unlocked >= 24),
  b('faithful_3', 'Fidèle', 'Faithful', 'まいにちがんばる', stat('dayStreak', 3)),
];
