import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { questions } from '../data/questions';
import { StorageService } from "../utils/storageService";

const { width } = Dimensions.get('window');

export default function QuizScreen({ route, navigation }) {
  const { subject, difficulty } = route.params || {};
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizSet, setQuizSet] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); 

  useEffect(() => {
    if (subject && difficulty && questions[subject] && questions[subject][difficulty]) {
      setQuizSet(questions[subject][difficulty]);
      setLoading(false);
    } else {
      setLoading(false);
      Alert.alert(
        "Data Error", 
        `No questions found for ${subject} (${difficulty}).`,
        [{ text: "Go Back", onPress: () => navigation.goBack() }]
      );
    }
  }, [subject, difficulty]);

  const handleSelect = (val) => {
    setUserAnswers({ ...userAnswers, [currentIdx]: val });
  };

  const handleNext = () => {
    if (currentIdx + 1 < quizSet.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      calculateFinalResults();
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  
  const sanitize = (str) => {
    return str.toString()
      .toLowerCase()
      .replace(/[-_]/g, '') 
      .replace(/\s+/g, ''); 
  };

  const calculateFinalResults = async () => {
    let finalScoreCount = 0;
    let wrongAnswersList = [];

    quizSet.forEach((q, index) => {
      const uAns = userAnswers[index] || "";
      
      
      const isCorrect = sanitize(uAns) === sanitize(q.answer);
      
      if (isCorrect) {
        finalScoreCount++;
      } else {
        wrongAnswersList.push({ ...q, userAnswer: uAns });
      }
    });

    const scorePercentage = (finalScoreCount / quizSet.length) * 100;

    try {
      await StorageService.saveQuizResult({
        subject: subject,
        difficulty: difficulty,
        score: scorePercentage,
        date: new Date().toISOString(), 
      });
    } catch (error) {
      console.log("Error saving results:", error);
    }

    navigation.replace("Result", { 
      score: finalScoreCount, 
      totalQuestions: quizSet.length, 
      subject, 
      difficulty, 
      wrongAnswers: wrongAnswersList 
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>;

  if (quizSet.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{color: '#fff'}}>No Questions Available</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{color: '#6366f1', marginTop: 10}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = quizSet[currentIdx];
  const currentSelection = userAnswers[currentIdx] || "";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <Text style={styles.nodeText}>SUBJECT : {subject?.toUpperCase()} EXAM</Text>
          <Text style={styles.progressText}>{currentIdx + 1}/{quizSet.length}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.titleSection}>
            <Text style={styles.subTag}>Reminder:</Text>
            <Text style={styles.mainTitle}>FOCUS AND{'\n'}GOODLUCK</Text>
          </View>

          <View style={styles.boardContainer}>
            <View style={styles.accordionBoard}>
              
              <View style={styles.boardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nodeId}>Reminder! {currentQ?.type}</Text>
                  {}
                  <Text style={styles.caseHint}>(Case Insensitive / Symbols Ignored)</Text>
                  <Text style={styles.questionText}>{currentQ?.question}</Text>
                </View>
              </View>

              <View style={styles.boardBody}>
                <Text style={styles.instructText}>DOUBLE CHECK ANSWER</Text>

                {currentQ?.type === "MCQ" ? (
                  <View style={styles.optionsList}>
                    {currentQ?.choices?.map((choice, i) => (
                      <TouchableOpacity 
                        key={i} 
                        style={[
                          styles.choiceRow, 
                          currentSelection === choice && styles.choiceActive
                        ]} 
                        onPress={() => handleSelect(choice)}
                      >
                        <Text style={[styles.choiceLabel, currentSelection === choice && { color: '#fff' }]}>{choice}</Text>
                        <View style={[styles.actionCircle, currentSelection === choice && styles.actionCircleActive]}>
                          <Text style={[styles.plusSign, currentSelection === choice && { color: '#fff' }]}>
                            {currentSelection === choice ? '✓' : '+'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.terminalInput}
                      placeholder="Type your Answer"
                      placeholderTextColor="#475569"
                      value={currentSelection}
                      onChangeText={handleSelect}
                    />
                  </View>
                )}
              </View>

              <View style={styles.splitFooter}>
                <TouchableOpacity 
                  style={[styles.footerHalf, styles.footerBack, currentIdx === 0 && { opacity: 0.2 }]} 
                  onPress={handleBack}
                  disabled={currentIdx === 0}
                >
                  <Text style={styles.footerBackText}>BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.footerHalf, styles.footerNext, !currentSelection && styles.footerDisabled]} 
                  onPress={handleNext}
                  disabled={!currentSelection}
                >
                  <Text style={styles.footerNextText}>
                    {currentIdx + 1 === quizSet.length ? "FINISH" : "NEXT"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.boardShadow} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d" },
  center: { flex: 1, backgroundColor: "#02040d", justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 30, paddingTop: 50, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeText: { color: "#6366f1", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  progressText: { color: "#475569", fontSize: 11, fontWeight: "bold" },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 50 },
  titleSection: { marginVertical: 30 },
  subTag: { color: "#6366f1", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  mainTitle: { color: "#fff", fontSize: 32, fontWeight: "800", lineHeight: 36 },
  boardContainer: { width: '100%', alignItems: 'center' },
  accordionBoard: { width: '100%', maxWidth: 500, backgroundColor: "#0b0c14", borderRadius: 24, borderWidth: 1, borderColor: "#6366f130", overflow: 'hidden' },
  boardHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: "#1a1b26" },
  nodeId: { color: "#a855f7", fontSize: 9, fontWeight: "900", marginBottom: 2 },
  caseHint: { color: "#475569", fontSize: 8, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 }, // NEW STYLE
  questionText: { color: "#fff", fontSize: 18, fontWeight: "800", lineHeight: 24 },
  boardBody: { padding: 20 },
  instructText: { fontSize: 10, color: "#475569", marginBottom: 15, fontWeight: '800', letterSpacing: 1 },
  optionsList: { gap: 12 },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: "#02040d", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#1a1b26" },
  choiceActive: { borderColor: '#a855f7', backgroundColor: '#a855f715' },
  choiceLabel: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  actionCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#1a1b26", justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: "#6366f130" },
  actionCircleActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  plusSign: { color: "#6366f1", fontWeight: "bold", fontSize: 14 },
  inputWrapper: { backgroundColor: "#02040d", borderRadius: 14, borderWidth: 1, borderColor: "#1a1b26" },
  terminalInput: { padding: 16, color: "#fff", fontSize: 15 },
  splitFooter: { flexDirection: 'row', height: 70, borderTopWidth: 1, borderTopColor: '#1a1b26' },
  footerHalf: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footerBack: { backgroundColor: '#0f111a' },
  footerNext: { backgroundColor: '#a855f7' },
  footerBackText: { color: '#475569', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  footerNextText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  footerDisabled: { backgroundColor: '#1a1b26', opacity: 0.5 },
  boardShadow: { height: 10, width: '92%', backgroundColor: "#0b0c1480", alignSelf: 'center', marginTop: -5, borderRadius: 20, zIndex: -1, borderWidth: 1, borderColor: "#1a1b26" },
});