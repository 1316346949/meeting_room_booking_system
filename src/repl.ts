import { repl } from '@nestjs/core';
import { AppModule } from './app.module';
//使用此模块可以在命令行npm run repl 再输入get(MeetingRoomService).initData()调用initData方法
//使用methods(MeetingRoomService)查看MeetingRoomService的所有方法
async function bootstrap() {
    const replServer = await repl(AppModule);
    replServer.setupHistory(".nestjs_repl_history", (err) => {
        if (err) {
            console.error(err);
        }
    });
}
bootstrap();