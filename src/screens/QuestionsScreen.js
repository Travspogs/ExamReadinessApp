import AsyncStorage from '@react-native-async-storage/async-storage';

// Function para i-save ang score
const saveQuizResult = async (subjectName, score) => {
  try {
    // 1. Kunin ang lumang records
    const savedProgress = await AsyncStorage.getItem('user_progress');
    let progress = savedProgress ? JSON.parse(savedProgress) : {
      "Mathematics": 0, "English": 0, "Science": 0, 
      "Filipino": 0, "Computer Science": 0, "History": 0
    };

    // 2. I-compute ang percentage (10 items per subject sa data mo)
    const percentage = (score / 10) * 100;

    // 3. I-update ang specific subject
    progress[subjectName] = percentage;

    // 4. I-save pabalik sa Storage
    await AsyncStorage.setItem('user_progress', JSON.stringify(progress));
    
    console.log(`Saved: ${subjectName} - ${percentage}%`);
  } catch (e) {
    console.error("Error saving progress", e);
  }
};