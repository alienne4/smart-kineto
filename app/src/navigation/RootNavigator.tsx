import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { colors, fonts } from "../theme";
import { Icon, IconName } from "../components/ui";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import NotificationCenterScreen from "../screens/NotificationCenterScreen";
import NewsScreen from "../screens/NewsScreen";
import NewsDetailScreen from "../screens/NewsDetailScreen";
// chat
import ThreadsScreen from "../screens/chat/ThreadsScreen";
import ChatScreen from "../screens/chat/ChatScreen";
// trainer
import TrainerHomeScreen from "../screens/trainer/TrainerHomeScreen";
import ExerciseListScreen from "../screens/trainer/ExerciseListScreen";
import CreateExerciseScreen from "../screens/trainer/CreateExerciseScreen";
import CreateHardwareExerciseScreen from "../screens/trainer/CreateHardwareExerciseScreen";
import RecordWandTemplateScreen from "../screens/trainer/RecordWandTemplateScreen";
import ExerciseDetailScreen from "../screens/trainer/ExerciseDetailScreen";
import ProgramListScreen from "../screens/trainer/ProgramListScreen";
import CreateProgramScreen from "../screens/trainer/CreateProgramScreen";
import TrainerProgramDetailScreen from "../screens/trainer/ProgramDetailScreen";
import PatientListScreen from "../screens/trainer/PatientListScreen";
import PatientDetailScreen from "../screens/trainer/PatientDetailScreen";
import AssignProgramScreen from "../screens/trainer/AssignProgramScreen";
import FindPatientsScreen from "../screens/trainer/FindPatientsScreen";
// patient
import PatientHomeScreen from "../screens/patient/PatientHomeScreen";
import PickTrainerScreen from "../screens/patient/PickTrainerScreen";
import AssignedProgramsScreen from "../screens/patient/AssignedProgramsScreen";
import BrowseProgramsScreen from "../screens/patient/BrowseProgramsScreen";
import AssistantScreen from "../screens/patient/AssistantScreen";
import PatientProgramDetailScreen from "../screens/patient/ProgramDetailScreen";
import ExercisePlayerScreen from "../screens/patient/ExercisePlayerScreen";
import HardwareExercisePlayerScreen from "../screens/patient/HardwareExercisePlayerScreen";
import AssessmentScreen from "../screens/patient/AssessmentScreen";
import ProgressScreen from "../screens/patient/ProgressScreen";
import ProfileScreen from "../screens/patient/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const stackOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.textMuted,
  headerTitleStyle: { fontFamily: fonts.monoSemiBold, fontSize: 13, letterSpacing: 1 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
  headerBackButtonDisplayMode: "minimal" as const,
};

const tabOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: { fontFamily: fonts.monoSemiBold, fontSize: 8, letterSpacing: 0.6, textTransform: "uppercase" as const },
};

function icon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => <Icon name={name} color={color} size={size - 4} />;
}

// ---------- Shared ----------
function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Threads" component={ThreadsScreen} options={{ title: "Messages" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
    </Stack.Navigator>
  );
}

// ---------- Trainer ----------
function TrainerHomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="TrainerHome" component={TrainerHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationCenterScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="News" component={NewsScreen} options={{ title: "News & events" }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: "" }} />
    </Stack.Navigator>
  );
}
function TrainerExercisesStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: "Exercises" }} />
      <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} options={{ title: "New exercise" }} />
      <Stack.Screen name="CreateHardwareExercise" component={CreateHardwareExerciseScreen} options={{ title: "New hardware exercise" }} />
      <Stack.Screen name="RecordWandTemplate" component={RecordWandTemplateScreen} options={{ title: "Record reference" }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: "Exercise" }} />
    </Stack.Navigator>
  );
}
function TrainerProgramsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProgramList" component={ProgramListScreen} options={{ title: "Programs" }} />
      <Stack.Screen name="CreateProgram" component={CreateProgramScreen} options={{ title: "New program" }} />
      <Stack.Screen name="ProgramDetail" component={TrainerProgramDetailScreen} options={{ title: "Program" }} />
    </Stack.Navigator>
  );
}
function TrainerPatientsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: "Patients" }} />
      <Stack.Screen name="FindPatients" component={FindPatientsScreen} options={{ title: "Find patients" }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: "Patient" }} />
      <Stack.Screen name="AssignProgram" component={AssignProgramScreen} options={{ title: "Assign program" }} />
    </Stack.Navigator>
  );
}
function TrainerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={TrainerHomeStack} options={{ tabBarIcon: icon("home") }} />
      <Tab.Screen name="Exercises" component={TrainerExercisesStack} options={{ tabBarIcon: icon("barbell") }} />
      <Tab.Screen name="Programs" component={TrainerProgramsStack} options={{ tabBarIcon: icon("list") }} />
      <Tab.Screen name="Patients" component={TrainerPatientsStack} options={{ tabBarIcon: icon("people") }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: icon("chatbubbles") }} />
    </Tab.Navigator>
  );
}

// ---------- Patient ----------
function PatientHomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="PatientHome" component={PatientHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationCenterScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="News" component={NewsScreen} options={{ title: "News & events" }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: "" }} />
    </Stack.Navigator>
  );
}
function PatientProgramsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AssignedPrograms" component={AssignedProgramsScreen} options={{ title: "My programs" }} />
      <Stack.Screen name="BrowsePrograms" component={BrowseProgramsScreen} options={{ title: "Public programs" }} />
      <Stack.Screen name="ProgramDetail" component={PatientProgramDetailScreen} options={{ title: "Program" }} />
      <Stack.Screen name="ExercisePlayer" component={ExercisePlayerScreen} options={{ title: "Live Session" }} />
      <Stack.Screen name="HardwareExercisePlayer" component={HardwareExercisePlayerScreen} options={{ title: "Live Session" }} />
    </Stack.Navigator>
  );
}
function PatientAssistantStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AssistantHome" component={AssistantScreen} options={{ title: "AI assistant" }} />
    </Stack.Navigator>
  );
}
function PatientProgressStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProgressHome" component={ProgressScreen} options={{ title: "Progress" }} />
      <Stack.Screen name="Assessment" component={AssessmentScreen} options={{ title: "New check-in" }} />
    </Stack.Navigator>
  );
}
function PatientProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="PickTrainer" component={PickTrainerScreen} options={{ title: "Choose trainer" }} />
    </Stack.Navigator>
  );
}
function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={PatientHomeStack} options={{ tabBarIcon: icon("home") }} />
      <Tab.Screen name="Programs" component={PatientProgramsStack} options={{ tabBarIcon: icon("fitness") }} />
      <Tab.Screen name="Assistant" component={PatientAssistantStack} options={{ tabBarIcon: icon("sparkles") }} />
      <Tab.Screen name="Progress" component={PatientProgressStack} options={{ tabBarIcon: icon("trending-up") }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarIcon: icon("chatbubbles") }} />
      <Tab.Screen name="Profile" component={PatientProfileStack} options={{ tabBarIcon: icon("person") }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <Stack.Navigator screenOptions={stackOptions}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Sign up" }} />
        </Stack.Navigator>
      ) : user.role === "TRAINER" ? (
        <TrainerTabs />
      ) : (
        <PatientTabs />
      )}
    </NavigationContainer>
  );
}
