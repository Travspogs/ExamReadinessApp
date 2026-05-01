import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ReviewScreen({ route, navigation }) {
  const { wrongAnswers = [] } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>{"<"}</Text>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Review Mistake</Text>
          <Text style={styles.headerSub}>REVIEW MODE</Text>
        </View>

        <View style={{ width: 35 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.summaryText}>
          RESULT REVIEW: {wrongAnswers.length}
        </Text>

        {wrongAnswers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              PERFECT SCORE • 100% ACCURACY
            </Text>
          </View>
        ) : (
          wrongAnswers.map((item, i) => (
            <View key={i} style={styles.card}>
              {/* ENTRY HEADER */}
              <View style={styles.qHeader}>
                <View style={styles.qNumberBadge}>
                  <Text style={styles.qNumberText}>ENTRY #{i + 1}</Text>
                </View>
                <View style={styles.statusDot} />
              </View>

              {/* QUESTION */}
              <Text style={styles.questionText}>{item.question}</Text>

              {/* ANSWERS SECTION - Side by Side para hindi mahaba */}
              <View style={styles.answerSectionRow}>
                {/* USER ANSWER */}
                <View style={[styles.userAnswerBox, styles.flex1]}>
                  <Text style={styles.label}>USER INPUT</Text>
                  <Text style={styles.userValue} numberOfLines={2}>
                    {item.userAnswer || "N/A"}
                  </Text>
                </View>

                {/* CORRECT ANSWER */}
                <View style={[styles.correctAnswerBox, styles.flex1]}>
                  <Text style={styles.labelActive}>CORRECT</Text>
                  <Text style={styles.correctValue} numberOfLines={2}>
                    {item.answer || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020512",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15, // Compact header
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.2)",
    backgroundColor: "#0B0F19",
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  backIcon: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "900",
  },
  titleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerSub: {
    color: "#6366f1",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: "center", // I-center ang mga cards
  },
  summaryText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#0B0F19",
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    width: "100%",
    maxWidth: 500, // Limit sa lapad para hindi stretched
  },
  qHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  qNumberBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qNumberText: {
    color: "#6366f1",
    fontSize: 9,
    fontWeight: "900",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  questionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 15,
  },
  /* NEW ROW LAYOUT */
  answerSectionRow: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  userAnswerBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    minHeight: 60, // Pantay na height
  },
  correctAnswerBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    minHeight: 60, // Pantay na height
  },
  label: {
    fontSize: 8,
    fontWeight: "800",
    color: "#ef4444",
    marginBottom: 4,
    letterSpacing: 1,
  },
  labelActive: {
    fontSize: 8,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 4,
    letterSpacing: 1,
  },
  userValue: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "700",
  },
  correctValue: {
    color: "#86efac",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});