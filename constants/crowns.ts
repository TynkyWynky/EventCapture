import { Ionicons } from '@expo/vector-icons';

export const CROWN_TARGET = 9;
export const CROWN_LEVELS = [
  { level: 1, minCrowns: 0, maxCrowns: 1, title: 'Starter' },
  { level: 2, minCrowns: 2, maxCrowns: 3, title: 'Riser' },
  { level: 3, minCrowns: 4, maxCrowns: 5, title: 'Regular' },
  { level: 4, minCrowns: 6, maxCrowns: 7, title: 'Headliner' },
  { level: 5, minCrowns: 8, maxCrowns: 9, title: 'Legend' },
];

export interface CrownReward {
  perk: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const CROWN_MILESTONES = [
  'First sip',
  'Golden hour',
  'Night starter',
  'Buzz builder',
  'Scene regular',
  'Aftermovie energy',
  'Crowd favorite',
  'Headliner aura',
  'Legend status',
];

export const CROWN_REWARDS: CrownReward[] = [
  {
    perk: 'Welcome glow frame',
    detail: 'A warm profile halo for your first finished capture.',
    icon: 'color-wand-outline',
  },
  {
    perk: 'Golden ticket badge',
    detail: 'A brighter event stamp on your next post.',
    icon: 'ticket-outline',
  },
  {
    perk: 'Night mode flair',
    detail: 'A darker, richer accent on your reward moments.',
    icon: 'moon-outline',
  },
  {
    perk: 'Buzz booster card',
    detail: 'A special highlight style for one winning memory.',
    icon: 'flash-outline',
  },
  {
    perk: 'Scene regular marker',
    detail: 'A sharper crown tag that follows you in the app.',
    icon: 'sparkles-outline',
  },
  {
    perk: 'Aftermovie ribbon',
    detail: 'A ribbon accent for your best capture recaps.',
    icon: 'film-outline',
  },
  {
    perk: 'Crowd favorite stamp',
    detail: 'A premium social badge for standout event nights.',
    icon: 'people-outline',
  },
  {
    perk: 'Headliner spotlight',
    detail: 'Your vault cards get the full premium treatment.',
    icon: 'star-outline',
  },
  {
    perk: 'Legend aura',
    detail: 'The complete crown set with the final elite finish.',
    icon: 'diamond-outline',
  },
];

export function getActiveCrownReward(crowns: number) {
  const safeCount = Math.max(0, Math.min(crowns, CROWN_TARGET));

  if (safeCount === 0) {
    return null;
  }

  return {
    crownNumber: safeCount,
    milestone: CROWN_MILESTONES[safeCount - 1],
    reward: CROWN_REWARDS[safeCount - 1],
  };
}

export function getNextCrownReward(crowns: number) {
  const safeCount = Math.max(0, Math.min(crowns, CROWN_TARGET - 1));

  return {
    crownNumber: safeCount + 1,
    milestone: CROWN_MILESTONES[safeCount],
    reward: CROWN_REWARDS[safeCount],
  };
}

export function getCrownLevelProgress(crowns: number) {
  const safeCrowns = Math.max(0, Math.min(crowns, CROWN_TARGET));
  const currentLevel =
    CROWN_LEVELS.find((level) => safeCrowns >= level.minCrowns && safeCrowns <= level.maxCrowns) ??
    CROWN_LEVELS[CROWN_LEVELS.length - 1];
  const currentLevelIndex = CROWN_LEVELS.findIndex((level) => level.level === currentLevel.level);
  const nextLevel = CROWN_LEVELS[currentLevelIndex + 1] ?? null;
  const crownsIntoLevel = safeCrowns - currentLevel.minCrowns;
  const crownsRequiredForCurrentLevel = Math.max(currentLevel.maxCrowns - currentLevel.minCrowns + 1, 1);
  const progressWithinLevel = nextLevel
    ? Math.min((crownsIntoLevel / crownsRequiredForCurrentLevel) * 100, 100)
    : 100;
  const crownsToNextLevel = nextLevel ? Math.max(nextLevel.minCrowns - safeCrowns, 0) : 0;

  return {
    currentLevel,
    nextLevel,
    progressWithinLevel,
    crownsToNextLevel,
    safeCrowns,
  };
}
