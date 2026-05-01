import { useEffect } from 'react';
import { Dimensions, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StorageService } from '../utils/storageService';

const { width } = Dimensions.get('window');

export default function ResultScreen({ route, navigation }) {
  const { score = 0, totalQuestions = 0, subject = "Unknown", difficulty = "Normal", wrongAnswers = [] } = route.params || {};
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  
  const isPassed = percentage >= 75;
  const status = isPassed ? "SUBJECTS READY" : "REVIEW REQUIRED";
  const statusColor = isPassed ? "#10b981" : "#ef4444";
  const bannerMsg = isPassed ? "SUCCESS: PASSED" : "NOT PASSED";

  useEffect(() => {
    const saveData = async () => {
      try {
        const newResult = {
          subject: subject || "General",
          difficulty: difficulty || "Normal",
          score: Math.round(percentage), // Ginawa nating percentage ang score para sa analytics
          totalQuestions: totalQuestions,
          date: new Date().toLocaleDateString(), // Para maganda ang format sa logs
        };

        await StorageService.saveResult(newResult);
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
      
      <View style={styles.contentWrapper}>
        
        {/* TOP STATUS INDICATOR */}
        <View style={styles.scoreSection}>
          <Text style={[styles.recalibrationText, { color: statusColor }]}>
            {status} <Text style={{color: '#475569'}}>_V4.0</Text>
          </Text>
          
          <View style={[styles.outerCircle, { borderColor: statusColor, shadowColor: statusColor }]}>
            <View style={styles.innerCircle}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <View style={styles.scoreDivider} />
              <Text style={styles.totalNumber}>{totalQuestions}</Text>
            </View>
          </View>
        </View>

        {/* MISSION INFO */}
        <View style={styles.infoBox}>
          <Text style={styles.subjectText}>{subject?.toUpperCase()}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.difficultyBadge, { borderColor: statusColor + '40' }]}>
                <Text style={[styles.difficultyText, { color: statusColor }]}>
                    {difficulty?.toUpperCase()} // {Math.round(percentage)}%
                </Text>
            </View>
          </View>
        </View>

        {/* CONSOLE MESSAGE */}
        <View style={styles.statusBanner}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d", justifyContent: 'center', alignItems: 'center' },
  contentWrapper: { width: '100%', maxWidth: 450, alignItems: 'center', padding: 25 },
  
  scoreSection: { alignItems: 'center', marginBottom: 35 },
  recalibrationText: { fontSize: 10, fontWeight: "900", letterSpacing: 3, marginBottom: 25 },
  
  outerCircle: { 
    width: 180, height: 180, borderRadius: 90, borderWidth: 2, 
    justifyContent: 'center', alignItems: 'center',
    elevation: 20, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20
  },
  innerCircle: { alignItems: 'center' },
  scoreNumber: { color: "#fff", fontSize: 56, fontWeight: "900", fontFamily: 'monospace' },
  scoreDivider: { width: 50, height: 2, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 8 },
  totalNumber: { color: "#475569", fontSize: 22, fontWeight: "700", fontFamily: 'monospace' },

  infoBox: { alignItems: 'center', marginBottom: 35 },
  subjectText: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 2 },
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
  statusMessage: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, fontFamily: 'monospace' },

  buttonGroup: { width: '100%', gap: 12 },
  primaryBtn: { padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: { flex: 1, backgroundColor: "#0b0c14", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: 'center' },
  secondaryBtnText: { color: "#94a3b8", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  homeBtnBorder: { borderColor: "rgba(99, 102, 241, 0.3)" },
  homeBtnText: { color: "#6366f1", fontSize: 10, fontWeight: "900", letterSpacing: 1 }
});