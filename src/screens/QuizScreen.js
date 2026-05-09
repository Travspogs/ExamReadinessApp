import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
  useWindowDimensions
} from 'react-native';
import { questions } from '../data/questions';


export default function QuizScreen({ route, navigation }) {
  const { subject, difficulty } = route.params || {};
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizSet, setQuizSet] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});

  // --- ANIMATIONS ---
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const btnBgAnim = useRef(new Animated.Value(0)).current; 

  const isLastQuestion = currentIdx + 1 === quizSet.length;
  const currentSelection = userAnswers[currentIdx] || "";

  const getDuration = () => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 10;
      case 'medium': return 20;
      case 'hard': return 30;
      default: return 30;
    }
  };

  const handlePressIn = () => {
    if (!currentSelection) return;
    Animated.timing(btnBgAnim, { toValue: 1, duration: 120, useNativeDriver: false }).start();
  };

  const handlePressOut = () => {
    Animated.timing(btnBgAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const interpolatedBtnColor = btnBgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0b0c14', '#a855f7'] 
  });

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (subject && difficulty && questions[subject] && questions[subject][difficulty]) {
      const allQuestionsPool = questions[subject][difficulty];
      const selectedTen = [...allQuestionsPool].sort(() => Math.random() - 0.5).slice(0, 10);
      setQuizSet(selectedTen);
      setTimeLeft(getDuration());
      setLoading(false);
    } else {
      setLoading(false);
      Alert.alert("Error", "No questions found.", [{ text: "Back", onPress: () => navigation.goBack() }]);
    }
  }, [subject, difficulty]);

  useEffect(() => {
    if (loading || quizSet.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleNext();
          return 0;
        }
        if (prev <= 6) triggerShake(); 
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIdx, loading]);

  const handleNext = () => {
    Vibration.vibrate(15);
    if (currentIdx + 1 < quizSet.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(getDuration());
    } else {
      calculateFinalResults();
    }
  };

  const sanitize = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, "");
  };

  const calculateFinalResults = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let score = 0;
    let wrongs = [];
    quizSet.forEach((q, i) => {
      if (sanitize(userAnswers[i]) === sanitize(q.answer)) score++;
      else wrongs.push({ ...q, userAnswer: userAnswers[i] });
    });

    navigation.replace("Result", {
      score, totalQuestions: quizSet.length, subject, difficulty, wrongAnswers: wrongs
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6366f1" size="large" /></View>;

  const currentQ = quizSet[currentIdx];
  const timerColor = timeLeft <= 5 ? "#ef4444" : "#a855f7";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Text style={styles.nodeText}>SUBJECT: {subject?.toUpperCase()}</Text>
            <Text style={styles.difficultyTag}>{difficulty?.toUpperCase()} MODE</Text>
          </View>
          <View style={styles.headerCenter}>
            <Animated.View style={[styles.timerBadge, { borderColor: timerColor, transform: [{ translateX: shakeAnim }] }]}>
              <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
            </Animated.View>
          </View>
          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            <Text style={styles.progressText}>{currentIdx + 1}/{quizSet.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.innerContainer, isWeb && { maxWidth: 600, alignSelf: 'center' }]}>
            <View style={styles.titleSection}>
              <Text style={styles.subTag}>Reminder:</Text>
              <Text style={styles.mainTitle}>FOCUS AND{'\n'}GOODLUCK</Text>
            </View>

            <View style={styles.boardContainer}>
              <View style={styles.accordionBoard}>
                
                {/* BOARD HEADER */}
                <View style={styles.boardHeader}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.typeBadge}>{currentQ?.type}</Text>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.hintText}>AUTO PROCEED</Text>
                  </View>
                  <Text style={styles.questionText}>{currentQ?.question}</Text>
                </View>

                {/* BOARD BODY */}
                <View style={styles.boardBody}>
                  <View style={styles.instructWrapper}>
                    <Text style={styles.instructTitle}>INSTRUCTION:</Text>
                    <Text style={styles.instructSub}>Case Insensitive • Symbols & Spaces Ignored</Text>
                  </View>

                  {currentQ?.type === "MCQ" ? (
                    <View style={styles.optionsList}>
                      {currentQ?.choices?.map((choice, i) => (
                        <TouchableOpacity 
                          key={i} 
                          style={[styles.choiceRow, currentSelection === choice && styles.choiceActive]} 
                          onPress={() => setUserAnswers({...userAnswers, [currentIdx]: choice})}
                        >
                          <Text style={[styles.choiceLabel, currentSelection === choice && { color: '#fff' }]}>{choice}</Text>
                          <View style={[styles.actionCircle, currentSelection === choice && styles.actionCircleActive]}>
                            <Text style={[styles.plusSign, currentSelection === choice && { color: '#fff' }]}>{currentSelection === choice ? '✓' : '+'}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.terminalContainer}>
                      <Text style={styles.terminalLabel}>DOUBLE CHECK ANSWER</Text>
                      <TextInput 
                        style={styles.terminalInput}
                        placeholder="Type your Answer"
                        placeholderTextColor="#475569"
                        value={currentSelection}
                        onChangeText={(val) => setUserAnswers({...userAnswers, [currentIdx]: val})}
                        autoCorrect={false}
                        autoCapitalize="none"
                        // Web specific outline remove
                        {...(Platform.OS === 'web' && { outlineStyle: 'none' })}
                      />
                    </View>
                  )}
                </View>

                {/* ACTION FOOTER */}
                <View style={styles.footerContainer}>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${((currentIdx + 1) / quizSet.length) * 100}%` }]} />
                  </View>

                  <Animated.View style={{ backgroundColor: interpolatedBtnColor, borderRadius: 18, borderWidth: 1, borderColor: '#ffffff10' }}>
                    <TouchableOpacity 
                      activeOpacity={1} 
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      onPress={handleNext}
                      disabled={!currentSelection}
                      style={[styles.modernNextBtn, !currentSelection && styles.modernBtnDisabled]}
                    >
                      <Text style={styles.modernBtnText}>
                        {isLastQuestion ? "FINISH" : "NEXT"}
                      </Text>
                      <Text style={styles.arrowIcon}>{isLastQuestion ? "✓" : "→"}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>

              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d" },
  center: { flex: 1, backgroundColor: "#02040d", justifyContent: 'center', alignItems: 'center' },
  innerContainer: { width: '100%' },
  
  header: { 
    paddingHorizontal: 25, 
    paddingTop: Platform.OS === 'ios' ? 10 : 40, 
    paddingBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerSide: { flex: 1 },
  headerCenter: { flex: 1, alignItems: 'center' },
  nodeText: { color: "#6366f1", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  difficultyTag: { color: "#475569", fontSize: 8, fontWeight: "bold" },
  progressText: { color: "#475569", fontSize: 11, fontWeight: "bold" },
  timerBadge: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#0b0c14', minWidth: 70, alignItems: 'center' },
  timerText: { fontSize: 15, fontWeight: '900' },
  
  scrollContent: { paddingHorizontal: 25, paddingBottom: 50 },
  titleSection: { marginVertical: 35 },
  subTag: { color: "#6366f1", fontSize: 12, fontWeight: "700", marginBottom: 8, letterSpacing: 1 },
  mainTitle: { color: "#fff", fontSize: 32, fontWeight: "900", lineHeight: 38 },
  
  boardContainer: { width: '100%', alignItems: 'center' },
  accordionBoard: { width: '100%', backgroundColor: "#0f111a", borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: 'hidden' },
  
  boardHeader: { padding: 28, borderBottomWidth: 1, borderBottomColor: "#1a1b26" },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeBadge: { color: "#a855f7", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#334155', marginHorizontal: 10 },
  hintText: { color: "#475569", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  questionText: { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 28 },
  
  boardBody: { padding: 24 },
  instructWrapper: { marginBottom: 24, alignItems: 'center', backgroundColor: '#ffffff05', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#ffffff10' },
  instructTitle: { fontSize: 9, color: "#6366f1", fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  instructSub: { fontSize: 10, color: "#94a3b8", fontWeight: '600' },
  
  optionsList: { gap: 14 },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: "#02040d", padding: 18, borderRadius: 16, borderWidth: 1, borderColor: "#1a1b26" },
  choiceActive: { borderColor: '#a855f750', backgroundColor: '#a855f710' },
  choiceLabel: { color: "#94a3b8", fontSize: 15, fontWeight: "600" },
  actionCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#1a1b26", justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: "#6366f130" },
  actionCircleActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  plusSign: { color: "#6366f1", fontWeight: "bold", fontSize: 14 },

  terminalContainer: { backgroundColor: "#02040d", borderRadius: 16, borderBottomWidth: 2, borderBottomColor: '#6366f190', overflow: 'hidden' },
  terminalLabel: { fontSize: 8, color: '#475569', fontWeight: '900', letterSpacing: 1.5, paddingHorizontal: 18, paddingTop: 12 },
  terminalInput: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 8, color: "#fff", fontSize: 16, fontWeight: '700' },

  footerContainer: { backgroundColor: '#0f111a', padding: 24, borderTopWidth: 1, borderTopColor: '#1a1b26' },
  progressBarBackground: { height: 5, backgroundColor: '#1a1b26', borderRadius: 10, marginBottom: 24, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#a855f7', borderRadius: 10 },
  modernNextBtn: { height: 62, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  modernBtnDisabled: { opacity: 0.3 },
  modernBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginRight: 12 },
  arrowIcon: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});