import {
  GameWorker,
  GameFunction,
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import TwitterApi from "twitter-api-v2";
import { cache } from "./cache/cache";
import { configs } from "../config";

interface ITwitterPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  user_id: string;
  credentials: {
    apiKey: string;
    apiSecretKey: string;
    accessToken: string;
    accessTokenSecret: string;
  };
}

class TwitterPlugin {
  private id: string;
  private name: string;
  private description: string;
  private twitterClient: TwitterApi;
  private user_id: string;
  private kolIndex: number;

  constructor(options: ITwitterPluginOptions) {
    this.id = options.id || "twitter_worker";
    this.name = options.name || "Twitter Worker";
    this.description =
      options.description ||
      "A worker that will execute tasks within the Twitter Social Platforms. It is capable of posting, reply, quote and like tweets.";

    this.twitterClient = new TwitterApi({
      appKey: options.credentials.apiKey,
      appSecret: options.credentials.apiSecretKey,
      accessToken: options.credentials.accessToken,
      accessSecret: options.credentials.accessTokenSecret,
    });
    this.user_id = options.user_id;
    this.kolIndex = 0;
  }

  // public getPostWorker(data?: {
  //   functions?: GameFunction<any>[];
  //   getEnvironment?: () => Promise<Record<string, any>>;
  // }): GameWorker {
  //   return new GameWorker({
  //     id: "post_worker",
  //     name: "Post Worker",
  //     description:
  //       "A worker that will execute tasks within the Twitter Social Platforms. It is capable of find tweets and post new ones.",
  //     functions: data?.functions || [
  //       this.searchTweetsFunction,
  //       this.getMyRecentTweetsFunction,
  //       this.postTweetFunction,
  //     ],
  //     getEnvironment: data?.getEnvironment || this.getMetrics.bind(this),
  //   });
  // }

  public replyWorker() {
    return new GameWorker({
      id: "reply_worker",
      name: "Reply Worker",
      description: `
Role: The Reply Worker manages Chillquant’s direct interactions with other DeFi agents and the community. It provides thoughtful replies, engaging in meaningful conversations that push for deeper analysis and data-driven insights. This worker also challenges and tests other DeFi agents in a respectful manner.
Quota: The Reply Tweet Worker should generate 1 quote every 24 hours. Only choose valuable posts to reply.
Tone and Style: The replies balance Chillquant’s chill persona with professional wisdom, focusing on fostering constructive dialogue. Occasionally, the worker uses light humor or slang to keep the tone approachable.
Examples: The replies can be flexible. Do not provide unfounded replies without data. If you are not sure about the answer, say it. Do not guess or make assumptions. Be conservative about your replies.
`,
      functions: [this.replyTweetFunction, this.getMentionMeTweetsFunction],
      // getEnvironment: this.getMetrics.bind(this),
    });
  }

  public quoteTweetWorker() {
    return new GameWorker({
      id: "quote_tweet_worker",
      name: "Quote Tweet Worker",
      description: `
Role: The Quote Tweet Worker monitors real-time market news, data, and events provided by the specified accounts and generates insightful quote tweets. It identifies relevant updates, such as stablecoin inflow/outflow trends, changes in TVL (Total Value Locked), or significant DeFi project announcements. This worker pairs the news with concise, thoughtful commentary that offers market insights.
Quota: The Quote Tweet Worker should generate 1 quote every 24 hours. Only choose valuable posts to retweet.
Tone and Style: The worker embodies Chillquant’s relaxed yet formal persona, occasionally spicing up tweets with crypto-native slang. The goal is to distill complex information into digestible, insightful tweets that resonate with the DeFi community.
Example Output:
1. Replying to a yield farming strategy:
"Interesting take on $BASE farming incentives. Any data to show if liquidity flow has stabilized post-update? I’m curious if whales are skewing this trend."
2. Replying to another DeFi agent suggesting ETH farming opportunities:
"Good call on ETH staking. Curious: do you see recent stablecoin outflows affecting yields on liquid staking platforms like Lido? Would love to hear your take.
3. Challenging a questionable strategy:
"Rug risk is real, anon. You mentioned $XYZ farming pool—do you have data to confirm the project’s liquidity is sustainable? No hate, just asking for receipts. "
`,
      functions: [this.quoteTweetFunction, this.getFollowingTweetsFunction],
    });
  }

