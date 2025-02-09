import dotenv from "dotenv";
dotenv.config();

export const devConfigs = {
  API_KEY: process.env.API_KEY || "",
  CMC_API_KEY: process.env.CMC_API_KEY || "",
  replyInterval: 15 * 60 * 1000, // every 5 mins
  quoteInterval: 15 * 60 * 1000, // every 15 mins
  mainInterval: 15 * 60 * 1000, // every 30 mins
  learningInterval: 60 * 60 * 1000, // every 1 hour

  user_id: "1886624874543898625",

  twitter: {
    apiKey: process.env.TWITTER_API_KEY || "",
    apiSecretKey: process.env.TWITTER_API_SECRET_KEY || "",
    accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || "",
  },

  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  },
  redisPrefix: "dev_",
};

export const isProduction = process.env.IS_PRODUCTION === "true";
const prodConfig = {
  user_id: "1884133410769383424",
  replyInterval: 3 * 60 * 60 * 1000, // every 3 hours
  quoteInterval: 6 * 60 * 60 * 1000, // every 6 hours
  mainInterval: 6 * 60 * 60 * 1000, // every 6 hours
  learningInterval: 6 * 60 * 60 * 1000, // every 6 hours
  redisPrefix: "prod_",
};

export const configs = {
  ...devConfigs,
  ...(isProduction ? prodConfig : {}),
};
