import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
// Siguraduhin na ang AppNavigator.js ay nasa loob ng src/navigation/
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Hahanapin nito kung may naka-save na Google Token o Manual Token
        const token = await AsyncStorage.getItem("userToken");
        setUserToken(token);
      } catch (e) {
        console.log("Token check error:", e);
      } finally {
        // Pagkatapos mag-check, tatanggalin na ang Loading Screen
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // Ito ang ipapakita habang nagbabasa pa ng data (para hindi white screen agad)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Ipapasa natin ang initialRouteName: 
  // "Home" kung logged in, "Login" kung hindi.
  return (
    <AppNavigator initialRouteName={userToken ? "Home" : "Login"} />
  );
}