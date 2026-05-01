// 1. IMPORT MO ITO SA TAAS NG EXAMSESSION.JS
import { StorageService } from "../utils/storageService";

// ... sa loob ng ExamSession component
const handleNext = async () => {
  const nextIndex = currentQuestionIndex + 1;

  if (nextIndex < questions.length) {
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswer(null);
  } else {
    // 🏁 DITO ANG SUBMIT LOGIC
    console.log("Exam Finished. Submitting...");

    try {
      // 🚀 I-save muna bago lumipat ng screen
      await StorageService.saveResult({
        subject: subject,
        score: score,
        total: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        date: new Date().toISOString(),
      });

      // 🚀 NAVIGATION: Siguraduhin na "Result" ang name sa Stack Navigator mo
      navigation.replace("Result", {
        subject,
        score,
        questions,
        wrongAnswers
      });
    } catch (error) {
      console.error("Error saving/navigating:", error);
      // Fallback para hindi ma-stuck ang user
      navigation.replace("Result", { subject, score, questions, wrongAnswers });
    }
  }
};