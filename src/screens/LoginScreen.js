import { FontAwesome, Ionicons } from '@expo/vector-icons';
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
import { loginUser, resetPassword, socialLogin } from "../utils/auth";

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMouseMove = (event) => {
        const { clientX, clientY } = event;
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;
        const tiltX = (clientY - centerY) / 30;
        const turnY = (clientX - centerX) / 20;
        Animated.spring(rotateX, { toValue: -tiltX, friction: 7, tension: 40, useNativeDriver: false }).start();
        Animated.spring(rotateY, { toValue: turnY, friction: 7, tension: 40, useNativeDriver: false }).start();
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [rotateX, rotateY]);

  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -15, duration: 2500, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 15, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  // --- FIXED LOGIN LOGIC ---
  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    if (!email) return setEmailError("Email or Phone is required.");
    if (!password) return setPasswordError("Password is required.");

    try {
      // 1. Siguraduhin na ang loginUser ay tapos na (await)
      const isSuccess = await loginUser(email.trim(), password);
      
      if (isSuccess) {
        // 2. Imbis na 'replace', gamitin ang 'reset' para siguradong malinis 
        // ang state pagpasok sa Home screen.
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setPasswordError("Access Denied: Invalid credentials or account not found.");
      }
    } catch (error) {
      Alert.alert("SYSTEM ERROR", "Unable to reach storage node.");
    }
  };

  const handleSocialLogin = async (provider) => {
    const dummyEmail = `${provider}_user@hcdc.edu.ph`;
    const result = await socialLogin(dummyEmail, provider);
    if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
    }
  };

  const handleResetSubmit = async () => {
    if (!resetEmail || !newPassword) return Alert.alert("ERROR", "Fill all fields.");
    const result = await resetPassword(resetEmail.trim(), newPassword);
    if (result.success) {
      Alert.alert("SUCCESS", "Password updated!");
      setResetModal(false);
    }
  };

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
                placeholderTextColor="#475569" 
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
                    placeholderTextColor="#475569" 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconPadding}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#6366f1" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              <TouchableOpacity onPress={() => setResetModal(true)} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={styles.executeBtn} onPress={handleLogin}>
                <Text style={styles.btnText}>LOG IN NOW</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBox} onPress={() => handleSocialLogin('google')}>
                <Ionicons name="logo-google" size={22} color="#ea4335" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBox} onPress={() => handleSocialLogin('facebook')}>
                <FontAwesome name="facebook" size={22} color="#1877f2" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("SignUp")} style={styles.bottomLink}>
              <Text style={styles.linkText}>New user? <Text style={styles.linkHighlight}>Create Account</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.visualSection}>
          <View style={styles.glow1} /><View style={styles.glow2} />
          <Animated.View style={animatedImageStyle}>
            <Image source={require("../assets/ai-student.png")} style={styles.visualImg} />
          </Animated.View>
          <View style={styles.floatingInfo}><Text style={styles.infoText}>SECURE LOGIN NODE</Text></View>
        </View>

        <Modal visible={resetModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>RECOVERY MODE</Text>
              <TextInput placeholder="Contact Email/Phone" style={styles.fieldInput} placeholderTextColor="#475569" onChangeText={setResetEmail} autoCapitalize="none" />
              <TextInput placeholder="Create New Password" secureTextEntry style={[styles.fieldInput, { marginTop: 15 }]} placeholderTextColor="#475569" onChangeText={setNewPassword} />
              <TouchableOpacity style={styles.executeBtn} onPress={handleResetSubmit}><Text style={styles.btnText}>UPDATE ACCESS CODE</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setResetModal(false)} style={{ marginTop: 15 }}><Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 10 }}>CANCEL</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  forgotBtn: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: '#6366f1', fontSize: 10, fontWeight: '900', textDecorationLine: 'underline' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', maxWidth: 400, backgroundColor: '#0f172a', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  modalTitle: { color: '#6366f1', fontSize: 18, fontWeight: '900', marginBottom: 20, letterSpacing: 2 },
  errorText: { color: '#ef4444', fontSize: 10, marginTop: 5, fontWeight: '700' },
  errorBorder: { borderWidth: 1.5, borderColor: '#ef4444' }
});