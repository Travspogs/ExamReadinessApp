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
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { loginUser } from "../utils/auth";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
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
  const floatAnim = useRef(new Animated.Value(0)).current;

  // --- GOOGLE & FB PROVIDERS ---
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: "945221804729-nl9lkf2k2j4cqqq80chgq65vleffu75a.apps.googleusercontent.com",
    redirectUri: "http://localhost:8081",
    extraParams: { prompt: 'select_account' },
  });

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: "1707248143792703", 
    responseType: ResponseType.Token,
    scopes: ['public_profile', 'email'],
    redirectUri: "http://localhost:8081/",
  });

  const handleNavigationToHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // --- AUTH LOGIC ---
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

  // --- RESET PASSWORD LOGIC ---
  const handleResetPassword = async () => {
    if (!resetEmail || !newPassword) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

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
        Alert.alert("SUCCESS", "Password updated successfully. You can now login.");
        setResetModal(false);
        setResetEmail("");
        setNewPassword("");
      } else {
        Alert.alert("NOT FOUND", "User record not found in system.");
      }
    } catch (e) {
      Alert.alert("SYSTEM ERROR", "Unable to update credentials.");
    }
  };

  // --- ANIMATIONS ---
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMouseMove = (event) => {
        const tiltX = (event.clientY - SCREEN_HEIGHT / 2) / 30;
        const turnY = (event.clientX - SCREEN_WIDTH / 2) / 20;
        Animated.spring(rotateX, { toValue: -tiltX, useNativeDriver: false }).start();
        Animated.spring(rotateY, { toValue: turnY, useNativeDriver: false }).start();
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    } else {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -15, duration: 2500, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 15, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const animatedImageStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: Platform.OS === 'web' ? rotateX.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) : '0deg' },
      { rotateY: Platform.OS === 'web' ? rotateY.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) : '0deg' },
      { translateY: Platform.OS !== 'web' ? floatAnim : 0 }
    ],
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainContainer}>
        
        {/* RESET MODAL */}
        <Modal transparent visible={resetModal} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>SYSTEM RECOVERY</Text>
              <Text style={styles.subText}>Enter your details to reset password</Text>
              
              <View style={[styles.fieldGroup, { width: '100%', marginTop: 20 }]}>
                <Text style={styles.fieldLabel}>Confirm Email/Phone</Text>
                <TextInput 
                  placeholder="UserID / Contact No." 
                  style={styles.fieldInput} 
                  onChangeText={setResetEmail}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              
              <View style={[styles.fieldGroup, { width: '100%' }]}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInput 
                  placeholder="••••••••" 
                  secureTextEntry 
                  style={styles.fieldInput} 
                  onChangeText={setNewPassword}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.executeBtn} onPress={handleResetPassword}>
                <Text style={styles.btnText}>RESET CREDENTIALS</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setResetModal(false)} style={{ marginTop: 20 }}>
                <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.formSection}>
          <View style={styles.authCard}>
            <View style={styles.statusBadge}><Text style={styles.badgeText}>USER ACCESS</Text></View>
            <Text style={styles.mainTitle}>EXAM<Text style={{color: '#6366f1'}}>READINESS</Text></Text>
            <Text style={styles.subText}>Train your mind, success will follow.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email or Phone</Text>
              <TextInput 
                placeholder="User ID / Contact No." 
                onChangeText={(text) => { setEmail(text); setEmailError(""); }} 
                style={[styles.fieldInput, emailError ? styles.errorBorder : null]} 
                placeholderTextColor="#94a3b8" 
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
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconPadding}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#6366f1" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* FORGOT PASSWORD LINK */}
            <TouchableOpacity onPress={() => setResetModal(true)} style={{ alignSelf: 'flex-end', marginTop: -10, marginBottom: 15 }}>
              <Text style={{ color: '#6366f1', fontSize: 11, fontWeight: '800' }}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.executeBtn} onPress={handleLogin}>
                <Text style={styles.btnText}>LOG IN NOW</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity onPress={() => googlePromptAsync()} style={styles.socialBox}>
                <Ionicons name="logo-google" size={22} color="#ea4335" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => fbPromptAsync()} style={styles.socialBox}>
                <FontAwesome name="facebook" size={22} color="#1877f2" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("SignUp")} style={styles.bottomLink}>
              <Text style={styles.linkText}>New user? <Text style={styles.linkHighlight}>Create Account</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        {Platform.OS === 'web' || SCREEN_WIDTH > 800 ? (
          <View style={styles.visualSection}>
            <View style={styles.glow1} /><View style={styles.glow2} />
            <Animated.View style={animatedImageStyle}>
              <Image source={require("../assets/ai-student.png")} style={styles.visualImg} />
            </Animated.View>
            <View style={styles.floatingInfo}><Text style={styles.infoText}>SECURE LOGIN NODE</Text></View>
          </View>
        ) : null}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#020617' },
  formSection: { flex: 1, justifyContent: 'center', paddingHorizontal: '10%' },
  authCard: { width: '100%', maxWidth: 400 },
  statusBadge: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)', marginBottom: 20 },
  badgeText: { color: '#6366f1', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  mainTitle: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subText: { color: '#475569', fontSize: 14, marginTop: 8, marginBottom: 40 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { color: '#6366f1', fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: '#eff6ff', height: 55, borderRadius: 12, paddingHorizontal: 20, color: '#1e293b', fontSize: 15, fontWeight: '500' },
  passInputWrapper: { flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: 12, alignItems: 'center' },
  passInput: { flex: 1, height: 55, paddingHorizontal: 20, color: '#1e293b' },
  iconPadding: { paddingRight: 20 },
  executeBtn: { backgroundColor: '#6366f1', width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1e293b' },
  orText: { color: '#475569', marginHorizontal: 15, fontSize: 10, fontWeight: '700' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 30 },
  socialBox: { width: 120, height: 55, backgroundColor: '#0f172a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  bottomLink: { alignItems: 'center' },
  linkText: { color: '#475569', fontSize: 13 },
  linkHighlight: { color: '#6366f1', fontWeight: '700' },
  visualSection: { flex: 1.2, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  visualImg: { width: SCREEN_WIDTH * 0.35, height: SCREEN_WIDTH * 0.35, resizeMode: 'contain' },
  glow1: { position: 'absolute', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(99, 102, 241, 0.05)', top: -100, right: -100 },
  glow2: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(99, 102, 241, 0.03)', bottom: -50, left: -50 },
  floatingInfo: { position: 'absolute', bottom: 40, right: 40, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  infoText: { color: '#6366f1', fontSize: 10, fontWeight: '800' },
  errorText: { color: '#ef4444', fontSize: 10, marginTop: 5, fontWeight: '700' },
  errorBorder: { borderWidth: 1.5, borderColor: '#ef4444' },
  // RECOVERY MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#0f172a', padding: 30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 }
});