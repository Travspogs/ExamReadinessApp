import { useEffect } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { StorageService } from '../utils/storageService';

export default function ResultScreen({ route, navigation }) {
  const { score = 0, totalQuestions = 0, subject = "Unknown", difficulty = "Normal", wrongAnswers = [] } = route.params || {};
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const isPassed = percentage >= 75;
  const status = isPassed ? "SUBJECTS READY" : "REVIEW REQUIRED";
  const statusColor = isPassed ? "#10b981" : "#ef4444";
  const bannerMsg = isPassed ? "SUCCESS: PASSED" : "NOT PASSED";

  const isWeb = Platform.OS === 'web';
  const isSmallHeight = SCREEN_HEIGHT < 700;

  useEffect(() => {
    const saveData = async () => {
      try {
        const newResult = {
          subject: subject || "General",
          difficulty: difficulty || "Normal",
          score: Math.round(percentage),
          totalQuestions: totalQuestions,
          date: new Date().toISOString(),
        };

        await StorageService.saveQuizResult(newResult);
        console.log("SYSTEM LOG: Stats synchronized to unique user key.");
      } catch (e) {
        console.error("Failed to save log", e);
      }
    };

    if (totalQuestions > 0) {
      saveData();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrapper, isWeb && { maxWidth: 500 }]}>
          
          {/* TOP STATUS INDICATOR */}
          <View style={[styles.scoreSection, isSmallHeight && { marginBottom: 20 }]}>
            <Text style={[styles.recalibrationText, { color: statusColor }]}>
              {status} <Text style={{color: '#475569'}}>_V4.0</Text>
            </Text>
            
            <View style={[
              styles.outerCircle, 
              { borderColor: statusColor, shadowColor: statusColor },
              isSmallHeight && { width: 150, height: 150, borderRadius: 75 }
            ]}>
              <View style={styles.innerCircle}>
                <Text style={[styles.scoreNumber, isSmallHeight && { fontSize: 44 }]}>{score}</Text>
                <View style={styles.scoreDivider} />
                <Text style={[styles.totalNumber, isSmallHeight && { fontSize: 18 }]}>{totalQuestions}</Text>
              </View>
            </View>
          </View>

          {/* MISSION INFO */}
          <View style={[styles.infoBox, isSmallHeight && { marginBottom: 20 }]}>
            <Text style={[styles.subjectText, isSmallHeight && { fontSize: 22 }]}>{subject?.toUpperCase()}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.difficultyBadge, { borderColor: statusColor + '40' }]}>
                  <Text style={[styles.difficultyText, { color: statusColor }]}>
                      {difficulty?.toUpperCase()} // {Math.round(percentage)}%
                  </Text>
              </View>
            </View>
          </View>

          {/* CONSOLE MESSAGE */}
          <View style={[styles.statusBanner, isSmallHeight && { marginBottom: 25 }]}>
            <View style={styles.bannerHeader}>
              <Text style={styles.bannerHeaderText}>OUTPUT</Text>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
            <Text style={[styles.statusMessage, { color: statusColor }]}>
              {bannerMsg}
            </Text>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: isPassed ? '#6366f1' : '#1e293b' }]} 
              onPress={() => navigation.replace("Quiz", { subject, difficulty })}
            >
              <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
            </TouchableOpacity>

            <View style={styles.secondaryRow}>
              <TouchableOpacity 
                style={styles.secondaryBtn} 
                onPress={() => navigation.navigate("Review", { wrongAnswers })}
              >
                <Text style={styles.secondaryBtnText}>REVIEW MISTAKES</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryBtn, styles.homeBtnBorder]} 
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.homeBtnText}>RETURN HOME</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d" },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30 },
  contentWrapper: { width: '100%', alignItems: 'center', paddingHorizontal: 25 },
  
  scoreSection: { alignItems: 'center', marginBottom: 35 },
  recalibrationText: { fontSize: 10, fontWeight: "900", letterSpacing: 3, marginBottom: 25 },
  
  outerCircle: { 
    width: 180, height: 180, borderRadius: 90, borderWidth: 2, 
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
      android: { elevation: 20 },
      web: { boxShadow: '0 0 20px rgba(0,0,0,0.5)' }
    })
  },
  innerCircle: { alignItems: 'center' },
  scoreNumber: { color: "#fff", fontSize: 56, fontWeight: "900", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  scoreDivider: { width: 50, height: 2, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 8 },
  totalNumber: { color: "#475569", fontSize: 22, fontWeight: "700", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  infoBox: { alignItems: 'center', marginBottom: 35 },
  subjectText: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 2, textAlign: 'center' },
  badgeRow: { marginTop: 10 },
  difficultyBadge: { 
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, 
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' 
  },
  difficultyText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  statusBanner: { 
    backgroundColor: "#0b0c14", width: '100%', padding: 18, 
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 40 
  },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bannerHeaderText: { color: '#475569', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusMessage: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  buttonGroup: { width: '100%', gap: 12 },
  primaryBtn: { padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, backgroundColor: "#0b0c14", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: 'center' },
  secondaryBtnText: { color: "#94a3b8", fontSize: 10, fontWeight: "900", letterSpacing: 1, textAlign: 'center' },
  homeBtnBorder: { borderColor: "rgba(99, 102, 241, 0.3)" },
  homeBtnText: { color: "#6366f1", fontSize: 10, fontWeight: "900", letterSpacing: 1, textAlign: 'center' }
});