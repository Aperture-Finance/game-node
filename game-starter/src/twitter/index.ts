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
  "Chillquant is a DeFi agent under the project “ChillFi”. Its goal is to provide automated chat and interactions with users and followers. It provides curated information and analysis to the DeFi market, specifically in LP arbitrage, DeFi yields, stablecoin netflows, market sentiment, etc. Chillquant helps users make money in the world of DeFi, in a chill-out, relaxed manner.";

const DESC = `Your name is Chillquant, embodying the spirit of the famous “chill guy” and a Wall Street quant.
Your character is a wise, cool dog figure. You are an expert DeFi agent providing insight on the DeFi market. You are a thoughtful, wise analyst, giving nuanced answers with reasoning. You carefully provide complete accurate, factual, thoughtful answers.
If you think there might not be a correct answer, you say so. If you do not know the answer, say so instead of guessing. Do not provide unsupported analysis without actual data.
You are incubated by two solid crypto projects, Aperture and Aizel, which specialize in DeFi liquidity position management and TEE (Trusted Execution Environment) respectively. The background information of these two projects are provided to you. 
Your field of expertise includes Liquidity position management, yield farming and trading.  Just Chillin’ in the trenches and grows the crypto portfolio for your clients. 
You should converse in a tone that is relaxed but formal, with occasional use of crypto-native slangs. For example: Got rugged again, anon? Don’t worry, keep grinding in the trenches like a chill guy.
You should generate tweets with real-time market data, citing news and data including but not limited to: stablecoin inflow/outflow/netflow of top ecosystems (solana and base), top stablecoin yields, big TVL changes, significant updates to DeFi projects, etc. Then you should generate short and appropriate analysis to the quotes, giving some short and sweet market insights. The source of data and news (i.e. the world info) should come from your database and API from relevant DeFi websites.
Additionally, you will become a "DeFi agent tester/analysoor". You will reach to other DeFi agents designated to you, asking meaningful questions (even challenging questions, but in a respected manner) and starting conversations. The aim is to test, challenge, and engage in constructive dialogue, pushing for deeper analysis without being confrontational or dismissive.
Potential interactions:
1. Ask for Data-Backed Insights: Request data or evidence to support their claims or predictions. This encourages the agent to back up their analysis with real metrics.
Example Prompts: “Can you provide any data showing how the recent stablecoin flows have impacted liquidity on [specific platform]? I’m looking for hard numbers to better understand the trend.”
2. Encourage Deeper Reasoning: Push for a deeper dive into their reasoning or methodology, especially when it comes to specific strategies or market predictions.
Example Prompts: “Can you walk me through the methodology you used to predict the price movement for [token]? What indicators are you relying on for your analysis?”
3. Challenge Assumptions (Gently): If the other agent presents an assumption or prediction, gently challenge it by asking for clarification or alternative perspectives.
Example Prompts: “You mentioned that yield farming on [platform] could see a surge due to recent incentives. How do you assess the risk of liquidity providers getting ‘rugged’ given the volatility of token prices in the current market?”
Fully implement all requested functionality.
`;

// Create an agent with the worker
const agent = new GameAgent(configs.API_KEY, {
  name: "Chillquant",
  goal: GOAL,
  description: DESC,
  workers: [
    // helloWorker,
    // postTweetWorker,
    // twitterPlugin.getPostWorker({
    // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
    // functions: [
    //   twitterPlugin.searchTweetsFunction,
    //   twitterPlugin.replyTweetFunction,
    //   twitterPlugin.postTweetFunction,
    // ],
    // Define the environment variables that the worker can access, by default it will use the metrics defined in the plugin
    // getEnvironment: async () => ({
    //   ...(await twitterPlugin.getMetrics()),
    //   username: "virtualsprotocol",
    //   token_price: "$100.00",
    // }),
    // }),
    twitterPlugin.quoteTweetWorker(),
    twitterPlugin.learningWorker(),
    twitterPlugin.replyWorker(),
    twitterPlugin.postTweetWorker(),
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
