import { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { questions } from "../data/questions";
import { AnalyticsService } from "../utils/analyticsService";

const { width } = Dimensions.get("window");

export default function InputScreen({ route, navigation }) {
  const { subject } = route.params;
  const [qs, setQs] = useState([]);
  const [answers, setAnswers] = useState({});

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  useEffect(() => {
    setQs(shuffle(questions[subject] || []));
    setAnswers({});
  }, []);

  const handleSubmit = async () => {
    let score = 0;
    let wrongAnswers = [];

    qs.forEach((q, i) => {
      const userAns = answers[i];
      if (userAns && userAns.toString().toLowerCase().trim() === q.answer.toString().toLowerCase().trim()) {
        score++;
      } else {
        wrongAnswers.push({
          question: q.question,
          correct: q.answer,
          user: userAns || "No Answer",
        });
      }
    });

    await AnalyticsService.saveAttempt({ subject, score, total: qs.length });
    navigation.replace("Result", { subject, score, wrongAnswers, questions: qs });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 🔝 TERMINAL HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{"<"} EXIT_SESSION</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{subject.toUpperCase()}</Text>
          <Text style={styles.headerSub}>CORE_MODULE_ACTIVE</Text>
        </View>
        <View style={{ width: 80 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentWrapper}>
            {qs.map((q, i) => {
              const isMCQ = q.choices && q.choices.length > 0;
              return (
                <View key={i} style={styles.card}>
                  <View style={styles.qHeader}>
                    <Text style={styles.qNumber}>DATA_POINT_{i + 1}</Text>
                    <View style={styles.qStatus} />
                  </View>
                  
                  <Text style={styles.questionText}>{q.question}</Text>

                  {isMCQ ? (
                    <View style={styles.choiceGrid}>
                      {q.choices.map((choice, cIndex) => {
                        const isSelected = answers[i] === choice;
                        return (
                          <TouchableOpacity
                            key={cIndex}
                            activeOpacity={0.8}
                            onPress={() => setAnswers({ ...answers, [i]: choice })}
                            style={[styles.choiceBtn, isSelected && styles.choiceBtnActive]}
                          >
                            <View style={[styles.radio, isSelected && styles.radioActive]} />
                            <Text style={[styles.choiceText, isSelected && styles.choiceTextActive]}>
                              {choice}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>TYPE_INPUT_PROMPT:</Text>
                      <TextInput
                        placeholder="Waiting for input..."
                        placeholderTextColor="#475569"
                        onChangeText={(text) => setAnswers({ ...answers, [i]: text })}
                        style={styles.inputField}
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 150 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔘 CYBER SUBMIT BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020512", // ExamCore Dark Background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#0B0F19",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.2)",
  },
  backBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: "rgba(255,255,255,0.05)", 
    borderRadius: 6 
  },
  backBtnText: { 
    color: "#475569", 
    fontSize: 10, 
    fontWeight: "900", 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "900", color: "#fff", letterSpacing: 2 },
  headerSub: { fontSize: 9, color: "#6366f1", fontWeight: "900", letterSpacing: 1 },
  
  scrollContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#0B0F19",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowColor: "#6366f1",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qNumber: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6366f1",
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6366f1",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 28,
    marginBottom: 25,
  },
  choiceGrid: { gap: 12 },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  choiceBtnActive: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderColor: "#6366f1",
  },
  radio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#475569",
    marginRight: 15,
  },
  radioActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  choiceText: { fontSize: 15, color: "#94a3b8", fontWeight: "600" },
  choiceTextActive: { color: "#fff", fontWeight: "700" },
  
  inputWrapper: { marginTop: 10 },
  inputLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputField: {
    width: "100%",
    height: 60,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 15,
    color: "#6366f1",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: "transparent",
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    width: width * 0.8,
    maxWidth: 350,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
});