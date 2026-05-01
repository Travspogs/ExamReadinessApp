export const calculateScore = (hours, confidence, topics, difficulty) => {
  let score = 0;

  score += hours * 10;
  score += confidence * 15;
  score += topics * 10;

  if (difficulty === "Hard") score -= 10;
  if (difficulty === "Medium") score -= 5;

  if (score > 100) return 100;
  if (score < 0) return 0;

  return score;
};

export const getStatus = (score) => {
  if (score >= 80) return "READY";
  if (score >= 50) return "ALMOST READY";
  return "NOT READY";
};