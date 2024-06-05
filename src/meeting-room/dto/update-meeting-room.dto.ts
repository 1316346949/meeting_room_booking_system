import { PartialType } from '@nestjs/swagger';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';
import { IsNotEmpty } from 'class-validator';
//PartialType是继承CreateMeetingRoomDto类型，添加一个id
export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {

    @IsNotEmpty({
        message: 'id 不能为空'
    })
    id: number;
}