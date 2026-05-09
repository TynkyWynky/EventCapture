export interface BadgeTheme {
  background: string;
  border: string;
  text: string;
  icon?: string;
  shadow?: string;
}

export const BadgeThemes = {
  spritz: {
    background: '#fff1dd',
    border: '#f3c68d',
    text: '#a24d12',
    icon: '#f47b20',
    shadow: 'rgba(244,123,32,0.16)',
  },
  lager: {
    background: '#fff6cf',
    border: '#eed37a',
    text: '#8f6505',
    icon: '#c8891c',
    shadow: 'rgba(200,137,28,0.16)',
  },
  mojito: {
    background: '#e8f7ef',
    border: '#9fd8b4',
    text: '#176347',
    icon: '#2fbf71',
    shadow: 'rgba(47,191,113,0.14)',
  },
  aperitif: {
    background: '#ffe7df',
    border: '#f0b0a0',
    text: '#9b3f2e',
    icon: '#d25d4a',
    shadow: 'rgba(210,93,74,0.16)',
  },
  blueCuracao: {
    background: '#e7f0fb',
    border: '#b5cde8',
    text: '#30526f',
    icon: '#4a6c87',
    shadow: 'rgba(74,108,135,0.16)',
  },
  stout: {
    background: '#34241d',
    border: '#5b4336',
    text: '#fff2e6',
    icon: '#f0c9a9',
    shadow: 'rgba(31,26,23,0.22)',
  },
  roseFizz: {
    background: '#ffe6f0',
    border: '#efb5cb',
    text: '#9d375c',
    icon: '#d95b8a',
    shadow: 'rgba(217,91,138,0.16)',
  },
} as const satisfies Record<string, BadgeTheme>;

export function getEventBadgeTheme(label: string | null | undefined): BadgeTheme {
  const normalized = (label ?? '').toLowerCase();

  if (normalized.includes('free')) {
    return BadgeThemes.lager;
  }
  if (normalized.includes('concert')) {
    return BadgeThemes.aperitif;
  }
  if (normalized.includes('sold')) {
    return BadgeThemes.stout;
  }
  if (normalized.includes('city') || normalized.includes('visit')) {
    return BadgeThemes.blueCuracao;
  }

  return BadgeThemes.spritz;
}
