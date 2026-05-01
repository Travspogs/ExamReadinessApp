import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  RESULTS: "results",
  LEADERBOARD: "leaderboard",
  CURRENT_USER: "current_user"
};

export const StorageService = {
  // FIXED: Sinigurado na hindi magbabalik ng generic key kung walang user
  async getUserKey(baseKey) {
    try {
      const userData = await AsyncStorage.getItem(KEYS.CURRENT_USER);
      if (userData) {
        const user = JSON.parse(userData);
        // Gamitin ang 'contact' (email o phone) bilang unique ID
        const identifier = user.contact || user.email;
        if (!identifier) return `${baseKey}_guest`;
        
        const safeId = identifier.replace(/[@.]/g, '_');
        return `${baseKey}_${safeId}`;
      }
      // Kapag walang naka-login, lagyan ng 'unauthenticated' para hindi humalo sa iba
      return `${baseKey}_unauthenticated`;
    } catch (e) {
      return `${baseKey}_error`;
    }
  },

  async saveQuizResult(data) {
    try {
      const { subject, difficulty, score, date } = data;
      const timestamp = date || new Date().toISOString(); 
      
      const userData = await AsyncStorage.getItem(KEYS.CURRENT_USER);
      const user = userData ? JSON.parse(userData) : { fullName: "Anonymous" };

      const resultEntry = {
        subject,
        difficulty,
        score: Math.round(score),
        date: timestamp,
        status: score >= 75 ? 'PASSED' : 'FAILED'
      };

      // 1. I-save sa Personal Results (Unique per User)
      const userSpecificKey = await this.getUserKey(KEYS.RESULTS);
      const existingResults = await this.getResults();
      await AsyncStorage.setItem(
        userSpecificKey,
        JSON.stringify([resultEntry, ...existingResults])
      );

      // 2. I-save sa Global Leaderboard (Lahat ng user makakakita nito)
      await this.saveLeaderboard({
        name: user.fullName,
        score: Math.round(score),
        subject: subject,
        date: timestamp
      });

      return true;
    } catch (e) {
      console.error("Save Error:", e);
      return false;
    }
  },

  async getResults() {
    try {
      const userSpecificKey = await this.getUserKey(KEYS.RESULTS);
      const data = await AsyncStorage.getItem(userSpecificKey);
      
      // Kung bagong account at wala pang data, dapat empty array [] ang ibalik
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveLeaderboard(entry) {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEADERBOARD);
      const existing = data ? JSON.parse(data) : [];

      const newEntry = {
        ...entry,
        exp: entry.score * 10, 
      };

      const updated = [newEntry, ...existing]
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

      await AsyncStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(updated));
    } catch (e) {
      console.error("Leaderboard Error:", e);
    }
  },

  async getLeaderboard() {
    const data = await AsyncStorage.getItem(KEYS.LEADERBOARD);
    return data ? JSON.parse(data) : [];
  },

  async getSubjectProgress() {
    const results = await this.getResults();
    const progress = {};
    
    results.forEach(res => {
      if (!progress[res.subject] || res.score > progress[res.subject].bestScore) {
        progress[res.subject] = { 
          bestScore: res.score,
          lastAttempt: res.date
        };
      }
    });
    
    return progress;
  }
};