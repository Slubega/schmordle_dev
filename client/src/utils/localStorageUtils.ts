import { UserStats } from '../interfaces/types';

const STATS_KEY = 'schmordleStats';
const SOLITAIRE_STATS_KEY = 'schmordleSolitaireStats';

const emptyStats = (): UserStats => ({
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: '',
});

export const getStats = (): UserStats => {
  const statsJson = localStorage.getItem(STATS_KEY);
  if (statsJson) return JSON.parse(statsJson) as UserStats;
  return emptyStats();
};

export const getSolitaireStats = (): UserStats => {
  const statsJson = localStorage.getItem(SOLITAIRE_STATS_KEY);
  if (statsJson) return JSON.parse(statsJson) as UserStats;
  return emptyStats();
};

export const updateStats = (didWin: boolean) => {
  const stats = getStats();
  stats.gamesPlayed += 1;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (didWin) {
    stats.gamesWon += 1;
    if (stats.lastPlayedDate === getYesterdayDate()) {
      stats.currentStreak += 1;
    } else if (stats.lastPlayedDate !== today) {
      stats.currentStreak = 1;
    }

    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    stats.lastPlayedDate = today;
  } else if (stats.lastPlayedDate !== today) {
    // Only reset streak if they failed on a new day
    stats.currentStreak = 0;
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

// Solitaire streaks: consecutive wins in a row (per play session), not tied to calendar days.
export const updateSolitaireStats = (didWin: boolean) => {
  const stats = getSolitaireStats();
  stats.gamesPlayed += 1;

  if (didWin) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
  } else {
    stats.currentStreak = 0;
  }

  // Keep lastPlayedDate around for potential future use/analytics
  stats.lastPlayedDate = new Date().toISOString().slice(0, 10);

  localStorage.setItem(SOLITAIRE_STATS_KEY, JSON.stringify(stats));
};

const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
};
