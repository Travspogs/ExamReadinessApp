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

  const subjectsConfig = [
    { name: "Mathematics", color: "#6366f1", icon: "∑" }, 
    { name: "English", color: "#a855f7", icon: "A" },      
    { name: "Science", color: "#3b82f6", icon: "⚛" },      
    { name: "Filipino", color: "#ec4899", icon: "F" },     
    { name: "Computer Science", color: "#10b981", icon: "</>" },     
    { name: "History", color: "#f59e0b", icon: "📜" }        
  ];

  const presetAvatars = [
    require('../assets/assets/avatar1.png'), 
    require('../assets/assets/avatar2.png'),
    require('../assets/assets/avatar3.png'),
    require('../assets/assets/avatar4.png'),
  ];

  // FIXED: Pinagsama ang login data at custom saved data
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        const user = JSON.parse(userData);
        const emailKey = user.email || user.contact || "default";
        const safeId = emailKey.replace(/[@.]/g, '_');
        setUserEmail(emailKey);

        // Permanent Name Check: Mas prioritized ang custom_name na sinave sa profile
        const savedCustomName = await AsyncStorage.getItem(`custom_name_${safeId}`);
        const displayName = savedCustomName || user.fullName || user.fullname || user.name || user.username || "STUDENT";
        setUserName(displayName.toUpperCase());

        const savedAddr = await AsyncStorage.getItem(`address_${safeId}`);
        const savedBday = await AsyncStorage.getItem(`birthday_${safeId}`);
        const savedGndr = await AsyncStorage.getItem(`gender_${safeId}`);
        
        setAddress(savedAddr || "");
        setBirthday(savedBday || "");
        setGender(savedGndr || "");

        // FIXED AVATAR LOADING: Iniiwasan ang black screen sa tamang pag-parse
        const savedImage = await AsyncStorage.getItem(`profile_image_${safeId}`);
        if (savedImage) {
          if (savedImage.startsWith('{')) { 
            // Kung preset avatar ito (JSON string)
            const parsed = JSON.parse(savedImage);
            setProfileImage(presetAvatars[parsed.presetIndex]);
          } else {
            // Kung gallery image ito (URI string)
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
      // Sinisave as raw string para sa URI
      await AsyncStorage.setItem(`profile_image_${safeId}`, uri);
    }
  };

  const selectPresetAvatar = async (index) => {
    const safeId = userEmail.replace(/[@.]/g, '_');
    setProfileImage(presetAvatars[index]);
    // Sinisave as JSON string para malaman ng loader na preset ito
    await AsyncStorage.setItem(`profile_image_${safeId}`, JSON.stringify({ presetIndex: index }));
  };

  // FIXED: Sinasave na ang custom name para permanent na siya
  const handleSaveProfile = async () => {
    try {
        const safeId = userEmail.replace(/[@.]/g, '_');
        await AsyncStorage.setItem(`custom_name_${safeId}`, userName);
        await AsyncStorage.setItem(`address_${safeId}`, address);
        await AsyncStorage.setItem(`birthday_${safeId}`, birthday);
        await AsyncStorage.setItem(`gender_${safeId}`, gender);

        // I-update din ang session storage para siguradong sync
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
      case 'EASY': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
      case 'MEDIUM': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' };
      case 'HARD': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' };
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
    const fullDesc = `Welcome, ${userName}. Academic modules synchronized. Readiness level: HIGH. System ready for challenge.`;
    setReadinessText(""); 
    const interval = setInterval(() => {
      setReadinessText(fullDesc.slice(0, index));
      index++;
      if (index > fullDesc.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [userName]);

  // FIXED: Safe rendering ng avatar images
  const RenderAvatar = ({ size = 'large' }) => {
    let avatarStyle = styles.avatarCircleLarge;
    let textStyle = styles.avatarLetterLarge;

    if (size === 'small') {
      avatarStyle = styles.dashboardAvatar;
      textStyle = styles.dashboardAvatarText;
    } else if (size === 'extraLarge') {
      avatarStyle = styles.avatarCircleExtraLarge;
      textStyle = styles.avatarLetterExtraLarge;
    }

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
      <LinearGradient colors={['#020617', '#0f172a', '#1e1b4b', '#020617']} style={StyleSheet.absoluteFill} />
      
      {isSystemLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={getActiveSubjectColor()} />
          <Text style={[styles.loadingText, { color: getActiveSubjectColor() }]}>INITIATE CHALLENGE</Text>
          <Text style={styles.pleaseWaitText}>PLEASE WAIT</Text>
        </View>
      )}

      <Modal transparent visible={showProfile} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { height: '88%', paddingBottom: 20 }]}>
            <Text style={styles.modalTitle}>ACCOUNT SETTINGS</Text>
            
            <TouchableOpacity onPress={pickImage} style={styles.mainAvatarContainerLarge}>
                <RenderAvatar size="extraLarge" />
                <View style={styles.editBadgeLarge}><Text style={styles.editBadgeText}>CHANGE PHOTO</Text></View>
            </TouchableOpacity>

            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <View style={styles.settingsGroup}>
                <Text style={styles.settingLabel}>PERSONAL DATA</Text>
                
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput style={styles.profileInput} value={userName} onChangeText={(val) => setUserName(val.toUpperCase())} placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>RESIDENTIAL ADDRESS 🇵🇭</Text>
                  <TextInput style={styles.profileInput} value={address} onChangeText={setAddress} placeholder="City, Province" placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>BIRTHDAY</Text>
                  <TextInput style={styles.profileInput} value={birthday} onChangeText={setBirthday} placeholder="MM/DD/YYYY" placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>GENDER</Text>
                  <TextInput style={styles.profileInput} value={gender} onChangeText={setGender} placeholder="Enter Gender" placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput style={styles.profileInput} value={tempPassword} onChangeText={setTempPassword} placeholder="••••••••" secureTextEntry placeholderTextColor="rgba(255,255,255,0.2)"/>
                </View>

                <Text style={[styles.settingLabel, { marginTop: 15 }]}>PRESET AVATARS</Text>
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
              <TouchableOpacity onPress={handleSaveProfile} style={[styles.actionBtn, { backgroundColor: '#6366f1' }]}>
                <Text style={styles.actionBtnText}>SAVE CHANGES</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowProfile(false)} style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showSelector} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT DIFFICULTY</Text>
                <View style={styles.titleDivider} />
                <Text style={styles.modalSub}>{selectedSubject.toUpperCase()}</Text>
            </View>
            <div style={styles.levelGroup}>
                {["EASY", "MEDIUM", "HARD"].map((level) => {
                    const theme = getDiffTheme(level);
                    return (
                        <TouchableOpacity key={level} style={[styles.levelBtn, { borderColor: theme.color + '40', backgroundColor: theme.bg }]} onPress={() => processNavigation(level)}>
                            <View style={[styles.statusDot, { backgroundColor: theme.color }]} />
                            <Text style={[styles.levelBtnText, { color: theme.color }]}>{level}</Text>
                        </TouchableOpacity>
                    );
                })}
            </div>
            <TouchableOpacity onPress={() => setShowSelector(false)} style={styles.abortBtn}><Text style={styles.abortText}>RETURN HOME</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.headerLeft}>
            <View>
                <RenderAvatar size="small" />
                <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.nodeText}>Access: <Text style={{color: '#fff', fontSize: 10}}>{userName} ▽</Text></Text>
              <Text style={styles.title}>EXAM<Text style={{color: '#a855f7'}}>READINESS</Text></Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={handleLogout}>
            <Text style={styles.exitText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <View style={styles.mainWrapper}>
              <View style={styles.heroCard}>
                  <View style={styles.heroTop}>
                      <Text style={styles.heroLabel}>EXAM CORE</Text>
                      <TouchableOpacity style={styles.insightBtn} onPress={() => navigation.navigate("Insights")}>
                          <Text style={styles.insightBtnText}>INSIGHTS</Text>
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.typingText}>{readinessText}</Text>
                  
                  <TouchableOpacity 
                    style={styles.challengeBtn} 
                    onPress={() => {
                      const randomIndex = Math.floor(Math.random() * subjectsConfig.length);
                      const randomSubject = subjectsConfig[randomIndex].name;
                      openDifficultySelector(randomSubject);
                    }}
                  >
                      <Text style={styles.challengeBtnText}>ACTIVATE CHALLENGE</Text>
                  </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                  <TouchableOpacity style={styles.glassTile} onPress={() => navigation.navigate("Leaderboard")}>
                      <Text style={[styles.tileLabel, {color: '#a855f7'}]}>LEADERBOARD</Text>
                      <Text style={styles.tileValue}>RANKING</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.glassTile} onPress={() => navigation.navigate("Analytics")}>
                      <Text style={[styles.tileLabel, {color: '#6366f1'}]}>ANALYTICS</Text>
                      <Text style={styles.tileValue}>LOGS</Text>
                  </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>SUBJECT MODULES</Text>
              <View style={styles.moduleGrid}>
                {subjectsConfig.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.glassModule} onPress={() => openDifficultySelector(s.name)}>
                    <View style={[styles.iconBox, { backgroundColor: s.color + '20', borderColor: s.color + '40' }]}>
                      <Text style={{ color: s.color, fontWeight: '900', fontSize: 14 }}>{s.icon}</Text>
                    </View>
                    <Text style={styles.moduleName}>{s.name.toUpperCase()}</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.barBg}><View style={[styles.barFill, { width: `${subjectProgress[s.name]?.bestScore || 0}%`, backgroundColor: s.color }]} /></View>
                      <Text style={styles.pctText}>{subjectProgress[s.name]?.bestScore || 0}%</Text>
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
  loadingText: { marginTop: 20, fontSize: 11, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  pleaseWaitText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 8, letterSpacing: 4, fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 15, paddingTop: Platform.OS === 'android' ? 45 : 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  
  dashboardAvatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  dashboardAvatarText: { color: '#6366f1', fontSize: 24, fontWeight: '900' },
  
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#020617' },
  
  avatarCircleLarge: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarLetterLarge: { color: '#fff', fontSize: 35, fontWeight: '900' },
  avatarCircleExtraLarge: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#0f172a' },
  avatarLetterExtraLarge: { color: '#fff', fontSize: 55, fontWeight: '900' },
  mainAvatarContainerLarge: { alignItems: 'center', marginVertical: 25, position: 'relative' },
  editBadgeLarge: { position: 'absolute', bottom: 0, backgroundColor: '#6366f1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 2, borderColor: '#0b0f1a' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#0b0f1a', paddingVertical: 32, paddingHorizontal: 25, borderRadius: 35, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 28 },
  modalTitle: { color: '#6366f1', fontSize: 10, fontWeight: '900', letterSpacing: 4, marginBottom: 10 },
  titleDivider: { width: 45, height: 2, backgroundColor: '#6366f1', marginVertical: 12, opacity: 0.6 },
  modalSub: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  
  settingsGroup: { width: '100%', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingTop: 20 },
  settingLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  inputWrapper: { width: '100%', marginBottom: 15 },
  inputLabel: { color: '#6366f1', fontSize: 8, fontWeight: '900', marginBottom: 6, marginLeft: 4 },
  profileInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, color: '#fff', fontSize: 14, fontWeight: '600' },
  presetItemLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(99, 102, 241, 0.2)', overflow: 'hidden' },
  presetImg: { width: '100%', height: '100%' },
  
  modalFooterActions: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 15, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  levelGroup: { width: '100%', gap: 14 },
  levelBtn: { width: '100%', flexDirection: 'row', padding: 22, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', borderWidth: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  levelBtnText: { flex: 1, fontWeight: '900', fontSize: 15, letterSpacing: 2 },
  editBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  abortBtn: { marginTop: 20, padding: 10 },
  abortText: { color: '#ef4444', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  nodeText: { color: "#6366f1", fontSize: 8, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  exitBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  exitText: { color: "#ef4444", fontSize: 10, fontWeight: "900" },
  mainWrapper: { width: '100%', maxWidth: 450, paddingHorizontal: 20 },
  heroCard: { backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 24, borderRadius: 32, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: "#a855f7", fontSize: 8, fontWeight: "900", letterSpacing: 2 },
  insightBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(168, 85, 247, 0.15)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  insightBtnText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  typingText: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20, marginVertical: 25, height: 60, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  challengeBtn: { backgroundColor: "#fff", paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  challengeBtnText: { color: "#000", fontSize: 11, fontWeight: "900" },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  glassTile: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  tileLabel: { fontSize: 8, fontWeight: '900', marginBottom: 4 },
  tileValue: { color: '#fff', fontSize: 13, fontWeight: '900' },
  sectionTitle: { color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 15 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  glassModule: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 18, borderRadius: 28, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1 },
  moduleName: { color: '#fff', fontSize: 11, fontWeight: "900", marginBottom: 15 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 },
  barFill: { height: '100%', borderRadius: 2 },
  pctText: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900' },
  scrollPadding: { paddingVertical: 20, alignItems: 'center' }
});