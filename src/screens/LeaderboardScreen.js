import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { StorageService } from "../utils/storageService";

export default function LeaderboardScreen({ navigation }) {
  const [rankings, setRankings] = useState([]);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGlobalRankings();
    });
    return unsubscribe;
  }, [navigation]);

  const loadGlobalRankings = async () => {
    try {
      const logs = await StorageService.getResults(); 
      let myTotalPoints = 0;
      
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

      const mockUsers = [
        { username: "CYBER_GHOST", totalPoints: 850, rank: "DIAMOND", isMe: false },
        { username: "ROOT_ADMIN", totalPoints: 620, rank: "PLATINUM", isMe: false },
        { username: "VOID_WALKER", totalPoints: 410, rank: "GOLD", isMe: false },
        { username: "X_PROTOCOL", totalPoints: 150, rank: "BRONZE", isMe: false },
      ];

      const combinedList = [...mockUsers, myData].sort((a, b) => b.totalPoints - a.totalPoints);
      setRankings(combinedList);

    } catch (e) {
      console.log("Leaderboard Error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ADAPTIVE HEADER */}
      <View style={styles.header}>
        <View style={[styles.headerInner, isWeb && { maxWidth: 800, alignSelf: 'center' }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
            <Text style={styles.backBtnText}>◄ BACK</Text>
            </TouchableOpacity>
            <Text style={styles.title}>OVERALL<Text style={{color: '#a855f7'}}> RANKINGS</Text></Text>
            <View style={{width: 60}} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollPadding} 
        showsVerticalScrollIndicator={isWeb}
      >
        <View style={[styles.mainWrapper, isWeb && { maxWidth: 600 }]}>
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
    backgroundColor: '#02040d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    ...Platform.select({
      web: { position: 'sticky', top: 0, zIndex: 10 }
    })
  },
  headerInner: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: '100%',
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 10 : 50, 
    paddingBottom: 15,
    alignItems: "center",
  },
  backBtnWrapper: { paddingVertical: 5 },
  backBtnText: { color: "#6366f1", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  title: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  scrollPadding: { paddingVertical: 25, alignItems: 'center' },
  mainWrapper: { width: '100%', paddingHorizontal: 20 },
  sectionLabel: { color: "#475569", fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginBottom: 20 },
  rankCard: { 
    flexDirection: 'row', 
    backgroundColor: '#0b0c14', 
    padding: 16, 
    borderRadius: 18, 
    marginBottom: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    ...Platform.select({
        web: {
            transition: 'transform 0.2s ease',
            cursor: 'default'
        }
    })
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