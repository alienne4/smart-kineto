import { Text, View } from "react-native";

import { EmptyState } from "../../components/ui";
import { colors } from "../../theme";

export default function PlaceholderScreen({ route }: any) {
  const title = route?.params?.title || route?.name || "Screen";
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 24 }}>
      <EmptyState title={title} subtitle="This route is preserved for the existing workflow." />
      <Text style={{ color: colors.textFaint, textAlign: "center" }}>Source for this screen was not present in the checkout.</Text>
    </View>
  );
}
