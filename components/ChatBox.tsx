import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const plugins = [
  {
    type: "mention",
    trigger: "@",
    getSuggestions: (text: string) =>
      ["gpt-4o", "grok", "copilot"].filter((u) => u.startsWith(text)),
  },
  {
    type: "command",
    trigger: "/",
    getSuggestions: (text: string) =>
      ["help", "reset", "about"].filter((c) => c.startsWith(text)),
  },
];

export function ChatBox({ botId }: { botId: string }) {
  const [messages, setMessages] = useState<{ text: string; from: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activePlugin, setActivePlugin] = useState<null | (typeof plugins)[0]>(
    null
  );
  const [clickedMentionIdxs, setClickedMentionIdxs] = useState<number[]>([]);

  function handleInputChange(text: string) {
    setInput(text);
    for (const plugin of plugins) {
      if (text.endsWith(plugin.trigger)) {
        setActivePlugin(plugin);
        setSuggestions(plugin.getSuggestions(""));
        return;
      }
      if (activePlugin && text.includes(activePlugin.trigger)) {
        const after = text.split(activePlugin.trigger).pop() || "";
        setSuggestions(activePlugin.getSuggestions(after));
        return;
      }
    }
    setActivePlugin(null);
    setSuggestions([]);
  }

  function handleSend() {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, from: "user" }]);
    setInput("");
    setActivePlugin(null);
    setSuggestions([]);
    setClickedMentionIdxs([]);
  }

  function handleSuggestionPress(s: string) {
    if (!activePlugin) return;
    const before = input.lastIndexOf(activePlugin.trigger);
    const newText = input.slice(0, before + 1) + s + " ";
    setInput(newText);
    setActivePlugin(null);
    setSuggestions([]);
  }

  function handleMentionPress(idx: number) {
    setClickedMentionIdxs((prev) =>
      prev.includes(idx) ? prev : [...prev, idx]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={120}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => {
            const parts = item.text.split(/(@\w+)/g);
            let mentionIdx = 0;
            return (
              <View
                style={item.from === "user" ? styles.userMsg : styles.botMsg}
              >
                <Text>
                  {parts.map((part, idx) => {
                    if (/^@\w+$/.test(part)) {
                      const thisMentionIdx = mentionIdx;
                      mentionIdx++;
                      return (
                        <Text
                          key={idx}
                          style={{ color: "#007aff", fontWeight: "bold" }}
                          onPress={() => handleMentionPress(thisMentionIdx)}
                        >
                          {part}
                        </Text>
                      );
                    }
                    if (
                      idx > 0 &&
                      /^@\w+$/.test(parts[idx - 1]) &&
                      clickedMentionIdxs.includes(mentionIdx - 1)
                    ) {
                      return (
                        <Text key={idx} style={{ color: "#007aff" }}>
                          {part}
                        </Text>
                      );
                    }
                    return <Text key={idx}>{part}</Text>;
                  })}
                </Text>
              </View>
            );
          }}
          style={styles.messages}
          contentContainerStyle={{ padding: 12 }}
          inverted
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleSuggestionPress(s)}
                style={styles.suggestionBtn}
              >
                <Text>
                  {activePlugin?.type === "mention" ? "@" : "/"}
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.inputRow}>
          <View style={styles.inputOverlayWrapper}>
            {/* Highlighted styled text below the TextInput */}
            <Text style={styles.inputOverlayText} pointerEvents="none">
              {(() => {
                const parts = input.split(/(@\w+|https?:\/\/[^\s]+)/g);
                return parts.map((part, idx) => {
                  if (/^@\w+$/.test(part)) {
                    return (
                      <Text
                        key={idx}
                        style={{ color: "#007aff", fontWeight: "bold" }}
                      >
                        {part}
                      </Text>
                    );
                  }
                  if (/^https?:\/\//.test(part)) {
                    return (
                      <Text
                        key={idx}
                        style={{
                          color: "#1e90ff",
                          textDecorationLine: "underline",
                        }}
                      >
                        {part}
                      </Text>
                    );
                  }
                  return <Text key={idx}>{part}</Text>;
                });
              })()}
            </Text>
            <TextInput
              style={styles.inputOverlayInput}
              value={input}
              onChangeText={handleInputChange}
              multiline
              placeholder={"Message " + botId}
              placeholderTextColor="#aaa"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messages: {
    flex: 1,
  },
  userMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#e6f7ff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    maxWidth: "80%",
  },
  botMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    maxWidth: "80%",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafbfc",
  },
  inputOverlayWrapper: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 20,
    backgroundColor: "#fafbfc",
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 16,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  inputOverlayText: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    color: "transparent", // fallback for empty input
    zIndex: 1,
    fontSize: 16,
    minHeight: 24,
    flexWrap: "wrap",
    lineHeight: 24,
  },
  inputOverlayInput: {
    color: "#222",
    fontSize: 16,
    minHeight: 24,
    maxHeight: 96,
    zIndex: 2,
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestionBtn: {
    backgroundColor: "#e6e6e6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
  },
});
