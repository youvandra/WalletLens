export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  oklinkApiKey: process.env.OKLINK_API_KEY || "",
  opencodeApiKey: process.env.OPENGATE_API_KEY || "",
  opencodeBaseUrl: "https://opencode.ai/zen/v1",
};
