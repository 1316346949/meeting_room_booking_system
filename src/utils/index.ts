import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import * as crypto from 'crypto';


export function md5(str: string) {
    const hash = crypto.createHash('md5');
    hash.update(str)
    return hash.digest('hex')
}

//使用class-validator验证时间戳
@ValidatorConstraint({ name: 'isTimestamp', async: false })
export class IsTimestamp implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const timestamp = parseInt(value, 10);
    return !isNaN(timestamp) && timestamp.toString() === value;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} 必须是合法的时间戳`;
  }
}