export const handler = async (event: any) => {
  console.log("🔐 Authorizer called");

  const apiKey = event.headers?.["x-api-key"];
  const validKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("⚠️ No API key provided");
    return { isAuthorized: false };
  }

  if (apiKey === validKey) {
    console.log("✅ Authorization successful");
    return { isAuthorized: true };
  }

  console.warn("⚠️ Invalid API key provided");
  return { isAuthorized: false };
};
