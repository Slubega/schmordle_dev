import { UserStats } from '../interfaces/types';

const STATS_KEY = 'schmordleStats';

export const getStats = (): UserStats => {
  const statsJson = localStorage.getItem(STATS_KEY);
  if (statsJson) {
    return JSON.parse(statsJson) as UserStats;
  }
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: '',
  };
};

export const updateStats = (didWin: boolean) => {
  const stats = getStats();
  stats.gamesPlayed++;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (didWin) {
    stats.gamesWon++;
    if (stats.lastPlayedDate === getYesterdayDate()) {
      stats.currentStreak++;
    } else if (stats.lastPlayedDate !== today) {
        stats.currentStreak = 1;
    }
    
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    stats.lastPlayedDate = today;
  } else {
    // Only reset streak if they failed on a new day
    if (stats.lastPlayedDate !== today) {
        stats.currentStreak = 0;
    }
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
}
