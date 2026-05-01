// Sa loob ng Insights Screen mo:
const getWeakness = (progress) => {
  // Gagawin nating array ang object para ma-sort
  const statsArray = Object.entries(progress).map(([name, value]) => ({ name, value }));
  
  // Hanapin ang subject na may pinakamababang value
  const weakness = statsArray.reduce((prev, current) => (prev.value < current.value) ? prev : current);

  if (weakness.value < 50) {
    return `CRITICAL: Your mastery in ${weakness.name} is low (${weakness.value}%). Focus on this module to balance your stats.`;
  } else {
    return "All systems stable. No major weaknesses detected.";
  }
};