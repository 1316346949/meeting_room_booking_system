import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { Permission } from './user/entities/permission.entity';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { LoginGuard } from 'src/utils/guard/login.guard';
import { PermissionGuard } from 'src/utils/guard/permission.guard';
import { MeetingRoomModule } from './meeting-room/meeting-room.module';
import { MeetingRoom } from './meeting-room/entities/meeting-room.entity';
import { BookingModule } from './booking/booking.module';
import { Booking } from './booking/entities/booking.entity';


@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          type: "mysql",
          host: configService.get('mysql_server_host'),
          port: configService.get('mysql_server_port'),
          username: configService.get('mysql_server_username'),
          password: configService.get('mysql_server_password'),
          database: configService.get('mysql_server_database'),
          synchronize: true,
          logging: true,
          entities: [User, Role, Permission, MeetingRoom, Booking],
          poolSize: 10,
          connectorPackage: 'mysql2',
          extra: { authPlugin: 'sha256_password', }
        }
      },
      inject: [ConfigService]
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: configService.get('jwt_access_token_expires_time') // 默认 30 分钟
          }
        }
      },
      inject: [ConfigService]
    }),
    //配置文件
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/.env'
    }),
    UserModule,
    RedisModule,
    EmailModule,
    MeetingRoomModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    //路由拦截，执行顺序依次执行
    {
      provide: APP_GUARD,
      useClass: LoginGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    }
  ],
}) export class AppModule { }