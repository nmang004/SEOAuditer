declare module 'rate-limiter-flexible' {
  export class RateLimiterMemory {
    constructor(options: {
      points: number;
      duration: number;
    });

    consume(key: string, points?: number): Promise<void>;
    get(key: string): Promise<{
      msBeforeNext: number;
      remainingPoints: number;
      consumedPoints: number;
      isFirstInDuration: boolean;
    }>;
  }

  export class RateLimiterRedis {
    constructor(options: {
      storeClient: any;
      points: number;
      duration: number;
      keyPrefix?: string;
    });

    consume(key: string, points?: number): Promise<void>;
    get(key: string): Promise<{
      msBeforeNext: number;
      remainingPoints: number;
      consumedPoints: number;
      isFirstInDuration: boolean;
    }>;
  }
}
