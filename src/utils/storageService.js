import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  RESULTS: "results",
  LEADERBOARD: "leaderboard",
  CURRENT_USER: "current_user"
};

export const StorageService = {
  // UNIQUE KEY PER USER: Dito sinisiguro na hindi maghahalo ang data nina Juan at Maria
  async getUserKey(baseKey) {
    try {
      const userData = await AsyncStorage.getItem(KEYS.CURRENT_USER);
      if (userData) {
        const user = JSON.parse(userData);
        // Identifier prioritize: email -> contact -> fullName
        const identifier = user.email || user.contact || user.fullName;
        
        if (!identifier) return `${baseKey}_guest`;
        
        // Nililinis ang symbols para maging valid key name (@ at . ginagawang _)
        const safeId = identifier.replace(/[@.]/g, '_');
        const finalKey = `${baseKey}_${safeId}`;
        
        console.log(`[StorageService] Accessing storage for:`, finalKey);
        return finalKey;
      }
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

      // 1. Kunin ang unique key para sa user na ito
      const userSpecificKey = await this.getUserKey(KEYS.RESULTS);
      
      // 2. Kunin ang existing personal results
      const personalDataRaw = await AsyncStorage.getItem(userSpecificKey);
      const existingResults = personalDataRaw ? JSON.parse(personalDataRaw) : [];

      // 3. I-save pabalik (Personal)
      await AsyncStorage.setItem(
        userSpecificKey,
        JSON.stringify([resultEntry, ...existingResults])
      );

      // 4. Global Leaderboard (Para sa lahat ng users)
      await this.saveLeaderboard({
        name: user.fullName || "STUDENT",
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
      
      // Kung bagong user, automatic empty array []. 
      // Pag empty array, ang Insights screen ay magpapakita ng "MORE DATA REQ."
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("GetResults Error:", e);
      return [];
    }
  },

  async saveLeaderboard(entry) {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEADERBOARD);
      const existing = data ? JSON.parse(data) : [];

      const newEntry = {
        ...entry,
        exp: (entry.score || 0) * 10, 
      };

      const updated = [newEntry, ...existing]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 50);

      await AsyncStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(updated));
    } catch (e) {
      console.error("Leaderboard Error:", e);
    }
  },

  async getLeaderboard() {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEADERBOARD);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async getSubjectProgress() {
    try {
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
    } catch (e) {
      return {};
    }
  }
};