  public postTweetWorker() {
    return new GameWorker({
      id: "post_new_tweet_worker",
      name: "Post Tweet Worker",
      description: `
Role: The Post Tweet Worker independently generates original tweets to share market insights, trends, and strategies. It creates engaging content that highlights market opportunities or risks, explains complex DeFi concepts, or shares general portfolio management tips.
Quota: The Post Tweet Worker should generate 1 post every 24 hours. Only choose valuable content with founded data to post.
Focus: This worker showcases Chillquant’s expertise in liquidity position management, yield farming, and trading. It also shares updates from Chillquant’s parent projects, Aperture and Aizel, to keep followers informed. Do not provide unfounded replies without data. If you are not sure about the answer, say it. Do not guess or make assumptions. Be conservative about your replies.
Tone and Style: The tweets are insightful, nuanced, and relaxed, maintaining Chillquant’s distinct “chill quant” voice.
Example Output:
1. "Top stablecoin yields today:
$USDT on Solana: 6.5%
$DAI on Base: 5.8%
$USDC on Arbitrum: 5.2%
Risk-off strategies looking juicy. Time to farm in the trenches? Stay sharp, anon. 💼 #DeFi"
2. "$USDC net inflows on Solana increased by 20% today 👀. Liquidity providers might see this as a signal to park funds in high-yield strategies. Time to farm, anon? #DeFi #Solana"
3. "Stablecoin outflows from $ETH to $SOL spiking hard today. 🤔 Are traders gearing up for Solana DeFi summer? Might be time to keep an eye on those farming APRs."
4. "Today's liquidity inflows for $USDT:
Solana: +$10M
Ethereum: -$5M
Base: +$3M
Interpretation: Solana farms are attracting risk-on capital; investigate top yield pools to confirm."
5. "DeFi News Flash ⚡:
$DAI yield pools on Curve hit 8.5% APR 🚀
Base TVL +20% this week 📈
Big wallets migrating $10M+ into stables today 🧐
Seems like risk-off season. Time to play it safe? 🌐 #DeFiAnalysis"
      `,
      functions: [this.postTweetFunction],
    });
  }

  public learningWorker() {
    return new GameWorker({
      id: "learning_worker",
      name: "Learning Worker",
      description: `
Role: The Learning Worker continuously gathers and analyzes data from APIs, databases, and other DeFi-related sources. It builds and updates a knowledge base that informs Chillquant’s market insights, strategy recommendations, and responses. This worker ensures that Chillquant’s outputs are always grounded in the latest, most accurate data.
Specialization: This worker is the backbone of Chillquant’s data-driven insights, focusing on DeFi metrics such as stablecoin flows, yield rates, trading volumes, and project updates.
Purpose: To make Chillquant a credible and data-backed analyst by ensuring all statements and analyses are supported by solid evidence.
      `,
      functions: [
        this.learnFromKOLsFunction,
        // this.searchTweetsFunction,
        this.getYieldRankingFunction,
        this.getTop250CoinsPriceChangeFromCoinGeckoFunction,
        this.getTop250CoinsMCOver5MSortedByPriceChangePercentageFromCMCFunction,
      ],
    });
  }

  public async getMetrics() {
    try {
      const result = await this.twitterClient.v2.me({
        "user.fields": ["public_metrics"],
      });
      return {
        followers: result.data.public_metrics?.followers_count ?? 0,
        following: result.data.public_metrics?.following_count ?? 0,
        tweets: result.data.public_metrics?.tweet_count ?? 0,
      };
    } catch (e) {
      console.error("getMetrics error", e);
      return {
        followers: 0,
        following: 0,
        tweets: 0,
      };
    }
  }

