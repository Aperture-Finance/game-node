import { configs } from "../../config";
import { Redis } from "@upstash/redis";

// export const redis = new Redis({
//   url: configs.redis.url,
//   token: configs.redis.token,
// });

class Cache {
  private redis: Redis;
  private quoteKey: string;
  private replyKey: string;

  constructor() {
    this.redis = new Redis({
      url: configs.redis.url,
      token: configs.redis.token,
    });
    this.quoteKey = `${configs.redisPrefix}last_quote_id`;
    this.replyKey = `${configs.redisPrefix}last_reply_id`;
  }

  public async getLastQuoteId() {
    return (await this.redis.get<string>(this.quoteKey)) || "0";
  }

  public async setLastQuoteId(id: string) {
    return this.redis
      .set(this.quoteKey, id)
      .then(() => {
        console.log("last quote id set", id);
      })
      .catch((err) => {
        console.error(err);
      });
  }
  public async getLastReplyId() {
    console.log("getting last reply id", this.replyKey);
    return (await this.redis.get<string>(this.replyKey)) || "0";
  }

  public async setLastReplyId(id: string) {
    return this.redis
      .set(this.replyKey, id)
      .then(() => {
        console.log("last reply id set", id);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}

export const cache = new Cache();
