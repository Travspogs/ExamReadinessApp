import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
import { StorageService } from "../utils/storageService";

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [readinessText, setReadinessText] = useState("");
  const [subjectProgress, setSubjectProgress] = useState({});
  const [userName, setUserName] = useState("STUDENT");
  const [userEmail, setUserEmail] = useState(""); 
  const [profileImage, setProfileImage] = useState(null);
  
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [isSystemLoading, setIsSystemLoading] = useState(false);

  // Original Subjects Config - COLORS UNCHANGED
  const subjectsConfig = [
    { name: "Mathematics", color: "#6366f1", icon: "∑" }, 
    { name: "English", color: "#a855f7", icon: "A" },      
    { name: "Science", color: "#3b82f6", icon: "⚛" },      
    { name: "Filipino", color: "#ec4899", icon: "F" },     
    { name: "Computer_Science", color: "#10b981", icon: "</>" },     
    { name: "History", color: "#f59e0b", icon: "📜" }        
  ];

  const presetAvatars = [
    require('../assets/assets/avatar1.png'), 
    require('../assets/assets/avatar2.png'),
    require('../assets/assets/avatar3.png'),
    require('../assets/assets/avatar4.png'),
  ];

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        const user = JSON.parse(userData);
        const emailKey = user.email || user.contact || "default";
        const safeId = emailKey.replace(/[@.]/g, '_');
        setUserEmail(emailKey);

        const savedCustomName = await AsyncStorage.getItem(`custom_name_${safeId}`);
        const displayName = savedCustomName || user.fullName || user.fullname || user.name || user.username || "STUDENT";
        setUserName(displayName.toUpperCase());

        const savedAddr = await AsyncStorage.getItem(`address_${safeId}`);
        const savedBday = await AsyncStorage.getItem(`birthday_${safeId}`);
        const savedGndr = await AsyncStorage.getItem(`gender_${safeId}`);
        setAddress(savedAddr || "");
        setBirthday(savedBday || "");
        setGender(savedGndr || "");

        const savedImage = await AsyncStorage.getItem(`profile_image_${safeId}`);
        if (savedImage) {
          if (savedImage.startsWith('{')) { 
            const parsed = JSON.parse(savedImage);
            setProfileImage(presetAvatars[parsed.presetIndex]);
          } else {
            setProfileImage(savedImage);
          }
        } else {
          setProfileImage(null);
        }
      }
      const progress = await StorageService.getSubjectProgress();
      setSubjectProgress(progress || {});
    } catch (e) { console.log("Load Error:", e); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('PERMISSION DENIED', 'Access to gallery is required.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const safeId = userEmail.replace(/[@.]/g, '_');
      setProfileImage(uri);
      await AsyncStorage.setItem(`profile_image_${safeId}`, uri);
    }
  };

  const selectPresetAvatar = async (index) => {
    const safeId = userEmail.replace(/[@.]/g, '_');
    setProfileImage(presetAvatars[index]);
    await AsyncStorage.setItem(`profile_image_${safeId}`, JSON.stringify({ presetIndex: index }));
  };

  const handleSaveProfile = async () => {
    try {
        const safeId = userEmail.replace(/[@.]/g, '_');
        await AsyncStorage.setItem(`custom_name_${safeId}`, userName);
        await AsyncStorage.setItem(`address_${safeId}`, address);
        await AsyncStorage.setItem(`birthday_${safeId}`, birthday);
        await AsyncStorage.setItem(`gender_${safeId}`, gender);

        const userData = await AsyncStorage.getItem('current_user');
        if (userData) {
          let user = JSON.parse(userData);
          user.fullName = userName;
          await AsyncStorage.setItem('current_user', JSON.stringify(user));
        }
        Alert.alert("SYSTEM UPDATE", "Profile credentials synchronized successfully.");
        setShowProfile(false);
    } catch (e) {
        Alert.alert("SAVE ERROR", "Failed to update profile data.");
    }
  };

  const openDifficultySelector = (subject) => {
    setSelectedSubject(subject);
    setShowSelector(true);
  };

  const processNavigation = (diff) => {
    setShowSelector(false);
    setIsSystemLoading(true);
    setTimeout(() => {
      setIsSystemLoading(false);
      navigation.navigate("Quiz", { subject: selectedSubject, difficulty: diff });
    }, 1500); 
  };

  const handleLogout = () => {
    AsyncStorage.removeItem('current_user').then(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    });
  };

  const getDiffTheme = (level) => {
    switch (level) {
      case 'EASY': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'MEDIUM': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'HARD': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      default: return { color: '#fff', bg: 'rgba(255,255,255,0.05)' };
    }
  };

  const getActiveSubjectColor = () => {
    const subject = subjectsConfig.find(s => s.name === selectedSubject);
    return subject ? subject.color : "#6366f1"; // Indigo Default
  };

  useFocusEffect(useCallback(() => { loadUserData(); }, [userEmail]));

  useEffect(() => {
    let index = 0;
    const fullDesc = `Welcome, ${userName}. Academic modules synchronized. Readiness level: HIGH. System ready for challenge.`;
    setReadinessText(""); 
    const interval = setInterval(() => {
      setReadinessText(fullDesc.slice(0, index));
      index++;
      if (index > fullDesc.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [userName]);

  const RenderAvatar = ({ size = 'large' }) => {
    let avatarStyle = styles.avatarCircleLarge;
    let textStyle = styles.avatarLetterLarge;
    if (size === 'small') { avatarStyle = styles.dashboardAvatar; textStyle = styles.dashboardAvatarText; }
    else if (size === 'extraLarge') { avatarStyle = styles.avatarCircleExtraLarge; textStyle = styles.avatarLetterExtraLarge; }

    if (profileImage) {
      const source = typeof profileImage === 'number' ? profileImage : { uri: profileImage };
      return <Image source={source} style={avatarStyle} key={profileImage.toString()} />;
    }
    return (
      <View style={[avatarStyle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
        <Text style={textStyle}>{userName ? userName.charAt(0) : 'S'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#020617', '#020617', '#1e1b4b', '#020617']} style={StyleSheet.absoluteFill} />
      
      {isSystemLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={getActiveSubjectColor()} />
          <Text style={[styles.loadingText, { color: getActiveSubjectColor() }]}>SYNCHRONIZING MODULES</Text>
        </View>
      )}

      {/* PROFILE MODAL - Indigo Accent */}
      <Modal transparent visible={showProfile} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { height: '90%', width: '92%' }]}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>USER PROFILE</Text>
                <View style={styles.titleDivider} />
             </View>
            
            <TouchableOpacity onPress={pickImage} style={styles.mainAvatarContainerLarge}>
                <RenderAvatar size="extraLarge" />
                <View style={styles.editBadgeLarge}><Text style={styles.editBadgeText}>EDIT IMAGE</Text></View>
            </TouchableOpacity>

            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <View style={styles.settingsGroup}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput style={styles.profileInput} value={userName} onChangeText={(val) => setUserName(val.toUpperCase())} placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>ADDRESS</Text>
                  <TextInput style={styles.profileInput} value={address} onChangeText={setAddress} placeholder="Location" placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>BIRTHDAY</Text>
                  <TextInput style={styles.profileInput} value={birthday} onChangeText={setBirthday} placeholder="MM/DD/YYYY" placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>GENDER</Text>
                  <TextInput style={styles.profileInput} value={gender} onChangeText={setGender} placeholder="Select" placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput style={styles.profileInput} value={tempPassword} onChangeText={setTempPassword} placeholder="••••••••" secureTextEntry placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>
                
                <Text style={styles.settingLabel}>SYSTEM AVATARS</Text>
                <FlatList
                  data={presetAvatars}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => index.toString()}
                  contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => selectPresetAvatar(index)} style={styles.presetItemLarge}>
                      <Image source={item} style={styles.presetImg} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.saveBtn}>
                <Text style={styles.actionBtnText}>SAVE CREDENTIALS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.cancelBtn}>
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DIFFICULTY MODAL - Subject Accent */}
      <Modal transparent visible={showSelector} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>PROTOCOL SELECTOR</Text>
                <Text style={styles.modalSub}>{selectedSubject.toUpperCase()}</Text>
            </View>
            <View style={styles.levelGroup}>
                {["EASY", "MEDIUM", "HARD"].map((level) => {
                    const theme = getDiffTheme(level);
                    return (
                        <TouchableOpacity key={level} style={[styles.levelBtn, { borderColor: theme.color + '40', backgroundColor: theme.bg }]} onPress={() => processNavigation(level)}>
                            <View style={[styles.statusDot, { backgroundColor: theme.color }]} />
                            <Text style={[styles.levelBtnText, { color: theme.color }]}>{level} LEVEL</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <TouchableOpacity onPress={() => setShowSelector(false)} style={styles.abortBtn}><Text style={styles.abortText}>ABORT MISSION</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.headerLeft}>
            <View>
                <RenderAvatar size="small" />
                <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.nodeText}>SYSTEM ACCESS: <Text style={{color: '#6366f1'}}>{userName}</Text></Text>
              <Text style={styles.title}>EXAM<Text style={{color: '#a855f7'}}>READINESS</Text></Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={handleLogout}>
            <Text style={styles.exitText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <View style={styles.mainWrapper}>
              
              {/* HERO CARD - Card Layout Inspired by image but colors are yours */}
              <View style={styles.heroCard}>
                  <View style={styles.heroTop}>
                      <Text style={styles.heroLabel}>CORE PROTOCOL</Text>
                      <TouchableOpacity style={styles.insightBtn} onPress={() => navigation.navigate("Insights")}>
                          <Text style={styles.insightBtnText}>VIEW INSIGHTS</Text>
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.heroTitle}>The Future of Exam Readiness Is Here</Text>
                  <Text style={styles.typingText}>{readinessText}</Text>
                  
                  <TouchableOpacity 
                    style={styles.challengeBtn} 
                    onPress={() => {
                      const randomIndex = Math.floor(Math.random() * subjectsConfig.length);
                      openDifficultySelector(subjectsConfig[randomIndex].name);
                    }}
                  >
                    {/* Indigo-Purple Gradient for button */}
                    <LinearGradient colors={['#6366f1', '#a855f7']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        <Text style={styles.challengeBtnText}>ACTIVATE CHALLENGE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
              </View>

              {/* STATS TILES */}
              <View style={styles.statsRow}>
                  <TouchableOpacity style={styles.glassTile} onPress={() => navigation.navigate("Leaderboard")}>
                      <Text style={[styles.tileLabel, {color: '#a855f7'}]}>TOP PERFORMERS</Text>
                      <Text style={styles.tileValue}>LEADERBOARD</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.glassTile} onPress={() => navigation.navigate("Analytics")}>
                      <Text style={[styles.tileLabel, {color: '#6366f1'}]}>SYSTEM ANALYTICS</Text>
                      <Text style={styles.tileValue}>REAL-TIME LOGS</Text>
                  </TouchableOpacity>
              </View>

              {/* SUBJECTS GRID */}
              <Text style={styles.sectionTitle}>SELECT MODULE TO COMMENCE</Text>
              <View style={styles.moduleGrid}>
                {subjectsConfig.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.glassModule} onPress={() => openDifficultySelector(s.name)}>
                    <View style={[styles.iconBox, { backgroundColor: s.color + '15', borderColor: s.color + '40' }]}>
                      <Text style={{ color: s.color, fontWeight: '900', fontSize: 16 }}>{s.icon}</Text>
                    </View>
                    <Text style={styles.moduleName}>{s.name.replace('_', ' ').toUpperCase()}</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${subjectProgress[s.name]?.bestScore || 0}%`, backgroundColor: s.color }]} />
                      </View>
                      <Text style={[styles.pctText, {color: s.color}]}>{subjectProgress[s.name]?.bestScore || 0}%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.98)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  loadingText: { marginTop: 20, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 15, paddingTop: Platform.OS === 'android' ? 45 : 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  
  dashboardAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  dashboardAvatarText: { color: '#6366f1', fontSize: 20, fontWeight: '900' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#020617' },
  
  avatarCircleLarge: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarCircleExtraLarge: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#0f172a' },
  avatarLetterExtraLarge: { color: '#fff', fontSize: 50, fontWeight: '900' },
  mainAvatarContainerLarge: { alignItems: 'center', marginVertical: 20 },
  editBadgeLarge: { position: 'absolute', bottom: -5, backgroundColor: '#6366f1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#0f172a', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 20, width: '100%' },
  modalTitle: { color: '#a855f7', fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  titleDivider: { width: 40, height: 2, backgroundColor: '#6366f1', marginVertical: 10 },
  modalSub: { color: '#fff', fontSize: 22, fontWeight: '900' },
  
  settingsGroup: { width: '100%' },
  settingLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', marginVertical: 15, letterSpacing: 1 },
  inputWrapper: { width: '100%', marginBottom: 12 },
  inputLabel: { color: '#6366f1', fontSize: 9, fontWeight: '900', marginBottom: 5 },
  profileInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  modalFooterActions: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  saveBtn: { flex: 1.5, backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  levelGroup: { width: '100%', gap: 12 },
  levelBtn: { width: '100%', flexDirection: 'row', padding: 20, borderRadius: 18, alignItems: 'center', borderWidth: 1.5 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  levelBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  
  nodeText: { color: "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  exitBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  exitText: { color: "#ef4444", fontSize: 10, fontWeight: "900" },
  
  mainWrapper: { width: '100%', maxWidth: 500, paddingHorizontal: 20 },
  heroCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 25, borderRadius: 32, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: "#6366f1", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 15, lineHeight: 32 },
  insightBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  insightBtnText: { color: '#6366f1', fontSize: 9, fontWeight: '900' },
  typingText: { color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 18, marginVertical: 20, height: 55, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  challengeBtn: { width: '100%', height: 50, borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  challengeBtnText: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  glassTile: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  tileLabel: { fontSize: 8, fontWeight: '900', marginBottom: 5 },
  tileValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  
  sectionTitle: { color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 15, textAlign: 'center' },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  glassModule: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 25, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1 },
  moduleName: { color: '#fff', fontSize: 12, fontWeight: "900", marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 },
  barFill: { height: '100%', borderRadius: 2 },
  pctText: { fontSize: 10, fontWeight: '900' },
  scrollPadding: { paddingVertical: 20, alignItems: 'center' },
  presetItemLarge: { width: 55, height: 55, borderRadius: 27.5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  presetImg: { width: '100%', height: '100%' },
  editBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  abortBtn: { marginTop: 15 },
  abortText: { color: '#ef4444', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});