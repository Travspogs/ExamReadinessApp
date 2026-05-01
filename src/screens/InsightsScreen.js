import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StorageService } from "../utils/storageService"; // DINAGDAG

const { width } = Dimensions.get("window");

export default function InsightsScreen({ navigation }) {
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
  const [stats, setStats] = useState({
    strength: "NONE",
    weakness: "NONE",
    accuracy: "0%",
    totalTries: "0",
    rank: "UNRANKED"
  });

  const loadAndAnalyze = async () => {
    try {
      // PINALITAN: Gagamit na tayo ng StorageService para sa updated results
      const logs = await StorageService.getResults(); 
      
      if (!logs || logs.length === 0) {
        setStats({
            strength: "N/A",
            weakness: "N/A",
            accuracy: "0%",
            totalTries: "0",
            rank: "UNRANKED"
        });
        return "Initial Data Insufficient. Please complete more challenges to generate a neural profile.";
      }

      // 2. Group by subject para makuha ang average per category (Filipino, Math, etc.)
      const grouped = logs.reduce((acc, log) => {
        const subName = log.subject || "Unknown";
        acc[subName] = acc[subName] || { totalScore: 0, count: 0 };
        acc[subName].totalScore += log.score; // Inayos mula percentage -> score
        acc[subName].count += 1;
        return acc;
      }, {});

      const modules = Object.entries(grouped).map(([name, data]) => ({
        name,
        avg: data.totalScore / data.count,
        tries: data.count
      }));

      // 3. FIND BEST AND WORST
      const sorted = [...modules].sort((a, b) => b.avg - a.avg);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      
      // 4. COMPUTE TOTALS
      const totalAccuracy = Math.round(logs.reduce((acc, curr) => acc + curr.score, 0) / logs.length);
      const totalAttempts = logs.length;

      setStats({
        strength: best.name.toUpperCase(),
        weakness: modules.length > 1 ? worst.name.toUpperCase() : "MORE DATA REQ.",
        accuracy: `${totalAccuracy}%`,
        totalTries: totalAttempts.toString(),
        rank: totalAccuracy >= 90 ? "GOLD" : totalAccuracy >= 75 ? "SILVER" : "BRONZE"
      });

      return `Neural Analysis Complete: Your mastery in ${best.name} is your greatest asset with ${Math.round(best.avg)}% stability. Your total system engagement is at ${totalAttempts} missions. ${modules.length > 1 ? `Focus on ${worst.name} to stabilize your overall core score.` : "Complete more subjects to unlock full comparative analytics."}`;

    } catch (e) {
      console.log(e);
      return "Error accessing neural data.";
    }
  };

  useEffect(() => {
    const startAnalysis = async () => {
      const report = await loadAndAnalyze();
      
      const scanTimer = setTimeout(() => {
        setIsAnalyzing(false);
        
        let index = 0;
        const interval = setInterval(() => {
          setAnalysisText(report.slice(0, index));
          index++;
          if (index > report.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
      }, 1500);
    };

    startAnalysis();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        <View style={styles.mainWrapper}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              {/* Back Button remains consistent */}
              <Text style={styles.backBtn}>◄ BACK</Text>
            </TouchableOpacity>
            <Text style={styles.title}>MY<Text style={{color: '#6366f1'}}>INSIGHTS</Text></Text>
            <View style={{width: 50}} /> 
          </View>

          <View style={styles.featuredCard}>
            <View style={styles.featuredHeader}>
              <Text style={styles.featuredLabel}>PERFORMANCE REPORT</Text>
              <View style={[styles.statusDot, {backgroundColor: isAnalyzing ? '#f59e0b' : '#10b981'}]} />
            </View>

            <View style={styles.typingContainer}>
              {isAnalyzing ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.loadingText}>SCANNING NEURAL DATA...</Text>
                </View>
              ) : (
                <Text style={styles.typingText}>
                  {analysisText}<Text style={styles.cursor}>_</Text>
                </Text>
              )}
            </View>

            <View style={styles.featuredActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => navigation.navigate("Analytics")}
              >
                <Text style={styles.actionBtnText}>VIEW ALL LOGS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.grid}>
              <StatCard label="STRENGTH" value={stats.strength} color="#3b82f6" />
              <StatCard label="WEAKNESS" value={stats.weakness} color="#ef4444" />
              <StatCard label="ACCURACY" value={stats.accuracy} color="#10b981" />
              <StatCard label="SYSTEM RANK" value={stats.rank} color="#a855f7" />
          </View>
          
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d" },
  scrollPadding: { paddingVertical: 24, alignItems: 'center' },
  mainWrapper: { width: '100%', maxWidth: 450, paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, alignItems: "center" },
  backBtn: { color: "#6366f1", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  featuredCard: { backgroundColor: "#0b0c14", padding: 24, borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.2)" },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  featuredLabel: { color: "#6366f1", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  typingContainer: { minHeight: 120 },
  typingText: { color: "#94a3b8", fontSize: 13, lineHeight: 22, fontWeight: "500", fontFamily: 'monospace' },
  cursor: { color: '#6366f1', fontWeight: 'bold' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: "#6366f1", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  featuredActions: { marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20 },
  actionBtn: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#6366f1', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  card: { width: "48%", padding: 18, borderRadius: 16, backgroundColor: "#0b0c14", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderLeftWidth: 4 },
  cardLabel: { color: "#475569", fontSize: 8, fontWeight: "900", marginBottom: 5, letterSpacing: 0.5 },
  cardValue: { color: "#fff", fontSize: 14, fontWeight: "800" }
});