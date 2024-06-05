import { Body, Controller, Post, ValidationPipe, HttpException, HttpStatus, ParseIntPipe, BadRequestException, DefaultValuePipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { Get, Inject, Query } from '@nestjs/common/decorators';
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger/dist';
import { UserService } from './user.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RequirePermission, RequireLogin, UserInfo } from '../custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserInfoDto } from './dto/udpate-userInfo.dto';
import { PageNoPipe, PageSizePipe } from '../utils/pipe/custom-pipe.filter';

@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService

  @Inject(UserService)
  private userService: UserService

  @Inject(ConfigService)
  private configService: ConfigService

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    console.log(registerUser);
    return this.userService.register(registerUser)
  }

  //获取验证码
  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xxx@xx.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @Get('register-captcha')
  async captcha(@Query('address') address: RegisterUserDto) {

    const captcha = await this.redisService.get(`captcha_${address}`)

    if (captcha) {
      throw new HttpException('请勿重复获取验证码', HttpStatus.BAD_REQUEST)
    }

    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`
    });
    return '发送成功';

  }

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false)

    vo.accessToken = this.jwtService.sign({
      userId: vo.userInfo.id,
      username: vo.userInfo.username,
      roles: vo.userInfo.roles,
      permissions: vo.userInfo.permissions
    }, {
      expiresIn: this.configService.get('jwt_access_token_expires_time')
    })

    vo.refreshToken = this.jwtService.sign({
      userId: vo.userInfo.id,
    }, {
      expiresIn: this.configService.get('jwt_refresh_token_expres_time')
    })
    return vo
  }

  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    return await this.userService.login(loginUser, true);
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {

    try {
      //解析前端传递的token，找出userId
      const data = this.jwtService.verify(refreshToken)
      //通过userID从数据库找出对应用户
      const user = await this.userService.findUserById(data.userId, false)

      const access_token = this.jwtService.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      }, {
        expiresIn: this.configService.get('jwt_access_token_expires_time')
      });

      const refresh_token = this.jwtService.sign({
        userId: user.id
      }, {
        expiresIn: this.configService.get('jwt_refresh_token_expres_time')
      });

      return {
        access_token,
        refresh_token
      }

    } catch (error) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId, true);

      const access_token = this.jwtService.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      }, {
        expiresIn: this.configService.get('jwt_access_token_expires_time')
      });

      const refresh_token = this.jwtService.sign({
        userId: user.id
      }, {
        expiresIn: this.configService.get('jwt_refresh_token_expres_time')
      });

      return {
        access_token,
        refresh_token
      }
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }
  //获取用户信息
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    return await this.userService.findUserDetailById(userId);
  }
  //修改密码
  @Post(['update_password', 'admin/update_password'])
  // @RequireLogin()
  async updatePassword(@UserInfo('userId') userId: number, @Body() passwordDto: UpdateUserPasswordDto) {
    return await this.userService.updatePassword(userId, passwordDto)
  }
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`update_password_captcha_${address}`, code, 10 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`
    });
    return '发送成功';
  }
  //修改用户信息
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(@UserInfo('userId') userId: number, @Body() updateUserInfoDto: UpdateUserInfoDto) {
    return await this.userService.updateUserInfo(userId, updateUserInfoDto);
  }
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), new PageNoPipe()) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(1), new PageSizePipe(3)) pageSize: number,
    @Query('userName') userName: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string
  ) {
    return await this.userService.findUsersByPage(pageNo, pageSize, userName, nickName, email);
  }
  //冻结用户
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    return await this.userService.freezeUserById(userId);
  }
  // 测试权限
  @Get('aaa')
  @RequireLogin()
  @RequirePermission('ddd')
  async aaa() {
    return 'aaa'
  }

  @Get('bbb')
  async bbb() {
    return 'bbb'
  }

  @Get("init-data")
  async initData() {
    await this.userService.initData();
    return 'done';
  }
}
