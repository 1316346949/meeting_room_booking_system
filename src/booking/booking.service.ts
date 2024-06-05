import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { And, Between, EntityManager, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from 'typeorm';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service'
import { GetListTto } from './dto/get-list.dto';

@Injectable()
export class BookingService {

  @InjectRepository(Booking)
  private bookingRepository: Repository<Booking>

  @InjectEntityManager()
  private entityManager: EntityManager;

  async create(createBookingDto: CreateBookingDto, userId: number) {
    const foundMeetingRoom = await this.entityManager.findOneBy(MeetingRoom, {
      id: createBookingDto.meetingRoomId
    })
    if (!foundMeetingRoom) throw new BadRequestException('会议室不存在')
    const foundUser = await this.entityManager.findOneBy(User, {
      id: userId
    })

    const booking = new Booking()
    booking.user = foundUser
    booking.room = foundMeetingRoom
    booking.note = createBookingDto.note
    booking.startTime = new Date(createBookingDto.startTime)
    booking.endTime = new Date(createBookingDto.endTime)

    const res = await this.entityManager.findOneBy(Booking, {
      room: {
        id: foundMeetingRoom.id
      },
      startTime: LessThanOrEqual(booking.startTime),
      endTime: MoreThanOrEqual(booking.endTime)
    })

    if (res) throw new BadRequestException('改时间段已经被预定')

    this.bookingRepository.insert(booking)
    return 'success'


  }

  async findAll(
    pageNo: number,
    pageSize: number,
    queryDto: GetListTto
  ) {

    const skip = (pageNo - 1) * pageSize

    const condition: Record<string, any> = {}
    if (queryDto.username) {
      condition.user = {
        username: Like(`%${queryDto.username}%`)
      }
    }
    if (queryDto.meetingRoomName) {
      condition.room = {
        name: Like(`%${queryDto.meetingRoomName}%`)
      }
    }
    if (queryDto.meetingRoomPosition) {
      if (!condition.room) {
        condition.room = {}
      }
      condition.room.location = Like(`%${queryDto.meetingRoomPosition}%`)
    }

    if (queryDto.bookingTimeRangeStart) {
      if (!queryDto.bookingTimeRangeEnd) {
        queryDto.bookingTimeRangeEnd = queryDto.bookingTimeRangeStart + 60 * 60 * 1000
      }
      condition.startTime = Between(new Date('2024-05-29 21:52:43'), new Date('2024-05-29 22:52:43'))
    }

    return await this.bookingRepository.findAndCount({
      skip,
      take: pageSize,
      where: condition,
      relations: {
        user: true,
        room: true,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        note: true,
        user: {
          id: true,
          nickName: true,
          username: true
        },
        room: {
          id: true,
          name: true,
          capacity: true,
          location: true,
          equipment: true,
          description: true,
        }
      }
    })
  }
  async apply(id: number) {
    await this.entityManager.update(Booking, {
      id
    }, {
      status: '审批通过'
    });
    return 'success'
  }

  async reject(id: number) {
    await this.entityManager.update(Booking, {
      id
    }, {
      status: '审批驳回'
    });
    return 'success'
  }

  async unbind(id: number) {
    await this.entityManager.update(Booking, {
      id
    }, {
      status: '已解除'
    });
    return 'success'
  }

  async initData() {
    const user1 = await this.entityManager.findOneBy(User, {
      id: 1
    });
    const user2 = await this.entityManager.findOneBy(User, {
      id: 2
    });

    const room1 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 3
    });
    const room2 = await await this.entityManager.findOneBy(MeetingRoom, {
      id: 4
    });

    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking1);

    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking2);

    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking3);

    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking4);
  }
}
