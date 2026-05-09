import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
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
import { registerUser } from "../utils/auth";

export default function SignUpScreen({ navigation }) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = SCREEN_WIDTH > 800;

  // --- STATES (Retained) ---
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false); 

  // --- ANIMATION REFS ---
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  // --- VALIDATION & SIGNUP LOGIC (RETAINED) ---
  const handleSignUp = async () => {
    if (!fullName || fullName.trim().length === 0) {
      return Alert.alert("VALIDATION_ERROR", "PROTOCOL_FAILURE: Full Name is mandatory.");
    }

    if (!contact || !password) {
      return Alert.alert("ACCESS_DENIED", "REQUIRED: All data nodes must be populated.");
    }

    const trimmedContact = contact.toLowerCase().trim();

    if (trimmedContact.includes("@")) {
      if (!trimmedContact.endsWith("@hcdc.edu.ph")) {
        return Alert.alert("SYSTEM_ERROR", "UNAUTHORIZED_EMAIL: Use @hcdc.edu.ph domain only.");
      }
    } else {
      const phoneRegex = /^09[0-9]{9}$/;
      if (!phoneRegex.test(trimmedContact)) {
        return Alert.alert("PROTOCOL_ERROR", "INVALID NUMBER: Use 11-digit mobile starting with 09.");
      }
    }

    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 8 || !symbolRegex.test(password)) {
      return Alert.alert("WEAK_SECURITY", "REGISTRATION FAILED: Password must be 8+ characters with at least one symbol.");
    }

    try {
      const result = await registerUser(trimmedContact, password, fullName.trim());
      if (result.success === false) {
        return Alert.alert("DATABASE_CONFLICT", result.message);
      }
      Alert.alert("IDENTITY_CREATED", "System access granted. You can now login.");
      navigation.replace("Login"); 
    } catch (error) {
      Alert.alert("SYSTEM_CRASH", "Local storage error. Please try again.");
    }
  };

  // --- ROBOT ANIMATION EFFECT ---
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

  const animatedImageStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: isWeb ? rotateX.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) : '0deg' },
      { rotateY: isWeb ? rotateY.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) : '0deg' },
    ],
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.mainContainer}>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.contentCard, !isLargeScreen && styles.mobileCard]}>
            
            {/* LEFT: VISUAL SECTION (Desktop only) */}
            {isLargeScreen && (
              <View style={styles.visualSection}>
                <View style={styles.glow1} />
                <Animated.View style={animatedImageStyle}>
                  <Image source={require("../assets/ai-student.png")} style={styles.visualImg} />
                </Animated.View>
                <View style={styles.floatingInfo}><Text style={styles.infoText}>SECURE REGISTRATION NODE</Text></View>
              </View>
            )}

            {/* RIGHT: SIGN UP FORM SECTION */}
            <View style={styles.formSection}>
              <View style={styles.authCard}>
                <View style={styles.statusBadge}><Text style={styles.badgeText}>USER REGISTRATION v3.1</Text></View>
                <Text style={styles.mainTitle}>CREATE<Text style={{color: '#a855f7'}}>ACCOUNT</Text></Text>
                <Text style={styles.subText}>Identify Verification Required.</Text>

                {/* FULL NAME INPUT */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput 
                    placeholder="Juan Dela Cruz" 
                    onChangeText={setFullName} 
                    style={styles.fieldInput} 
                    placeholderTextColor="#94a3b8" 
                    returnKeyType="next"
                  />
                </View>

                {/* EMAIL/MOBILE INPUT */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>HCDC Email or Mobile No.</Text>
                  <TextInput 
                    placeholder="user@hcdc.edu.ph" 
                    onChangeText={setContact} 
                    style={styles.fieldInput} 
                    placeholderTextColor="#94a3b8" 
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                {/* SECURE PASSWORD INPUT */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Security Password</Text>
                  <View style={styles.passInputWrapper}>
                    <TextInput 
                        placeholder="••••••••••••••••" 
                        secureTextEntry={!showPassword} 
                        onChangeText={setPassword} 
                        style={styles.passInput} 
                        placeholderTextColor="#94a3b8" 
                        returnKeyType="done"
                        onSubmitEditing={handleSignUp}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconPadding}>
                      <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#a855f7" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>Include at least one symbol (e.g. @, #, $)</Text>
                </View>

                <TouchableOpacity style={styles.executeBtn} onPress={handleSignUp}>
                    <Text style={styles.btnText}>REGISTER NOW</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigation.navigate("Login")} 
                    style={styles.bottomLink}
                >
                  <Text style={styles.linkText}>Already registered? <Text style={styles.linkHighlight}>Log In</Text></Text>
                </TouchableOpacity>
              </View>
            </View>

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
    minHeight: 700, 
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

  visualSection: { flex: 1.2, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  visualImg: { width: 450, height: 450, resizeMode: 'contain' }, 
  glow1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(168, 85, 247, 0.05)' },
  floatingInfo: { position: 'absolute', bottom: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  infoText: { color: '#a855f7', fontSize: 9, fontWeight: '800' },

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
  
  helperText: { color: '#475569', fontSize: 9, marginTop: 5 },
  executeBtn: { backgroundColor: '#a855f7', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  
  bottomLink: { alignItems: 'center', marginTop: 25 },
  linkText: { color: '#475569', fontSize: 12 },
  linkHighlight: { color: '#a855f7', fontWeight: '800' }
});