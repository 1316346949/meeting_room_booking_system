import { Controller, Get, Query, Post, Body, Patch, Param, Delete, DefaultValuePipe } from '@nestjs/common';
import { BookingService } from './booking.service';
import { PageNoPipe, PageSizePipe } from '../utils/pipe/custom-pipe.filter';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetListTto } from './dto/get-list.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Post('add')
  @RequireLogin()
  async create(@Body() createBookingDto: CreateBookingDto, @UserInfo('userId') userId: number) {
    return await this.bookingService.create(createBookingDto, userId);
  }

  @Get('list')
  async findAll(
    @Query('pageNo', new DefaultValuePipe(1), new PageNoPipe()) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(1), new PageSizePipe(3)) pageSize: number,
    @Query() queryDto: GetListTto
  ) {
    return await this.bookingService.findAll(
      pageNo,
      pageSize,
      queryDto
    );
  }
  
  @Get("apply/:id")
  async apply(@Param('id') id: number) {
    return this.bookingService.apply(id);
  }

  @Get("reject/:id")
  async reject(@Param('id') id: number) {
    return this.bookingService.reject(id);
  }

  @Get("unbind/:id")
  async unbind(@Param('id') id: number) {
    return this.bookingService.unbind(id);
  }
}