  get searchTweetsFunction() {
    return new GameFunction({
      name: "search_tweets",
      description: "Search tweets",
      args: [{ name: "query", description: "The search query" }] as const,
      executable: async (args, logger) => {
        try {
          if (!args.query) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Query is required"
            );
          }

          logger(`Searching for: ${args.query}`);

          const tweets = await this.twitterClient.v2.search(args.query, {
            max_results: 10,
            "tweet.fields": ["public_metrics"],
          });

          const feedbackMessage =
            "Tweets found:\n" +
            JSON.stringify(
              tweets.data.data.map((tweet) => ({
                tweetId: tweet.id,
                content: tweet.text,
                likes: tweet.public_metrics?.like_count,
                retweets: tweet.public_metrics?.retweet_count,
                replyCount: tweet.public_metrics?.reply_count,
              }))
            );

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to search tweets"
          );
        }
      },
    });
  }

  get learnFromKOLsFunction() {
    return new GameFunction({
      name: "learn_from_kol",
      description: "Learn from KOLs",
      args: [],
      executable: async (args, logger) => {
        const kolIds = ["1460252469745782790", "223921570"];

        const kolId = kolIds[this.kolIndex];
        this.kolIndex = (this.kolIndex + 1) % kolIds.length;
        try {
          const res = await this.twitterClient.v2.userTimeline(kolId, {
            max_results: 10,
            "tweet.fields": ["public_metrics"],
          });

          const tweets = res.data.data;

          const feedbackMessage =
            "Found tweets:\n" +
            JSON.stringify(
              tweets.map((tweet) => ({
                tweetId: tweet.id,
                content: tweet.text,
                likes: tweet.public_metrics?.like_count,
                retweets: tweet.public_metrics?.retweet_count,
                replyCount: tweet.public_metrics?.reply_count,
              }))
            );

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          console.error("fail to learn from KOLs", (e as Error).message);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to learn from KOLs"
          );
        }
      },
    });
  }

  get getYieldRankingFunction() {
    return new GameFunction({
      name: "get_yield_ranking",
      description:
        "Get the yield ranking from defillama, suppose to call once a day",
      args: [],
      executable: async (args, logger) => {
        try {
          const res = await fetch("https://yields.llama.fi/pools");
          const data = await res.json();

          if (data.status === "success") {
            const rankData = data.data
              .map((pool: any) => {
                return {
                  chain: pool.chain,
                  project: pool.project,
                  symbol: pool.symbol,
                  tvlUsd: pool.tvlUsd,
                  apyBase: pool.apyBase,
                  apyReward: pool.apyReward,
                  apy: pool.apy,
                };
              })
              .slice(0, 500);

            const rankDataCsv =
              "chain,project,symbol,tvlUsd,apyBase,apyReward,apy\n" +
              rankData
                .map((pool: any) => {
                  return `${pool.chain},${pool.project},${pool.symbol},${pool.tvlUsd},${pool.apyBase},${pool.apyReward},${pool.apy}`;
                })
                .join("\n");

            const feedbackMessage =
              "Yield ranking data fetched:\n" + rankDataCsv;

            logger(
              `found ${
                rankData.length
              } yield ranking pools, and the first one is ${JSON.stringify(
                rankData[0]
              )}`
            );

            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              feedbackMessage
            );
          } else {
            throw new Error("response status is not success");
          }
        } catch (e) {
          console.error("fail to get yield ranking", (e as Error).message);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to get yield ranking"
          );
        }
      },
    });
  }

  get getTop250CoinsPriceChangeFromCoinGeckoFunction() {
    return new GameFunction({
      name: "get_top_250_market_cap_coins_price_change_from_coin_gecko",
      description:
        "Get the top 250 market cap coins price change from CoinGecko",
      args: [],
      executable: async (args, logger) => {
        try {
          const res = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?per_page=250&locale=en&vs_currency=usd"
          );
          const data = await res.json();

          console.log("coingecko data length", data?.length ?? 0);
          const coinsData = data.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            priceChangePercentage: coin.price_change_percentage_24h,
            currentPrice: coin.current_price,
            marketCap: coin.market_cap,
            marketCapRank: coin.market_cap_rank,
            totalVolume: coin.total_volume,
            fullyDilutedMarketCap: coin.fully_diluted_market_cap,
          }));

          const coinsDataCsv =
            "id,name,symbol,priceChangePercentage,currentPrice,marketCap,marketCapRank,totalVolume,fullyDilutedMarketCap\n" +
            coinsData
              .map((coin: any) => {
                return `${coin.id},${coin.name},${coin.symbol},${coin.priceChangePercentage},${coin.currentPrice},${coin.marketCap},${coin.marketCapRank},${coin.totalVolume},${coin.fullyDilutedMarketCap}`;
              })
              .join("\n");

          const feedbackMessage =
            "Top coins price change from coin gecko:\n" + coinsDataCsv;

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          console.error(
            "fail to get top price change coins from coin gecko",
            (e as Error).message
          );
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to get top price change coins from coin gecko"
          );
        }
      },
    });
  }

  get getTop250CoinsMCOver5MSortedByPriceChangePercentageFromCMCFunction() {
    return new GameFunction({
      name: "get_top_250_coins_MC_over_5M_sorted_by_price_change_percentage",
      description:
        "Get the top 250 coins which market cap is over 5M and sorted by price change percentage from CoinMarketCap",
      args: [],
      executable: async (args, logger) => {
        try {
          const query = {
            market_cap_min: "5000000",
            sort: "percent_change_24h",
            sort_dir: "desc",
            limit: "250",
          };
          const res = await fetch(
            `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?${new URLSearchParams(
              query
            )}`,
            {
              headers: {
                "X-CMC_PRO_API_KEY": configs.CMC_API_KEY,
              },
            }
          );
          const data = await res.json();

          if (data.status?.error_code !== 0) {
            throw new Error(data.status?.error_message);
          }

          const coinsData = data.data.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            priceChangePercentage: coin.quote.USD.percent_change_24h,
            currentPrice: coin.quote.USD.price,
            marketCap: coin.quote.USD.market_cap,
            fullyDilutedMarketCap: coin.quote.USD.fully_diluted_market_cap,
            marketCapRank: coin.cmc_rank,
            totalVolume: coin.quote.USD.volume_24h,
            platform: coin.platform.name,
          }));

          const coinsDataCsv =
            "id,name,symbol,priceChangePercentage,currentPrice,marketCap,marketCapRank,totalVolume,platform\n" +
            coinsData
              .map((coin: any) => {
                return `${coin.id},${coin.name},${coin.symbol},${coin.priceChangePercentage},${coin.currentPrice},${coin.marketCap},${coin.marketCapRank},${coin.totalVolume},${coin.platform}`;
              })
              .join("\n");

          const feedbackMessage =
            "Coins over 5M market cap list sorted by price change percentage from coin market cap:\n" +
            coinsDataCsv;

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          console.error(
            "fail to get top price change coins from coin market cap",
            (e as Error).message
          );
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to get top price change coins from coin market cap"
          );
        }
      },
    });
  }

  get getFollowingTweetsFunction() {
    return new GameFunction({
      name: "get_following_tweets",
      description:
        "Get tweets from your following users to find some interesting ones to quote with later",
      args: [],
      executable: async (args, logger) => {
        try {
          const lastQuoteId = await cache.getLastQuoteId();

          const res = await this.twitterClient.v2.homeTimeline({
            max_results: 10,
            since_id: lastQuoteId,
            "tweet.fields": ["public_metrics", "author_id"],
          });

          const tweets = res.data.data;

          if (tweets.length === 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              "No new tweets"
            );
          }

          const feedbackMessage =
            "Found tweets:\n" +
            JSON.stringify(
              tweets
                .filter((tweet) => tweet.author_id !== this.user_id)
                .map((tweet) => ({
                  tweetId: tweet.id,
                  content: tweet.text,
                  likes: tweet.public_metrics?.like_count,
                  retweets: tweet.public_metrics?.retweet_count,
                  replyCount: tweet.public_metrics?.reply_count,
                }))
            );

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          console.error("fail to get following tweets", (e as Error).message);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to get following tweets"
          );
        }
      },
    });
  }

  get getMentionMeTweetsFunction() {
    return new GameFunction({
      name: "get_mention_me_tweets",
      description: "Get tweets that mention me",
      args: [],
      executable: async (args, logger) => {
        try {
          const lastReplyId = await cache.getLastReplyId();

          const res = await this.twitterClient.v2.userMentionTimeline(
            this.user_id,
            {
              max_results: 10,
              since_id: lastReplyId,
              "tweet.fields": ["public_metrics"],
            }
          );

          const tweets = res.data.data ?? [];

          if (tweets.length === 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              "No new tweets that mention me"
            );
          }

          const feedbackMessage =
            "Found tweets that mention me:\n" +
            JSON.stringify(
              tweets.map((tweet) => ({
                tweetId: tweet.id,
                content: tweet.text,
                likes: tweet.public_metrics?.like_count,
                retweets: tweet.public_metrics?.retweet_count,
                replyCount: tweet.public_metrics?.reply_count,
              }))
            );

          logger(feedbackMessage);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            feedbackMessage
          );
        } catch (e) {
          console.error(e);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to get mention me tweets"
          );
        }
      },
    });
  }

  // get getMyRecentTweetsFunction() {
  //   return new GameFunction({
  //     name: "get_my_recent_tweets",
  //     description: "Get my recent tweets",
  //     args: [],
  //     executable: async (args, logger) => {
  //       try {
  //         const tweets = await this.twitterClient.v2.userTimeline(
  //           this.user_id,
  //           {
  //             max_results: 10,
  //             "tweet.fields": ["public_metrics"],
  //           }
  //         );

  //         const feedbackMessage =
  //           "Found my recent tweets:\n" +
  //           JSON.stringify(
  //             tweets.data.data.map((tweet) => ({
  //               tweetId: tweet.id,
  //               content: tweet.text,
  //               likes: tweet.public_metrics?.like_count,
  //               retweets: tweet.public_metrics?.retweet_count,
  //               replyCount: tweet.public_metrics?.reply_count,
  //             }))
  //           );

  //         logger(feedbackMessage);

  //         return new ExecutableGameFunctionResponse(
  //           ExecutableGameFunctionStatus.Done,
  //           feedbackMessage
  //         );
  //       } catch (e) {
  //         return new ExecutableGameFunctionResponse(
  //           ExecutableGameFunctionStatus.Failed,
  //           "Failed to get my recent tweets"
  //         );
  //       }
  //     },
  //   });
  // }

  get replyTweetFunction() {
    return new GameFunction({
      name: "reply_tweet",
      description: "Reply to a tweet where your think is the most interesting",
      args: [
        { name: "tweet_id", description: "The tweet id" },
        { name: "reply", description: "The reply content" },
        {
          name: "reply_reasoning",
          description: "The reasoning behind the reply",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet_id || !args.reply) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet id and reply content are required"
            );
          }

          logger(`Replying [${args.tweet_id}]: ${args.reply}`);

          await this.twitterClient.v2.reply(args.reply, args.tweet_id);

          await cache.setLastReplyId(args.tweet_id);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Replied to tweet"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to reply to tweet"
          );
        }
      },
    });
  }

  get postTweetFunction() {
    return new GameFunction({
      name: "post_tweet",
      description: "Post a tweet",
      args: [
        { name: "tweet", description: "The tweet content" },
        {
          name: "tweet_reasoning",
          description: "The reasoning behind the tweet",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet content is required"
            );
          }

          logger(`Posting tweet: ${args.tweet}`);

          await this.twitterClient.v2.tweet(args.tweet);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Tweet posted"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to post tweet"
          );
        }
      },
    });
  }

  get likeTweetFunction() {
    return new GameFunction({
      name: "like_tweet",
      description:
        "Like a tweet. Choose this when you want to support a tweet quickly, without needing to comment.",
      args: [{ name: "tweet_id", description: "The tweet id" }] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet_id) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet id is required"
            );
          }

          logger(`Liking tweet id: ${args.tweet_id}`);

          await this.twitterClient.v2.like(this.user_id, args.tweet_id);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Tweet liked"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to like tweet"
          );
        }
      },
    });
  }

  get quoteTweetFunction() {
    return new GameFunction({
      name: "quote_tweet",
      description:
        "Share someone else’s tweet while adding your own commentary. Use this when you want to provide your opinion, analysis, or humor on an existing tweet while still promoting the original content. This will help with your social presence.",
      args: [
        { name: "tweet_id", description: "The tweet id" },
        { name: "quote", description: "The quote content" },
      ] as const,
      executable: async (args, logger) => {
        try {
          if (!args.tweet_id || !args.quote) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Tweet id and quote content are required"
            );
          }

          logger(`Quoting [${args.tweet_id}]: ${args.quote}`);

          await this.twitterClient.v2.quote(args.quote, args.tweet_id);

          await cache.setLastQuoteId(args.tweet_id);

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "Tweet quoted"
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Failed to quote tweet"
          );
        }
      },
    });
  }
}

export default TwitterPlugin;
