import { StorageService } from "./storageService";

export const ReviewService = {
  async saveWrongAnswers(wrongAnswers) {
    const existing = await StorageService.getResults();

    const updated = {
      type: "review",
      data: wrongAnswers,
      date: new Date().toISOString(),
    };

    await StorageService.saveResult(updated);
    return updated;
  },
};