export const handler = async (event: any): Promise<void> => {
  console.log("🔄 logPrediction triggered");

  if (!event.detail) {
    console.warn("⚠️ No event detail received");
    return;
  }

  const { predictionId, matchId, predictedHome, predictedAway, createdAt } = event.detail;

  console.log(`📝 New prediction logged:`, {
    predictionId,
    matchId,
    predictedHome,
    predictedAway,
    createdAt,
  });

  console.log(`✅ User predicted match ${matchId}: ${predictedHome} - ${predictedAway}`);
};
