import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

//pageNo大于0的整数
@Injectable()
export class PageNoPipe implements PipeTransform {
  transform(value: any) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue <= 0 || !Number.isInteger(parsedValue)) {
      throw new BadRequestException('pageNo必须为大于0的整数');
    }
    return parsedValue;
  }
}

//pageNo大于0的整数
@Injectable()
export class PageSizePipe implements PipeTransform {
  constructor(private readonly maxValue: number) { }

  transform(value: any) {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue <= 0 || parsedValue >= this.maxValue || !Number.isInteger(parsedValue)) {
      throw new BadRequestException(`pageSize必须为大于0小于${this.maxValue}的整数`);
    }
    return parsedValue;
  }
}

//参数是否是时间戳
@Injectable()
export class IsTimestampPipe implements PipeTransform {
  constructor(private readonly parsedTimestamp: string) { }

  transform(value: any) {
    const parsedTimestamp = parseInt(value, 10); // 将字符串转换为数字
    if (!isNaN(parsedTimestamp)) {
      const isTimestamp = new Date(parsedTimestamp)
      if (!isNaN(isTimestamp.getTime())) {
        return { date: isTimestamp, timestamp: parsedTimestamp };
      }
    }
    throw new BadRequestException(`参数${this.parsedTimestamp}必须是时间戳`);
  }
}