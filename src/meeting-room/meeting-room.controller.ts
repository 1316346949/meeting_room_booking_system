import { Body, Controller, DefaultValuePipe, Get, Param, Post, Query } from '@nestjs/common';
import { PageNoPipe, PageSizePipe } from '../utils/pipe/custom-pipe.filter';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { MeetingRoomService } from './meeting-room.service';

@Controller('meeting-room')
export class MeetingRoomController {

  constructor(private readonly meetingRoomService: MeetingRoomService) { }

  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), new PageNoPipe()) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(1), new PageSizePipe(3)) pageSize: number,
    @Query('name') name: string,
    @Query('capacity') capacity: number,
    @Query('location') location: string,
    @Query('equipment') equipment: string,
  ) {
    return await this.meetingRoomService.findAll(pageNo, pageSize, name, capacity, location, equipment);
  }
  @Post('create')
  create(@Body() createMeetingRoomDto: CreateMeetingRoomDto) {
    return this.meetingRoomService.create(createMeetingRoomDto);
  }

  @Post('update')
  update(@Body() meetingRoomDto: UpdateMeetingRoomDto) {
    return this.meetingRoomService.update(meetingRoomDto);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.meetingRoomService.findById(+id);
  }

}
