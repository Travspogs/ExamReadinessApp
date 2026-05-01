import { Ionicons } from '@expo/vector-icons';
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { registerUser } from "../utils/auth";

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    // 1. FULL NAME CHECK (REQUIRED)
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

      const hcdcRegex = /^[a-z]+\.[a-z]+@hcdc\.edu\.ph$/;
      if (!hcdcRegex.test(trimmedContact)) {
        return Alert.alert(
          "INVALID_FORMAT",
          "PROTOCOL_ERROR: Identity must follow 'firstname.lastname@hcdc.edu.ph'."
        );
      }
    } else {
      // Mobile validation
      const phoneRegex = /^09[0-9]{9}$/;
      if (!phoneRegex.test(trimmedContact)) {
        return Alert.alert("PROTOCOL_ERROR", "INVALID NUMBER: Use 11-digit mobile starting with 09.");
      }
    }

    // 4. PASSWORD STRENGTH
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 8 || !symbolRegex.test(password)) {
      return Alert.alert(
        "WEAK_SECURITY",
        "REGISTRATION FAILED: Password must be 8+ characters with at least one special character (!@#$)."
      );
    }

    try {
      // 5. EXECUTE REGISTRATION
      const result = await registerUser(trimmedContact, password, fullName.trim());
      
      if (result.success === false) {
        // THIS SHOWS THE "ACCOUNT ALREADY EXISTS" MESSAGE
        return Alert.alert("DATABASE_CONFLICT", result.message);
      }

      // SUCCESS
      Alert.alert("IDENTITY_CREATED", "System access granted. You can now login.");
      navigation.replace("Login"); 
      
    } catch (error) {
      Alert.alert("SYSTEM_CRASH", "Local storage error. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} bounces={false} showsVerticalScrollIndicator={false}>

        <View style={styles.left}>
          <View style={styles.glow1} /><View style={styles.glow2} />
          <View style={styles.aiWrapper}>
            <Image source={require("../assets/ai-student.png")} style={styles.aiImage} />
          </View>
          <View style={styles.floatingInfo}>
             <Text style={styles.infoText}>REGISTRATION STATUS: SECURE</Text>
          </View>
        </View>

        <View style={styles.right}>
          <View style={styles.card}>
            <View style={styles.badge}><Text style={styles.badgeText}>USER REGISTRATION v3.1</Text></View>
            <Text style={styles.title}>EXAM<Text style={{color: '#a855f7'}}>READINESS</Text></Text>
            <Text style={styles.subtitle}>Identify Verification Required</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput placeholder="Juan Dela Cruz" onChangeText={setFullName} style={styles.input} placeholderTextColor="#475569" />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>HCDC Email or Mobile No.</Text>
              <TextInput 
                placeholder="firstname.lastname@hcdc.edu.ph" 
                onChangeText={setContact} 
                style={[
                  styles.input, 
                  contact.includes("@") && !contact.toLowerCase().endsWith("@hcdc.edu.ph") && { borderColor: '#ef4444' }
                ]} 
                placeholderTextColor="#475569" 
                autoCapitalize="none" 
              />
              {contact.includes("@") && !contact.toLowerCase().endsWith("@hcdc.edu.ph") && (
                <Text style={styles.warningText}>REQUIRED: Use @hcdc.edu.ph domain</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Create Secure Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor="#475569"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#a855f7" />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Include at least one symbol (e.g. @, #, $)</Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleSignUp} style={styles.button}>
              <Text style={styles.buttonText}>REGISTER NOW</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkBase}>Already verified? <Text style={styles.linkHighlight}>Log In</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ... styles remain the same
const styles = StyleSheet.create({
  container: { flexDirection: "row", flexGrow: 1, backgroundColor: "#020512" },
  left: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B0F19" },
  right: { flex: 1.2, justifyContent: "center", alignItems: "center", padding: 30 },
  card: { width: "100%", maxWidth: 400, padding: 20 },
  badge: { backgroundColor: "rgba(168, 85, 247, 0.1)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "rgba(168, 85, 247, 0.3)", marginBottom: 20 },
  badgeText: { color: "#a855f7", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { fontSize: 36, fontWeight: "900", color: "#fff" },
  subtitle: { marginBottom: 30, color: "#475569", fontSize: 14 },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: "900", color: "#a855f7", marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: "#0B0F19", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.05)", padding: 16, borderRadius: 12, color: "#fff", fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 15 },
  warningText: { color: '#ef4444', fontSize: 9, marginTop: 5, fontWeight: 'bold' },
  helperText: { color: '#475569', fontSize: 9, marginTop: 5 },
  button: { backgroundColor: "#a855f7", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 2 },
  linkContainer: { marginTop: 30, alignItems: "center" },
  linkBase: { color: "#475569", fontSize: 12 },
  linkHighlight: { color: "#a855f7", fontWeight: "900", textDecorationLine: 'underline' },
  aiImage: { width: 280, height: 280, resizeMode: "contain" },
  glow1: { position: "absolute", width: 300, height: 300, backgroundColor: "#a855f7", borderRadius: 150, opacity: 0.05, top: -50, left: -50 },
  glow2: { position: "absolute", width: 300, height: 300, backgroundColor: "#6366f1", borderRadius: 150, opacity: 0.05, bottom: -100, right: -50 },
  floatingInfo: { position: "absolute", bottom: 40, backgroundColor: "rgba(11, 15, 25, 0.8)", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  infoText: { fontSize: 9, color: "#a855f7", fontWeight: "900", letterSpacing: 1 }
});