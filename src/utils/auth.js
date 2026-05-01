import AsyncStorage from "@react-native-async-storage/async-storage";

// --- REGISTER USER ---
export const registerUser = async (contact, password, fullName) => {
  try {
    // 1. REQUIRE FULL NAME CHECK
    if (!fullName || fullName.trim().length === 0) {
      return { 
        success: false, 
        message: "REQUIRED: Please enter your Full Name to proceed." 
      };
    }

    const trimmedContact = contact.toLowerCase().trim();

    // 2. FLEXIBLE CONTACT CHECK (Email or Phone)
    const isEmail = trimmedContact.includes("@");
    if (isEmail) {
      if (!trimmedContact.endsWith("@hcdc.edu.ph")) {
        return { 
          success: false, 
          message: "ACCESS_DENIED: Only @hcdc.edu.ph emails are allowed." 
        };
      }
    } else {
      // Basic check kung valid phone format (09...)
      const phoneRegex = /^09[0-9]{9}$/;
      if (!phoneRegex.test(trimmedContact)) {
        return { 
          success: false, 
          message: "PROTOCOL_ERROR: Invalid phone number format." 
        };
      }
    }

    const existingData = await AsyncStorage.getItem("users_list");
    let users = existingData ? JSON.parse(existingData) : [];

    // 3. IDENTITY CONFLICT CHECK
    if (users.find(u => u.contact === trimmedContact)) {
      return { 
        success: false, 
        message: "IDENTITY_CONFLICT: This contact is already registered." 
      };
    }

    // 4. SAVE IDENTITY (Mahalaga ang 'contact' field para sa StorageService)
    const newUser = { 
      contact: trimmedContact, 
      password: password, 
      fullName: fullName.trim() 
    };

    users.push(newUser);
    await AsyncStorage.setItem("users_list", JSON.stringify(users));
    
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

    const data = await AsyncStorage.getItem("users_list");
    if (!data) return false;

    const users = JSON.parse(data);
    
    // Hahanapin yung user na match ang contact (email/phone) at password
    const user = users.find(u => u.contact === trimmedContact && u.password === password);

    if (user) {
      // Isave ang session para malaman ng app kung sino ang active user
      await AsyncStorage.setItem("current_user", JSON.stringify(user));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Login Error:", error);
    return false;
  }
};

// --- LOGOUT USER (NEWLY ADDED) ---
export const logoutUser = async () => {
  try {
    // Tatanggalin ang current_user para sa susunod na login, malinis ang storage
    await AsyncStorage.removeItem("current_user");
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
    const data = await AsyncStorage.getItem("users_list");
    if (!data) return { success: false, message: "User base empty." };

    let users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.contact === trimmedContact);

    if (userIndex === -1) {
      return { success: false, message: "Contact not found." };
    }

    users[userIndex].password = newPassword;
    await AsyncStorage.setItem("users_list", JSON.stringify(users));
    
    return { success: true, message: "Password updated!" };
  } catch (error) {
    return { success: false, message: "Reset failed." };
  }
};

// --- SOCIAL LOGIN ---
export const socialLogin = async (email, provider) => {
  try {
    const lowerEmail = email.toLowerCase().trim();
    
    if (!lowerEmail.endsWith("@hcdc.edu.ph")) {
      return { success: false, message: "HCDC emails only." };
    }

    const existingData = await AsyncStorage.getItem("users_list");
    let users = existingData ? JSON.parse(existingData) : [];

    let user = users.find(u => u.contact === lowerEmail);

    if (!user) {
      user = { 
        contact: lowerEmail, 
        password: `SOCIAL_${provider}_${Date.now()}`,
        fullName: `User_${provider}`
      };
      users.push(user);
      await AsyncStorage.setItem("users_list", JSON.stringify(users));
    }

    await AsyncStorage.setItem("current_user", JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    return { success: false };
  }
};