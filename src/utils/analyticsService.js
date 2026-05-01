import { StorageService } from "./storageService";

export const AnalyticsService = {
  async saveAttempt({ subject, score, total }) {
    const accuracy = total === 0 ? 0 : (score / total) * 100;

    await StorageService.saveResult({
      subject,
      score,
      total,
      accuracy,
      date: new Date().toISOString(),
    });

    await StorageService.saveLeaderboard({
      subject,
      score,
      accuracy,
      date: new Date().toISOString(),
    });
  },

  async getAnalytics() {
    const results = await StorageService.getResults();

    const total = results.length;
    const avg =
      total === 0
        ? 0
        : results.reduce((s, r) => s + r.accuracy, 0) / total;

    return {
      totalAttempts: total,
      averageAccuracy: avg.toFixed(2),
    };
  },
};