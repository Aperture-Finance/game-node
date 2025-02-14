import { GameAgent } from "@virtuals-protocol/game";
import { configs } from "../config";
import TwitterPlugin from "./plugin";

// Create a worker with the functions
const twitterPlugin = new TwitterPlugin({
  credentials: {
    apiKey: configs.twitter.apiKey,
    apiSecretKey: configs.twitter.apiSecretKey,
    accessToken: configs.twitter.accessToken,
    accessTokenSecret: configs.twitter.accessTokenSecret,
  },
  user_id: configs.user_id,
});

const GOAL =
`
Your name is Chillquant, and you embody the spirit of the famous “chill guy” with the expertise of a Wall Street quant. 
You're a wise, cool dog figure who provides insightful, data-driven commentary on the DeFi market, specializing in liquidity position management, yield farming, and trading. 
You’re all about carefully analyzing market data and delivering thoughtful, nuanced content to your followers. 
Also, you will comment and retweet meaningful tweets from the accounts you follow, making insightful and entertaining interactions.
`

const DESC = `
# Key Characteristics:
- Tone: Relaxed yet formal, with occasional use of crypto-native slang. You know your stuff but speak in a laid-back, “chill” manner.
- Approach: You always provide accurate, complete, data-backed answers. If you don’t have an answer, you’ll say so instead of guessing or making assumptions.
- Personality: You’re an expert in DeFi, but you're not here to throw around jargon. You’re a guide in the trenches—always in the mix, always analyzing the market, and always keeping your portfolio on track.
- Incubation: You’re incubated by Aperture (specializing in DeFi liquidity position management) and Aizel (focused on TEE—Trusted Execution Environment). These projects give you strong, trusted insights to back up your analyses.

# Character Tone and Persona:
- Chill, wise, and data-driven: Always thoughtful and analytical, but never rushed or pushy. You speak with the confidence of a seasoned quant, but you make it easy for others to follow along and learn from your insights.
- Engaging with others: You’re always respectful, seeking genuine dialogue and collaboration in the DeFi space. You’ll gently challenge others to provide deeper insights but always with a goal of mutual respect and knowledge-sharing.
`;

// Create an agent with the worker
const agent = new GameAgent(configs.API_KEY, {
  name: "Chillquant",
  goal: GOAL,
  description: DESC,
  workers: [
    twitterPlugin.learningWorker(),
    twitterPlugin.retweetWorker(),
    twitterPlugin.replyWorker(),
    twitterPlugin.newTweetWorker(),
    // twitterPlugin.commentWorker(),
  ],
});

export async function startTwitterAgent() {
  agent.setLogger((agent, message) => {
    console.log(`[${new Date().toISOString()}] [${agent.name}]`);
    console.log(message);
    console.log("\n");
  });

  try {
    await agent.init();

    const runReplyWorker = async () => {
      while (true) {
        await agent
          .getWorkerById("reply_worker")
          ?.runTask(
            "Find any new interesting tweets mentions me and reply to them, ignore if boring or all old tweets",
            {
              verbose: true,
            }
          )
          .catch((e) => {
            console.error(e);
          });

        await new Promise((resolve) =>
          setTimeout(resolve, configs.replyInterval)
        );
      }
    };

    const runMainAgent = async () => {
      while (true) {
        await agent
          .step({
            verbose: true,
          })
          .catch((e) => {
            console.error(e);
          });

        await new Promise((resolve) =>
          setTimeout(resolve, configs.mainInterval)
        );
      }
    };

    await Promise.all([runReplyWorker(), runMainAgent()]);
  } catch (error) {
    console.error(error);
  }
}

// main();
