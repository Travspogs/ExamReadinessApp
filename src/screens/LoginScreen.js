import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResponseType } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { loginUser } from "../utils/auth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = SCREEN_WIDTH > 800;

  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetModal, setResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  // --- GOOGLE & FB PROVIDERS ---
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: "945221804729-nl9lkf2k2j4cqqq80chgq65vleffu75a.apps.googleusercontent.com",
    redirectUri: isWeb ? "http://localhost:8081" : undefined,
    extraParams: { prompt: 'select_account' },
  });

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: "1707248143792703", 
    responseType: ResponseType.Token,
    scopes: ['public_profile', 'email'],
    redirectUri: isWeb ? "http://localhost:8081/" : undefined,
  });

  const handleNavigationToHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { access_token } = fbResponse.params;
      const fetchFBUser = async () => {
        try {
          const response = await fetch(`https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email`);
          const user = await response.json();
          const userData = { fullName: user.name, email: user.email || user.id, id: user.id };
          await AsyncStorage.setItem('current_user', JSON.stringify(userData));
          handleNavigationToHome();
        } catch (e) { handleNavigationToHome(); }
      };
      fetchFBUser();
    }
  }, [fbResponse]);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      const fetchGoogle = async () => {
        try {
          const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          });
          const user = await res.json();
          const userData = { fullName: user.name, email: user.email, id: user.id };
          await AsyncStorage.setItem('current_user', JSON.stringify(userData));
          handleNavigationToHome();
        } catch (e) { handleNavigationToHome(); }
      };
      fetchGoogle();
    }
  }, [googleResponse]);

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");
    if (!email) return setEmailError("Email or Phone is required.");
    if (!password) return setPasswordError("Password is required.");

    try {
      const isSuccess = await loginUser(email.trim(), password);
      if (isSuccess) {
        const allUsersData = await AsyncStorage.getItem('registered_users');
        const users = allUsersData ? JSON.parse(allUsersData) : [];
        const foundUser = users.find(u => 
          (u.email && u.email.toLowerCase() === email.trim().toLowerCase()) || 
          (u.contact && u.contact === email.trim())
        );
        const userData = {
          fullName: foundUser ? (foundUser.fullName || foundUser.fullname) : "STUDENT",
          email: email.trim().toLowerCase(), 
        };
        await AsyncStorage.setItem('current_user', JSON.stringify(userData));
        handleNavigationToHome();
      } else {
        setPasswordError("Access Denied: Invalid credentials.");
      }
    } catch (error) {
      Alert.alert("SYSTEM ERROR", "Unable to connect.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !newPassword) return Alert.alert("Error", "Please fill in all fields.");
    try {
      const allUsersData = await AsyncStorage.getItem('registered_users');
      let users = allUsersData ? JSON.parse(allUsersData) : [];
      const userIndex = users.findIndex(u => 
        (u.email && u.email.toLowerCase() === resetEmail.trim().toLowerCase()) || 
        (u.contact && u.contact === resetEmail.trim())
      );
      if (userIndex > -1) {
        users[userIndex].password = newPassword; 
        await AsyncStorage.setItem('registered_users', JSON.stringify(users));
        Alert.alert("SUCCESS", "Password updated successfully.");
        setResetModal(false);
      } else {
        Alert.alert("NOT FOUND", "User record not found.");
      }
    } catch (e) { Alert.alert("SYSTEM ERROR", "Unable to update."); }
  };

  useEffect(() => {
    if (isWeb) {
      const handleMouseMove = (event) => {
        const tiltX = (event.clientY - SCREEN_HEIGHT / 2) / 30;
        const turnY = (event.clientX - SCREEN_WIDTH / 2) / 20;
        Animated.spring(rotateX, { toValue: -tiltX, useNativeDriver: false }).start();
        Animated.spring(rotateY, { toValue: turnY, useNativeDriver: false }).start();
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [SCREEN_HEIGHT, SCREEN_WIDTH]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.mainContainer}>
        
        <Modal transparent visible={resetModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>RECOVERY MODE</Text>
              <TextInput placeholder="Email/Phone" style={styles.modalInput} onChangeText={setResetEmail} placeholderTextColor="#475569" />
              <TextInput placeholder="New Password" secureTextEntry style={styles.modalInput} onChangeText={setNewPassword} placeholderTextColor="#475569" />
              <TouchableOpacity style={styles.executeBtn} onPress={handleResetPassword}>
                <Text style={styles.btnText}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setResetModal(false)}><Text style={{color:'#ef4444', marginTop:15}}>CLOSE</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.contentCard, !isLargeScreen && styles.mobileCard]}>
            <View style={styles.formSection}>
              <View style={styles.authCard}>
                <View style={styles.statusBadge}><Text style={styles.badgeText}>USER ACCESS</Text></View>
                <Text style={styles.mainTitle}>EXAM<Text style={{color: '#a855f7'}}>READINESS</Text></Text>
                <Text style={styles.subText}>Train your mind, success will follow.</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email or Phone</Text>
                  <TextInput 
                    placeholder="@hcdc.edu.ph / Contact No." 
                    onChangeText={(text) => { setEmail(text); setEmailError(""); }} 
                    style={[styles.fieldInput, emailError ? styles.errorBorder : null]} 
                    placeholderTextColor="#94a3b8"
                    returnKeyType="next"
                    autoCapitalize="none"
                  />
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={[styles.passInputWrapper, passwordError ? styles.errorBorder : null]}>
                    <TextInput 
                        placeholder="••••••••••••••••" 
                        secureTextEntry={!showPassword} 
                        onChangeText={(text) => { setPassword(text); setPasswordError(""); }} 
                        style={styles.passInput} 
                        placeholderTextColor="#94a3b8" 
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconPadding}>
                      <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#a855f7" />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>

                <TouchableOpacity onPress={() => setResetModal(true)} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.executeBtn} onPress={handleLogin}>
                    <Text style={styles.btnText}>LOG IN NOW</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity onPress={() => googlePromptAsync()} style={styles.socialBox}>
                    <Ionicons name="logo-google" size={20} color="#ea4335" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => fbPromptAsync()} style={styles.socialBox}>
                    <FontAwesome name="facebook" size={20} color="#1877f2" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    onPress={() => navigation.navigate("SignUp")} 
                    style={styles.bottomLink}
                >
                  <Text style={styles.linkText}>New user? <Text style={styles.linkHighlight}>Create Account</Text></Text>
                </TouchableOpacity>
              </View>
            </View>

            {isLargeScreen && (
              <View style={styles.visualSection}>
                <View style={styles.glow1} />
                <Animated.View style={{
                  transform: [
                    { perspective: 1000 },
                    { rotateX: isWeb ? rotateX.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) : '0deg' },
                    { rotateY: isWeb ? rotateY.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) : '0deg' },
                  ],
                }}>
                  <Image source={require("../assets/ai-student.png")} style={styles.visualImg} />
                </Animated.View>
                <View style={styles.floatingInfo}><Text style={styles.infoText}>LOGIN NODE: SECURE</Text></View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  contentCard: { 
    flexDirection: 'row', 
    width: '100%', 
    maxWidth: 1000, 
    minHeight: 650, 
    backgroundColor: '#020617', 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(168, 85, 247, 0.2)', 
    overflow: 'hidden', 
    shadowColor: "#a855f7", 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 30, 
    elevation: 10 
  },
  mobileCard: { flexDirection: 'column', height: 'auto', paddingVertical: 20 },
  formSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  authCard: { width: '100%', maxWidth: 350 },
  statusBadge: { backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)', marginBottom: 15 },
  badgeText: { color: '#a855f7', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subText: { color: '#475569', fontSize: 13, marginTop: 5, marginBottom: 30 },
  fieldGroup: { marginBottom: 15 },
  fieldLabel: { color: '#a855f7', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: '#eff6ff', height: 50, borderRadius: 12, paddingHorizontal: 15, color: '#1e293b', fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  passInputWrapper: { flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: 12, alignItems: 'center' },
  passInput: { flex: 1, height: 50, paddingHorizontal: 15, color: '#1e293b', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  iconPadding: { paddingRight: 15 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -5, marginBottom: 15 },
  forgotText: { color: '#a855f7', fontSize: 11, fontWeight: '800' },
  executeBtn: { backgroundColor: '#a855f7', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1e293b' },
  orText: { color: '#475569', marginHorizontal: 10, fontSize: 10, fontWeight: '700' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  socialBox: { width: 80, height: 45, backgroundColor: '#0f172a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  bottomLink: { alignItems: 'center', marginTop: 10 },
  linkText: { color: '#475569', fontSize: 12 },
  linkHighlight: { color: '#a855f7', fontWeight: '800' },
  visualSection: { flex: 1.2, backgroundColor: '#010409', justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.05)' },
  visualImg: { width: 500, height: 500, resizeMode: 'contain' },
  glow1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(168, 85, 247, 0.05)' },
  floatingInfo: { position: 'absolute', bottom: 30, right: 30, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  infoText: { color: '#a855f7', fontSize: 9, fontWeight: '800' },
  errorText: { color: '#ef4444', fontSize: 9, marginTop: 4, fontWeight: '700' },
  errorBorder: { borderWidth: 1.5, borderColor: '#ef4444' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 350, backgroundColor: '#0f172a', padding: 25, borderRadius: 25, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 20 },
  modalInput: { width: '100%', height: 45, backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 }
});