import { Global, Module, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        const logger = new Logger('Redis');
        if (!url) {
          logger.warn('REDIS_URL not set — leaderboard cache disabled');
          return null;
        }
        const client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
        client.on('connect', () => logger.log('Connected to Redis'));
        client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor() {}
  async onModuleDestroy() {
    // Clients close when the process exits; no global handle here.
  }
}
