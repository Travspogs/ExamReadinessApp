import AsyncStorage from "@react-native-async-storage/async-storage";

// Gagamit tayo ng iisang KEY para sa lahat ng screens
const USERS_KEY = "registered_users";
const SESSION_KEY = "current_user";

// --- REGISTER USER ---
export const registerUser = async (contact, password, fullName) => {
  try {
    if (!fullName || fullName.trim().length === 0) {
      return { 
        success: false, 
        message: "REQUIRED: Please enter your Full Name to proceed." 
      };
    }

    const trimmedContact = contact.toLowerCase().trim();

    // FLEXIBLE CONTACT CHECK
    const isEmail = trimmedContact.includes("@");
    if (isEmail) {
      if (!trimmedContact.endsWith("@hcdc.edu.ph")) {
        return { 
          success: false, 
          message: "ACCESS_DENIED: Only @hcdc.edu.ph emails are allowed." 
        };
      }
    } else {
      const phoneRegex = /^09[0-9]{9}$/;
      if (!phoneRegex.test(trimmedContact)) {
        return { 
          success: false, 
          message: "PROTOCOL_ERROR: Invalid phone number format." 
        };
      }
    }

    const existingData = await AsyncStorage.getItem(USERS_KEY);
    let users = existingData ? JSON.parse(existingData) : [];

    // IDENTITY CONFLICT CHECK
    if (users.find(u => (u.email === trimmedContact) || (u.contact === trimmedContact))) {
      return { 
        success: false, 
        message: "IDENTITY_CONFLICT: This contact is already registered." 
      };
    }

    // SAVE IDENTITY
    const newUser = { 
      contact: trimmedContact,
      email: isEmail ? trimmedContact : "", 
      password: password, 
      fullName: fullName.trim() 
    };

    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    console.log("REGISTRATION_SUCCESS:", trimmedContact);
    return { success: true };
  } catch (error) {
    return { success: false, message: "SYSTEM_ERROR: Storage failed." };
  }
};

// --- LOGIN USER ---
export const loginUser = async (contact, password) => {
  try {
    const trimmedContact = contact.toLowerCase().trim();
    const data = await AsyncStorage.getItem(USERS_KEY);
    
    if (!data) return null;

    const users = JSON.parse(data);
    
    // Hahanapin yung user (check email field OR contact field)
    const user = users.find(u => 
      (u.contact === trimmedContact || u.email === trimmedContact) && 
      u.password === password
    );

    if (user) {
      // Isave ang session
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user; 
    }
    return null; 
  } catch (error) {
    console.error("Login Error:", error);
    return null;
  }
};

// --- LOGOUT USER ---
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem("userToken"); // Linisin pati yung token
    console.log("LOGOUT_SUCCESS: Session cleared.");
    return true;
  } catch (error) {
    console.error("Logout Error:", error);
    return false;
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (contact, newPassword) => {
  try {
    const trimmedContact = contact.toLowerCase().trim();
    const data = await AsyncStorage.getItem(USERS_KEY);
    if (!data) return { success: false, message: "User base empty." };

    let users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.contact === trimmedContact || u.email === trimmedContact);

    if (userIndex === -1) {
      return { success: false, message: "Contact not found." };
    }

    users[userIndex].password = newPassword;
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { success: true, message: "Password updated!" };
  } catch (error) {
    return { success: false, message: "Reset failed." };
  }
};

// --- SOCIAL LOGIN ---
export const socialLogin = async (email, provider, name) => {
  try {
    const lowerEmail = email.toLowerCase().trim();
    const existingData = await AsyncStorage.getItem(USERS_KEY);
    let users = existingData ? JSON.parse(existingData) : [];

    let user = users.find(u => u.email === lowerEmail || u.contact === lowerEmail);

    if (!user) {
      user = { 
        contact: lowerEmail,
        email: lowerEmail,
        password: `SOCIAL_${provider}_${Date.now()}`,
        fullName: name || `User_${provider}`
      };
      users.push(user);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    return { success: false };
  }
};