import React from "react";
import { StyleSheet, View } from "react-native";
import { UserAvatar } from "./UserAvatar";

export function AppHeader({
  left,
  center,
  right,
  onAvatarPress,
}: {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  onAvatarPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {left ?? <UserAvatar onPress={onAvatarPress} />}
      </View>
      <View style={styles.center}>{center}</View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  left: {
    flex: 0,
    alignItems: "flex-start",
    minWidth: 48,
  },
  center: {
    flex: 2,
    alignItems: "center",
  },
  right: {
    flex: 0,
    alignItems: "flex-end",
    minWidth: 48,
  },
});
