import { AppHeader } from "@/components/AppHeader";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          header: () => (
            <SafeAreaView edges={["top"]}>
              <AppHeader
                onAvatarPress={() => {
                  /* TODO: open drawer */
                }}
                center={
                  <Image
                    source={require("@/assets/images/icon.png")}
                    style={{ width: 32, height: 32 }}
                  />
                }
              />
            </SafeAreaView>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="magnifyingglass" color={color} />
          ),
          header: () => (
            <SafeAreaView edges={["top"]}>
              <AppHeader
                onAvatarPress={() => {
                  /* TODO: open drawer */
                }}
                center={
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <TextInput
                      placeholder="Search..."
                      style={{
                        backgroundColor: "#eee",
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        height: 36,
                        minWidth: 0,
                      }}
                    />
                  </View>
                }
                right={
                  <TouchableOpacity
                    onPress={() => {
                      /* TODO: open settings modal */
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <IconSymbol size={30} name="gearshape.fill" color="#888" />
                  </TouchableOpacity>
                }
              />
            </SafeAreaView>
          ),
        }}
      />
      <Tabs.Screen
        name="bots"
        options={{
          title: "Bots",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bolt.fill" color={color} />
          ),
          header: () => (
            <SafeAreaView edges={["top"]}>
              <AppHeader
                onAvatarPress={() => {
                  /* TODO: open drawer */
                }}
                center={
                  <Text style={{ fontWeight: "bold", fontSize: 18 }}>Bots</Text>
                }
                right={
                  <TouchableOpacity
                    onPress={() => {
                      /* TODO: open settings modal */
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <IconSymbol size={30} name="gearshape.fill" color="#888" />
                  </TouchableOpacity>
                }
              />
            </SafeAreaView>
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notification",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
          header: () => (
            <SafeAreaView edges={["top"]}>
              <AppHeader
                onAvatarPress={() => {
                  /* TODO: open drawer */
                }}
                center={
                  <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                    Notification
                  </Text>
                }
                right={
                  <TouchableOpacity
                    onPress={() => {
                      /* TODO: open settings modal */
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <IconSymbol size={30} name="gearshape.fill" color="#888" />
                  </TouchableOpacity>
                }
              />
            </SafeAreaView>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="envelope.fill" color={color} />
          ),
          header: () => (
            <SafeAreaView edges={["top"]}>
              <AppHeader
                onAvatarPress={() => {
                  /* TODO: open drawer */
                }}
                center={
                  <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                    Inbox
                  </Text>
                }
                right={
                  <TouchableOpacity
                    onPress={() => {
                      /* TODO: open settings modal */
                    }}
                    style={{ marginRight: 12 }}
                  >
                    <IconSymbol size={30} name="gearshape.fill" color="#888" />
                  </TouchableOpacity>
                }
              />
            </SafeAreaView>
          ),
        }}
      />
    </Tabs>
  );
}
