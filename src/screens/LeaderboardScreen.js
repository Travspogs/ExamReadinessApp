import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StorageService } from "../utils/storageService";

const { width } = Dimensions.get("window");

export default function LeaderboardScreen({ navigation }) {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // Mahalaga ito: Nagre-refresh ang data tuwing papasok sa screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadGlobalRankings();
    });
    return unsubscribe;
  }, [navigation]);

  const loadGlobalRankings = async () => {
    try {
      // 1. Dito manggagaling ang isolation. 
      // StorageService.getResults() na ngayon ay unique per account.
      const logs = await StorageService.getResults(); 
      let myTotalPoints = 0;
      
      // Kung bago ang account, logs.length ay magiging 0, kaya myTotalPoints ay 0.
      if (logs && logs.length > 0) {
        myTotalPoints = logs.reduce((sum, log) => sum + Math.round(log.score), 0);
      }

      const userData = await AsyncStorage.getItem('current_user');
      const user = userData ? JSON.parse(userData) : { fullName: "STUDENT" };

      const myData = { 
        username: user.fullName.toUpperCase(), 
        totalPoints: myTotalPoints, 
        rank: myTotalPoints >= 1000 ? "DIAMOND" : myTotalPoints >= 600 ? "PLATINUM" : myTotalPoints >= 300 ? "GOLD" : "SILVER",
        isMe: true 
      };

      // 2. MOCK DATA (Laging andyan para may kumpetisyon)
      const mockUsers = [
        { username: "CYBER_GHOST", totalPoints: 850, rank: "DIAMOND", isMe: false },
        { username: "ROOT_ADMIN", totalPoints: 620, rank: "PLATINUM", isMe: false },
        { username: "VOID_WALKER", totalPoints: 410, rank: "GOLD", isMe: false },
        { username: "X_PROTOCOL", totalPoints: 150, rank: "BRONZE", isMe: false },
      ];

      // Pagsamahin at i-sort. Kung 0 points ka (bagong account), nasa huli ka.
      const combinedList = [...mockUsers, myData].sort((a, b) => b.totalPoints - a.totalPoints);
      setRankings(combinedList);

    } catch (e) {
      console.log("Leaderboard Error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <Text style={styles.backBtnText}>◄ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>OVERALL<Text style={{color: '#a855f7'}}> RANKINGS</Text></Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.mainWrapper}>
          <Text style={styles.sectionLabel}>PERFORMANCE LEADERBOARD</Text>
          
          {rankings.map((user, index) => (
            <View key={index} style={[styles.rankCard, user.isMe && styles.myRankCard]}>
              <View style={styles.rankNumBox}>
                <Text style={[styles.rankNum, user.isMe && {color: '#fff'}]}>
                  #{index + 1}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={[styles.username, user.isMe && {color: '#fff'}]}>
                  {user.username} {user.isMe ? "(YOU)" : ""}
                </Text>
                <Text style={[styles.rankClass, user.isMe && {color: '#a855f7'}]}>
                  {user.rank}
                </Text>
              </View>

              <View style={styles.pointsBox}>
                <Text style={[styles.pointsText, user.isMe && {color: '#fff'}]}>
                  {user.totalPoints}
                </Text>
                <Text style={styles.pointsLabel}>EXP_PTS</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02040d" },
  header: { 
    flexDirection: "row", justifyContent: "space-between", 
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15,
    alignItems: "center", backgroundColor: '#02040d' 
  },
  backBtnWrapper: { paddingVertical: 5 },
  backBtnText: { color: "#6366f1", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  title: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  scrollPadding: { paddingVertical: 25, alignItems: 'center' },
  mainWrapper: { width: '100%', maxWidth: 450, paddingHorizontal: 20 },
  sectionLabel: { color: "#475569", fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginBottom: 20 },
  rankCard: { 
    flexDirection: 'row', backgroundColor: '#0b0c14', 
    padding: 16, borderRadius: 18, marginBottom: 12, 
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  myRankCard: {
    borderColor: '#6366f180',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderLeftWidth: 5,
    borderLeftColor: '#6366f1'
  },
  rankNumBox: { width: 45, alignItems: 'center' },
  rankNum: { color: '#6366f1', fontWeight: "900", fontSize: 16 },
  userInfo: { flex: 1, marginLeft: 10 },
  username: { color: '#94a3b8', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  rankClass: { color: '#475569', fontSize: 8, fontWeight: '900', marginTop: 3, letterSpacing: 1 },
  pointsBox: { alignItems: 'flex-end' },
  pointsText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  pointsLabel: { color: '#475569', fontSize: 8, fontWeight: '900', marginTop: 2 }
});