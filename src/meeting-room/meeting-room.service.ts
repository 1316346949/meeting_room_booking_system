import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { MeetingRoom } from './entities/meeting-room.entity';



@Injectable()
export class MeetingRoomService {

  @InjectRepository(MeetingRoom)
  private meetingRoomRepository: Repository<MeetingRoom>

  async findAll(
    pageNo: number,
    pageSize: number,
    name?: string,
    capacity?: number,
    location?: string,
    equipment?: string
  ) {

    const condition: Record<string, any> = {}
    if (name) condition.name = Like(`%${name}%`)
    if (capacity) condition.capacity = Like(`%${capacity}%`)
    if (location) condition.location = Like(`%${location}%`)
    if (equipment) condition.equipment = Like(`%${equipment}%`)
    // condition.isBooked = true
    const skip = (pageNo - 1) * pageSize

    const [meetingRooms, totalCount] = await this.meetingRoomRepository.findAndCount({
      skip,
      take: pageSize,
      select: ['capacity', 'equipment', 'id', 'location', 'name', 'description'],
      where: condition
    })
    return {
      meetingRooms,
      totalCount
    }
  }

  async create(createMeetingRoomDto: CreateMeetingRoomDto) {

    const meetingRoom = await this.meetingRoomRepository.findOneBy({ name: createMeetingRoomDto.name })
    if (meetingRoom) throw new BadRequestException('会议室名字已存在')

    await this.meetingRoomRepository.insert(createMeetingRoomDto)
    return 'success'
  }

  async findById(id: number) {
    return await this.meetingRoomRepository.find({
      where: { id },
      select: ['capacity', 'equipment', 'id', 'location', 'name', 'description']
    })
  }

  async update(updateMeetingRoomDto: UpdateMeetingRoomDto) {
    const foundeMetingRoom = await this.meetingRoomRepository.findOneBy({
      id: updateMeetingRoomDto.id
    })
    if (!foundeMetingRoom) {
      throw new BadRequestException('会议室不存在');
    }
    foundeMetingRoom.name = updateMeetingRoomDto.name
    foundeMetingRoom.capacity = updateMeetingRoomDto.capacity
    foundeMetingRoom.description = updateMeetingRoomDto.description
    foundeMetingRoom.location = updateMeetingRoomDto.location
    foundeMetingRoom.equipment = updateMeetingRoomDto.equipment
    try {
      await this.meetingRoomRepository.save(foundeMetingRoom)
    } catch (error) {
      throw new BadRequestException('操作失败')
    }

  }

  async initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    this.meetingRoomRepository.insert([room1, room2, room3])
  }
}
