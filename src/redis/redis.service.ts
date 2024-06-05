import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {

    @Inject('REDIS_CLIENT')
    private redisClient: RedisClientType;

    async get(key: string) {
        return await this.redisClient.get(key);
    }

    async set(key: string, value: string | number | null, ttl?: number) {
        if (value) {
            await this.redisClient.set(key, value);
        }
        //指定过期时间
        if (ttl) {
            await this.redisClient.expire(key, ttl);
        }
    }
}
