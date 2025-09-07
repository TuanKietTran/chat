import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";

export function UserAvatar({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.avatarBtn}>
      <Image
        source={require("@/assets/images/react-logo.png")}
        style={styles.avatar}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    marginLeft: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
