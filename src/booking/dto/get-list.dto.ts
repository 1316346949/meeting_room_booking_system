import { IsNotEmpty, IsNumber, Validate, IsDateString, IsOptional, IsString } from "class-validator";
import { IsTimestamp } from 'src/utils';

export class GetListTto {

    @IsOptional()//@IsOptional+IsString是username是可选的，可以为空或者string
    @IsString({
        message: "用户名为字符串"
    })
    username: string;

    @IsOptional()
    @IsString({
        message: '房间名为字符串'
    })
    meetingRoomName: string;

    @IsOptional()
    @IsString({
        message: '位置为字符串'
    })
    meetingRoomPosition: string;

    @IsOptional()
    // @IsNumber()
    // @Validate(IsTimestamp)
    @IsDateString()

    bookingTimeRangeStart: number;

    @IsOptional()
    @IsDateString()
    // @IsNumber()
    // @Validate(IsTimestamp)
    bookingTimeRangeEnd: number
}