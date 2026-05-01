/**
 * logPrediction - Loggar nya tips som skapas via EventBridge
 *
 * Denna Lambda triggas av EventBridge-eventet "PredictionCreated"
 * som skickas från createPrediction-handlern.
 *
 * Används för audit trail / monitoring / framtida notifikationer.
 * Kan enkelt byggas ut med t.ex. SNS-notiser eller Slack-webhooks.
 */

export const handler = async (event: any) => {
  console.log("🔄 logPrediction triggered", {
    source: event.source || "unknown",
    detailType: event["detail-type"] || "unknown",
  });

  // Validera att eventet innehåller data
  if (!event.detail) {
    console.error("❌ No event detail received - malformed EventBridge event");
    throw new Error("Missing event detail");
  }

  const { predictionId, matchId, predictedHome, predictedAway, createdAt } = event.detail;

  // Validera att alla förväntade fält finns
  if (!predictionId || !matchId || predictedHome === undefined || predictedAway === undefined) {
    console.error("❌ Incomplete event detail:", event.detail);
    throw new Error("Incomplete event detail - missing required fields");
  }

  // Logga tipset strukturerat (bra för CloudWatch Insights-queries)
  console.log(JSON.stringify({
    action: "PREDICTION_CREATED",
    predictionId,
    matchId,
    predictedHome,
    predictedAway,
    createdAt,
    timestamp: new Date().toISOString(),
  }));

  console.log(`✅ Logged: match ${matchId} → ${predictedHome}-${predictedAway}`);

  return {
    logged: true,
    predictionId,
  };
};
