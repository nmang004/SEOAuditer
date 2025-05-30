import { redisClient } from '../index';

export const cache = {
  async get<T = any>(key: string): Promise<T | null> {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number) {
    if (!redisClient) return;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string) {
    if (!redisClient) return;
    await redisClient.del(key);
  },
}; 