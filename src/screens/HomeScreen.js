import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  View,
  useWindowDimensions
} from "react-native";
import { StorageService } from "../utils/storageService";

// IMPORT YOUR ASSETS HERE
const BRAIN_ICON = require('../assets/assets/brain_bg.jpg'); // Your blue brain image
const RANK_ICON = require('../assets/assets/avatar1.png'); // Placeholder for rank icon if needed

export default function HomeScreen({ navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = windowWidth > 768;

  const [readinessText, setReadinessText] = useState("");
  const [subjectProgress, setSubjectProgress] = useState({});
  const [userName, setUserName] = useState("STUDENT");
  const [userEmail, setUserEmail] = useState(""); 
  const [profileImage, setProfileImage] = useState(null);
  
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [isSystemLoading, setIsSystemLoading] = useState(false);

  const subjectsConfig = [
    { name: "Mathematics", color: "#00d2ff", icon: "∑" }, 
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
    if (!isWeb) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('PERMISSION DENIED', 'Access to gallery is required.');
          return;
        }
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
        
        if (isWeb) { window.alert("SYSTEM UPDATE: Profile credentials synchronized."); }
        else { Alert.alert("SYSTEM UPDATE", "Profile credentials synchronized."); }
        setShowProfile(false);
    } catch (e) { Alert.alert("SAVE ERROR", "Failed to update profile data."); }
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
    return subject ? subject.color : "#6366f1"; 
  };

  useFocusEffect(useCallback(() => { loadUserData(); }, [userEmail]));

  useEffect(() => {
    let index = 0;
    const fullDesc = `Welcome, ${userName}. Academic modules synchronized, readiness level HIGH. System ready for challenges.`;
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
      <View style={[avatarStyle, { backgroundColor: 'rgba(0, 210, 255, 0.1)' }]}>
        <Text style={textStyle}>{userName ? userName.charAt(0) : 'S'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      <View style={[styles.bgOrb, { top: '10%', left: '5%', backgroundColor: '#a855f720' }]} />
      <View style={[styles.bgOrb, { bottom: '15%', right: '5%', backgroundColor: '#00d2ff20' }]} />

      {isSystemLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={getActiveSubjectColor()} />
          <Text style={[styles.loadingText, { color: getActiveSubjectColor() }]}>SYNCHRONIZING MODULES</Text>
        </View>
      )}

      {/* Profile Modal */}
      <Modal transparent visible={showProfile} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isWeb && { maxWidth: 500 }]}>
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
                  <TextInput style={styles.profileInput} value={userName} onChangeText={(val) => setUserName(val.toUpperCase())} />
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>ADDRESS</Text>
                  <TextInput style={styles.profileInput} value={address} onChangeText={setAddress} placeholder="Location" placeholderTextColor="#475569"/>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>BIRTHDAY</Text>
                  <TextInput style={styles.profileInput} value={birthday} onChangeText={setBirthday} placeholder="MM/DD/YYYY" placeholderTextColor="#475569"/>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>GENDER</Text>
                  <TextInput style={styles.profileInput} value={gender} onChangeText={setGender} placeholder="Select" placeholderTextColor="#475569"/>
                </View>
                <Text style={styles.settingLabel}>SYSTEM AVATARS</Text>
                <FlatList
                  data={presetAvatars} horizontal
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

      {/* Protocol Selector Modal */}
      <Modal transparent visible={showSelector} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isWeb && { maxWidth: 400 }]}>
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
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.headerLeft}>
            <View>
                <RenderAvatar size="small" />
                <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.nodeText}>SYSTEM ACCESS: <Text style={{color: '#00d2ff'}}>{userName}</Text></Text>
              <Text style={styles.title}>EXAM<Text style={{color: '#a855f7'}}>READINESS</Text></Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={handleLogout}>
            <Text style={styles.exitText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <View style={[styles.mainWrapper, isWeb && { maxWidth: 1000 }]}>
              
              {/* Hero Section with Local Brain Image */}
              <View style={[styles.heroGlassContainer, isLargeScreen && { flexDirection: 'row' }]}>
                <View style={[styles.heroTextContent, isLargeScreen && { flex: 1.2 }]}>
                    <Text style={styles.heroLabel}>CORE PROTOCOL</Text>
                    <Text style={styles.heroTitle}>The Future of Exam Readiness Is Here</Text>
                    <Text style={styles.typingText}>{readinessText}</Text>
                    
                    <TouchableOpacity style={styles.insightBtnHero} onPress={() => navigation.navigate("Insights")}>
                        <Text style={styles.insightBtnTextHero}>VIEW INSIGHTS</Text>
                    </TouchableOpacity>
                </View>

                {isLargeScreen && (
                  <View style={styles.heroVisualContent}>
                     <View style={styles.visualBrainContainer}>
                        {/* UPDATE: Use local brain asset with glow effect */}
                        <Image source={BRAIN_ICON} style={styles.visualIconBrain} resizeMode="contain" />
                       
                     </View>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.mainActivateBtn} 
                onPress={() => {
                  const randomIndex = Math.floor(Math.random() * subjectsConfig.length);
                  openDifficultySelector(subjectsConfig[randomIndex].name);
                }}
              >
                <LinearGradient colors={['#a855f7', '#6366f1']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.activateGradient}>
                    <Text style={styles.activateBtnText}>ACTIVATE</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Stats / Leaderboard Row */}
              <View style={styles.statsRow}>
                  <TouchableOpacity style={styles.glassTile} onPress={() => navigation.navigate("Leaderboard")}>
                      <View style={styles.tileHeader}>
                        {/* UPDATE: Styled Leaderboard Icon */}
                        <View style={styles.leaderboardIconContainer}>
                           <Text style={styles.tileIcon}>🏆</Text>
                        </View>
                        <Text style={[styles.tileLabel, {color: '#a855f7'}]}>GLOBAL RANKING</Text>
                      </View>
                      <Text style={styles.tileValue}>LEADERBOARD</Text>
                      
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.glassTile} onPress={() => navigation.navigate("Analytics")}>
                      <View style={styles.tileHeader}>
                         <Text style={styles.tileIcon}>🕒</Text>
                         <Text style={[styles.tileLabel, {color: '#00d2ff'}]}>REAL TIME LOGS</Text>
                      </View>
                      <Text style={styles.tileValue}>PERFORMANCE</Text>
                      
                  </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>SELECT MODULE TO COMMENCE</Text>
              <View style={styles.moduleGrid}>
                {subjectsConfig.map((s, i) => (
                  <TouchableOpacity key={i} style={[styles.glassModule, isWeb && { width: '31%' }]} onPress={() => openDifficultySelector(s.name)}>
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
  container: { 
    flex: 1, 
    backgroundColor: "#020617" 
  },

  bgOrb: { 
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
    filter: Platform.OS === 'web' ? 'blur(80px)' : undefined
  },

  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },

  loadingText: { 
    marginTop: 20,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2
  },

  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 18,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 1200
  },

  headerLeft: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },

  dashboardAvatar: { 
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00d2ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },

  dashboardAvatarText: { 
    color: '#00d2ff',
    fontSize: 18,
    fontWeight: '900'
  },

  onlineDot: { 
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#020617'
  },

  heroGlassContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: -25,
    zIndex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8
  },

  heroTextContent: { 
    flex: 1,
    justifyContent: 'center'
  },

  heroVisualContent: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  visualBrainContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center'
  },

  visualIconBrain: { 
    width: '100%',
    height: '100%',
    borderRadius: 28,

    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,

    elevation: 20
  },

  heroLabel: { 
    color: "#00d2ff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10
  },

  heroTitle: { 
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 38
  },

  typingText: { 
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 22,
    marginVertical: 15,
    minHeight: 60
  },

  insightBtnHero: { 
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 5
  },

  insightBtnTextHero: { 
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },

  mainActivateBtn: { 
    width: 250,
    height: 58,
    alignSelf: 'center',
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowRadius: 20,
    shadowOpacity: 0.7,
    elevation: 12
  },

  activateGradient: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  activateBtnText: { 
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 16
  },

  statsRow: { 
    flexDirection: 'row',
    gap: 15,
    marginTop: 40,
    marginBottom: 30,
    justifyContent: 'center'
  },

  glassTile: { 
    flex: 1,
    maxWidth: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6
  },

  tileHeader: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },

  leaderboardIconContainer: { 
    padding: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderRadius: 10
  },

  tileIcon: { 
    fontSize: 16
  },

  tileLabel: { 
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },

  tileValue: { 
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 1
  },

  sectionTitle: { 
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: 'center'
  },

  moduleGrid: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  glassModule: { 
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 26,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },

  iconBox: { 
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1
  },

  moduleName: { 
    color: '#fff',
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 14,
    letterSpacing: 0.5
  },

  progressRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  barBg: { 
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2
  },

  barFill: { 
    height: '100%',
    borderRadius: 2
  },

  pctText: { 
    fontSize: 10,
    fontWeight: '900'
  },

  modalContainer: { 
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalContent: { 
    width: '90%',
    backgroundColor: '#0f172a',
    padding: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },

  modalHeader: { 
    alignItems: 'center',
    marginBottom: 20
  },

  modalTitle: { 
    color: '#00d2ff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3
  },

  titleDivider: { 
    width: 40,
    height: 2,
    backgroundColor: '#a855f7',
    marginTop: 8
  },

  modalSub: { 
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10
  },

  profileInput: { 
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10
  },

  inputLabel: { 
    color: '#00d2ff',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 5
  },

  saveBtn: { 
    flex: 1.5,
    backgroundColor: '#00d2ff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },

  cancelBtn: { 
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center'
  },

  actionBtnText: { 
    color: '#fff',
    fontSize: 11,
    fontWeight: '900'
  },

  nodeText: { 
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5
  },

  title: { 
    color: "#fff",
    fontSize: 24,
    fontWeight: "900"
  },

  exitBtn: { 
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },

  exitText: { 
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1
  },

  scrollPadding: { 
    paddingBottom: 50
  },

  mainWrapper: { 
    width: '100%',
    paddingHorizontal: 20,
    alignSelf: 'center'
  },

  avatarCircleExtraLarge: { 
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#00d2ff'
  },

  avatarCircleLarge: { 
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#00d2ff'
  },

  avatarLetterLarge: { 
    color: '#fff',
    fontSize: 30,
    fontWeight: '900'
  },

  mainAvatarContainerLarge: { 
    alignItems: 'center',
    marginBottom: 20
  },

  editBadgeLarge: { 
    backgroundColor: '#00d2ff',
    padding: 5,
    borderRadius: 5,
    marginTop: -10
  },

  editBadgeText: { 
    color: '#000',
    fontSize: 8,
    fontWeight: '900'
  },

  levelBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1
  },

  levelBtnText: { 
    fontWeight: '900',
    letterSpacing: 1
  },

  statusDot: { 
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12
  },

  abortBtn: { 
    marginTop: 15,
    alignSelf: 'center'
  },

  abortText: { 
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900'
  },

  presetItemLarge: { 
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 10
  },

  presetImg: { 
    width: '100%',
    height: '100%'
  }
});