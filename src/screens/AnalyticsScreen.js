import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { StorageService } from "../utils/storageService";

export default function AnalyticsScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStats();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStats = async () => {
    try {
      // Kunin lahat ng results mula sa storage
      const allLogs = await StorageService.getResults(); 
      
      if (allLogs && allLogs.length > 0) {
        // I-sort para ang pinakabago ang nasa itaas
        const sortedLogs = [...allLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
        setStats(sortedLogs);
        
        // Compute average score
        const totalScore = allLogs.reduce((acc, curr) => acc + curr.score, 0);
        setSummary({ 
          avg: Math.round(totalScore / allLogs.length), 
          total: allLogs.length 
        });
      }
    } catch (e) {
      console.log("Load Error:", e);
    }
  };

  // ETO ANG MAG-AAYOS NG REAL-TIME DISPLAY
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    
    // Format: MM/DD/YYYY
    const d = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    
    // Format: HH:MM AM/PM
    const t = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    return `${d} // ${t}`;
  };

  const getDifficultyTheme = (level) => {
    const diff = level?.toUpperCase();
    if (diff === 'HARD') return { color: '#ef4444', label: 'HARD_LVL' };
    if (diff === 'MEDIUM') return { color: '#f59e0b', label: 'MED_LVL' };
    return { color: '#10b981', label: 'EASY_LVL' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <Text style={styles.backText}>◄ BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>WELCOME TO INSIGHTS</Text>
          <Text style={styles.headerSub}>EXAMREADINESS ANALYTICS</Text>
        </View>
        <View style={{ width: 60 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainWrapper}>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>CORE_AVG</Text>
              <Text style={styles.summaryValue}>{summary.avg}%</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#6366f1' }]}>
              <Text style={[styles.summaryLabel, { color: '#fff', opacity: 0.7 }]}>SESSIONS</Text>
              <Text style={[styles.summaryValue, { color: '#fff' }]}>{summary.total}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>STUDENT: (RECENT ACTIVITY)</Text>

          {stats.map((item, i) => {
            const theme = getDifficultyTheme(item.difficulty);
            return (
              <View key={i} style={styles.statCard}>
                <View style={styles.statInfo}>
                  <View style={[styles.subjectIcon, { borderColor: theme.color + '40', backgroundColor: theme.color + '10' }]}>
                    <Text style={[styles.iconText, { color: theme.color }]}>
                      {item.subject ? item.subject.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  
                  <View>
                    <Text style={styles.subjectText}>{item.subject ? item.subject.toUpperCase() : 'UNKNOWN'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {/* DITO IPAPAKITA ANG REAL-TIME TIME */}
                        <Text style={styles.dateText}>{formatDateTime(item.date)}</Text>
                        <Text style={[styles.dateText, { color: theme.color, fontWeight: '900', fontSize: 8 }]}>
                           // {theme.label}
                        </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>{Math.round(item.score)}%</Text>
                  <View style={[styles.tag, { borderColor: item.score >= 75 ? '#10b981' : '#ef4444' }]}>
                    <Text style={[styles.tagText, { color: item.score >= 75 ? '#10b981' : '#ef4444' }]}>
                      {item.score >= 75 ? "PASSED" : "FAILED"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d" },
  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15,
    backgroundColor: "#02040d"
  },
  backBtnWrapper: { paddingVertical: 5 },
  backText: { color: "#6366f1", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: "900", color: "#fff", letterSpacing: 2 },
  headerSub: { fontSize: 8, color: "#6366f1", fontWeight: "800", marginTop: 2 },
  scrollContent: { paddingVertical: 25, alignItems: 'center' },
  mainWrapper: { width: '100%', maxWidth: 450, paddingHorizontal: 20 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  summaryCard: { flex: 1, backgroundColor: '#0b0c14', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1a1b26' },
  summaryLabel: { fontSize: 9, fontWeight: '900', color: '#6366f1', letterSpacing: 1, marginBottom: 5 },
  summaryValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#475569', marginBottom: 15, letterSpacing: 1 },
  statCard: { 
    backgroundColor: "#0b0c14", padding: 15, borderRadius: 18, 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    marginBottom: 10, borderWidth: 1, borderColor: "#1a1b26" 
  },
  statInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  iconText: { fontSize: 18, fontWeight: '900' },
  subjectText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  dateText: { fontSize: 9, color: "#475569", marginTop: 2 },
  scoreContainer: { alignItems: "flex-end", gap: 4 },
  scoreText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  tagText: { fontSize: 8, fontWeight: '900' }
});