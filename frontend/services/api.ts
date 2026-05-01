const BASE_URL = "https://h8ft0qvj77.execute-api.eu-north-1.amazonaws.com";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";

export const getMatches = async () => {
  const res = await fetch(`${BASE_URL}/matches`, {
    headers: { "x-api-key": API_KEY },
  });
  return res.json();
};

export const getPredictions = async () => {
  const res = await fetch(`${BASE_URL}/predictions`, {
    headers: { "x-api-key": API_KEY },
  });
  return res.json();
};

export const createPrediction = async (
  matchId: string,
  predictedHome: number,
  predictedAway: number
) => {
  const res = await fetch(`${BASE_URL}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ matchId, predictedHome, predictedAway }),
  });
  return res.json();
};
