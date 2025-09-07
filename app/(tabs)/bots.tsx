import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const bots = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    subtitle: "OpenAI’s flagship model",
    avatar: require("@/assets/images/react-logo.png"),
  },
  {
    id: "grok",
    name: "Grok",
    subtitle: "xAI’s conversational AI",
    avatar: require("@/assets/images/partial-react-logo.png"),
  },
  {
    id: "copilot",
    name: "Copilot",
    subtitle: "GitHub’s AI assistant",
    avatar: require("@/assets/images/icon.png"),
  },
];

export default function BotsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <FlatList
        data={bots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/bots/${item.id}`)}
          >
            <Image source={item.avatar} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#eee",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 80,
  },
});
