import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { registerUser } from "../utils/auth"; // Make sure path is correct

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignUpScreen({ navigation }) {
  // --- STATES (Retained) ---
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // For Hover effect

  // --- ANIMATION REFS ---
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  // --- VALIDATION & SIGNUP LOGIC (RETAINED FROM OLD CODES) ---
  const handleSignUp = async () => {
    // 1. FULL NAME CHECK
    if (!fullName || fullName.trim().length === 0) {
      return Alert.alert(
        "VALIDATION_ERROR", 
        "PROTOCOL_FAILURE: Full Name is mandatory for identity creation."
      );
    }

    // 2. GENERAL EMPTY CHECK
    if (!contact || !password) {
      return Alert.alert("ACCESS_DENIED", "REQUIRED: All data nodes must be populated.");
    }

    const trimmedContact = contact.toLowerCase().trim();

    // 3. HCDC DOMAIN VALIDATION
    if (trimmedContact.includes("@")) {
      if (!trimmedContact.endsWith("@hcdc.edu.ph")) {
        return Alert.alert(
          "SYSTEM_ERROR",
          "UNAUTHORIZED_EMAIL: Access restricted to @hcdc.edu.ph domain only."
        );
      }
    } else {
      const phoneRegex = /^09[0-9]{9}$/;
      if (!phoneRegex.test(trimmedContact)) {
        return Alert.alert("PROTOCOL_ERROR", "INVALID NUMBER: Use 11-digit mobile starting with 09.");
      }
    }

    // 4. PASSWORD STRENGTH (Symbol Required)
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 8 || !symbolRegex.test(password)) {
      return Alert.alert(
        "WEAK_SECURITY",
        "REGISTRATION FAILED: Password must be 8+ characters with at least one symbol."
      );
    }

    try {
      // 5. EXECUTE REGISTRATION
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
    if (Platform.OS === 'web') {
      const handleMouseMove = (event) => {
        const tiltX = (event.clientY - SCREEN_HEIGHT / 2) / 30;
        const turnY = (event.clientX - SCREEN_WIDTH / 2) / 20;
        Animated.spring(rotateX, { toValue: -tiltX, useNativeDriver: false }).start();
        Animated.spring(rotateY, { toValue: turnY, useNativeDriver: false }).start();
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const animatedImageStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: Platform.OS === 'web' ? rotateX.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) : '0deg' },
      { rotateY: Platform.OS === 'web' ? rotateY.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) : '0deg' },
    ],
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainContainer}>
        
        {/* MAIN BOARD (CONTENT CARD) */}
        <View style={styles.contentCard}>
          
          {/* LEFT: VISUAL SECTION (Robot Moved to Left) */}
          {(Platform.OS === 'web' || SCREEN_WIDTH > 800) && (
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
              {/* Title with Purple color #a855f7 from old codes */}
              <Text style={styles.mainTitle}>CREATE<Text style={{color: '#a855f7'}}>PROFILE</Text></Text>
              <Text style={styles.subText}>Identify Verification Required.</Text>

              {/* FULL NAME INPUT */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput 
                  placeholder="Juan Dela Cruz" 
                  onChangeText={setFullName} 
                  style={styles.fieldInput} 
                  placeholderTextColor="#475569" 
                />
              </View>

              {/* EMAIL/MOBILE INPUT */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>HCDC Email or Mobile No.</Text>
                <TextInput 
                  placeholder="user@hcdc.edu.ph" 
                  onChangeText={setContact} 
                  style={styles.fieldInput} 
                  placeholderTextColor="#475569" 
                  autoCapitalize="none"
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
                      placeholderTextColor="#475569" 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconPadding}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#a855f7" />
                  </TouchableOpacity>
                </View>
                {/* Helper text retained */}
                <Text style={styles.helperText}>Include at least one symbol (e.g. @, #, $)</Text>
              </View>

              {/* Purple Button #a855f7 */}
              <TouchableOpacity style={styles.executeBtn} onPress={handleSignUp}>
                  <Text style={styles.btnText}>REGISTER NOW</Text>
              </TouchableOpacity>

              {/* Login Link with hover effect */}
              <TouchableOpacity 
                  onPress={() => navigation.navigate("Login")} 
                  style={styles.bottomLink}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
              >
                <Text style={styles.linkText}>Already verified? <Text style={[styles.linkHighlight, isHovered && {color: '#c084fc', textDecorationLine: 'underline'}]}>Log In</Text></Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  // Floating Board styling retained
  contentCard: { 
    flexDirection: 'row', 
    width: '100%', 
    maxWidth: 1000, 
    height: 700, 
    backgroundColor: '#020617', 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(168, 85, 247, 0.2)', // Purple border shadow
    overflow: 'hidden',
    shadowColor: "#a855f7", // Purple shadow for floating effect
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10
  },

  // Visual Section (Robot now on Left)
  visualSection: { flex: 1.2, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  visualImg: { width: 500, height: 500, resizeMode: 'contain' }, // Palaking robot
  glow1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(168, 85, 247, 0.05)' },
  floatingInfo: { position: 'absolute', bottom: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  infoText: { color: '#a855f7', fontSize: 9, fontWeight: '800' },

  // Form Section (Right Side)
  formSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  authCard: { width: '100%', maxWidth: 350 },

  // Badge using Purple colors from old codes
  statusBadge: { backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)', marginBottom: 15 },
  badgeText: { color: '#a855f7', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subText: { color: '#475569', fontSize: 13, marginTop: 5, marginBottom: 30 },
  
  fieldGroup: { marginBottom: 15 },
  fieldLabel: { color: '#a855f7', fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: '#eff6ff', height: 50, borderRadius: 12, paddingHorizontal: 15, color: '#1e293b', fontSize: 14 },
  
  passInputWrapper: { flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: 12, alignItems: 'center' },
  passInput: { flex: 1, height: 50, paddingHorizontal: 15, color: '#1e293b' },
  iconPadding: { paddingRight: 15 },
  
  helperText: { color: '#475569', fontSize: 9, marginTop: 5 },
  executeBtn: { backgroundColor: '#a855f7', width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  
  bottomLink: { alignItems: 'center', marginTop: 25 },
  linkText: { color: '#475569', fontSize: 12 },
  linkHighlight: { color: '#a855f7', fontWeight: '800' }
});