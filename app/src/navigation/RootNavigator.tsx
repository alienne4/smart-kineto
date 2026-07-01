import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { Loading } from "../components/ui";
import LoginScreen from "../screens/shared/LoginScreen";
import RegisterScreen from "../screens/shared/RegisterScreen";
import PlaceholderScreen from "../screens/shared/PlaceholderScreen";
import ExercisePlayerScreen from "../screens/patient/ExercisePlayerScreen";
import PatientHomeScreen from "../screens/patient/PatientHomeScreen";
import TrainerHomeScreen from "../screens/trainer/TrainerHomeScreen";
import { colors } from "../theme";

const AuthStack = createNativeStackNavigator();
const PatientTabs = createBottomTabNavigator();
const PatientHomeStack = createNativeStackNavigator();
const TrainerTabs = createBottomTabNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}>
        <Loading />
      </View>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  }

  return user.role === "PATIENT" ? <PatientNavigator /> : <TrainerNavigator />;
}

function PatientNavigator() {
  return (
    <PatientTabs.Navigator screenOptions={({ route }) => tabOptions(route.name)}>
      <PatientTabs.Screen name="Home" component={PatientHomeNavigator} options={{ headerShown: false }} />
      <PatientTabs.Screen name="Programs" component={PlaceholderScreen} initialParams={{ title: "My programs" }} />
      <PatientTabs.Screen name="Progress" component={PlaceholderScreen} initialParams={{ title: "Progress" }} />
      <PatientTabs.Screen name="Assistant" component={PlaceholderScreen} initialParams={{ title: "AI assistant" }} />
      <PatientTabs.Screen name="Profile" component={PlaceholderScreen} initialParams={{ title: "Profile" }} />
    </PatientTabs.Navigator>
  );
}

function PatientHomeNavigator() {
  return (
    <PatientHomeStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.bg } }}>
      <PatientHomeStack.Screen name="PatientHome" component={PatientHomeScreen} options={{ headerShown: false }} />
      <PatientHomeStack.Screen name="ExercisePlayer" component={ExercisePlayerScreen} options={{ title: "Live Session" }} />
      <PatientHomeStack.Screen name="Notifications" component={PlaceholderScreen} initialParams={{ title: "Notifications" }} />
      <PatientHomeStack.Screen name="News" component={PlaceholderScreen} initialParams={{ title: "News and events" }} />
      <PatientHomeStack.Screen name="NewsDetail" component={PlaceholderScreen} initialParams={{ title: "News detail" }} />
      <PatientHomeStack.Screen name="ProgramDetail" component={PlaceholderScreen} initialParams={{ title: "Program detail" }} />
    </PatientHomeStack.Navigator>
  );
}

function TrainerNavigator() {
  return (
    <TrainerTabs.Navigator screenOptions={({ route }) => tabOptions(route.name)}>
      <TrainerTabs.Screen name="Dashboard" component={TrainerHomeScreen} options={{ headerShown: false }} />
      <TrainerTabs.Screen name="Exercises" component={PlaceholderScreen} initialParams={{ title: "Exercises" }} />
      <TrainerTabs.Screen name="Programs" component={PlaceholderScreen} initialParams={{ title: "Programs" }} />
      <TrainerTabs.Screen name="Patients" component={PlaceholderScreen} initialParams={{ title: "Patients" }} />
      <TrainerTabs.Screen name="Messages" component={PlaceholderScreen} initialParams={{ title: "Messages" }} />
    </TrainerTabs.Navigator>
  );
}

function tabOptions(name: string) {
  return {
    headerStyle: { backgroundColor: colors.bgElevated },
    headerTintColor: colors.text,
    tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name={tabIcon(name)} size={size} color={color} />,
    tabBarLabel: ({ color }: { color: string }) => <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{name}</Text>
  };
}

function tabIcon(name: string): keyof typeof Ionicons.glyphMap {
  switch (name) {
    case "Home":
    case "Dashboard":
      return "home-outline";
    case "Programs":
      return "list-outline";
    case "Progress":
      return "trending-up-outline";
    case "Assistant":
      return "sparkles-outline";
    case "Profile":
      return "person-outline";
    case "Exercises":
      return "barbell-outline";
    case "Patients":
      return "people-outline";
    case "Messages":
      return "chatbubbles-outline";
    default:
      return "ellipse-outline";
  }
}
