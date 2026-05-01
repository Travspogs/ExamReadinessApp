import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AnalyticsScreen from "../screens/AnalyticsScreen";
import HomeScreen from "../screens/HomeScreen";
import InputScreen from "../screens/InputScreen";
import InsightsScreen from "../screens/InsightsScreen"; // Ito ang UI na may Performance Report
import LeaderboardScreen from "../screens/LeaderboardScreen";
import LoginScreen from "../screens/LoginScreen";
import QuizScreen from "../screens/QuizScreen";
import ResultScreen from "../screens/ResultScreen";
import ReviewScreen from "../screens/ReviewScreen";
import SignUpScreen from "../screens/SignUpScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Input" component={InputScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        
        {/* MAGKAHIWALAY NA SILA DITO */}
        <Stack.Screen name="Insights" component={InsightsScreen} /> 
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}