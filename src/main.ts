import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { FormatResponseInterceptor } from './utils/interceptor/format-response.interceptor';
import { InvokeRecordInterceptor } from './utils/interceptor/invoke-record.interceptor';
import { CustomExceptionFilter } from './utils/exception/custom-exception.filter';
import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger/dist';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(new FormatResponseInterceptor())
  app.useGlobalInterceptors(new InvokeRecordInterceptor())
  app.useGlobalFilters(new CustomExceptionFilter())

  const config = new DocumentBuilder()
    .setTitle('会议室预订系统')
    .setDescription('api 接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  //api-doc是接口url
  SwaggerModule.setup('api-doc', app, document);

  await app.listen(configService.get('nest_server_port'));
}
bootstrap();
