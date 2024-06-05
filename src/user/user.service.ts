import { Injectable, Logger, Inject, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { LoginUserDto } from './dto/login-user.dto';
import { md5 } from 'src/utils'
import { User } from './entities/user.entity'
import { Role } from './entities/role.entity'
import { Permission } from './entities/permission.entity'
import { RegisterUserDto } from './dto/register-user.dto'
import { RedisService } from 'src/redis/redis.service'
import { LoginUserVo } from './vo/login-user.vo'
import { UserDetailVo } from './vo/user-info.vo'
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserInfoDto } from './dto/udpate-userInfo.dto';

@Injectable()
export class UserService {
    private logger = new Logger();

    @InjectRepository(User)
    private userRepository: Repository<User>

    @InjectRepository(Role)
    private roleRepository: Repository<Role>

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>

    @Inject(RedisService)
    private redisService: RedisService;

    async register(user: RegisterUserDto) {

        const captcha = await this.redisService.get(`captcha_${user.email}`)

        if (!captcha) {
            throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST)
        }

        if (user.captcha !== captcha) {
            throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST)
        }

        const foundUser = await this.userRepository.findOneBy({
            username: user.username
        })

        if (foundUser) {
            throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
        }

        const newUser = new User()
        newUser.username = user.username
        newUser.email = user.email
        newUser.password = md5(user.password)
        newUser.nickName = user.nickName

        try {
            await this.userRepository.save(newUser)
            return '注册成功'
        } catch (e) {
            this.logger.error(e, UserService)
            return '注册失败'
        }

    }

    async login(loginUserDto: LoginUserDto, isAdmin: boolean) {

        const user = await this.userRepository.findOne({
            where: { username: loginUserDto.username },
            relations: ['roles', 'roles.permissions']
        })

        if (!user) {
            throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
        }

        if (user.password !== md5(loginUserDto.password)) {
            throw new HttpException('密码不正确', HttpStatus.BAD_REQUEST);
        }

        const loginUserVo = new LoginUserVo()

        loginUserVo.userInfo = {
            id: user.id,
            username: user.username,
            nickName: user.nickName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            headPic: user.headPic,
            createTime: user.createTime.getTime(),
            isFrozen: user.isFrozen,
            isAdmin: user.isAdmin,
            roles: user.roles.map((item) => item.name),
            permissions: user.roles.reduce((arr, item) => {
                item.permissions.forEach(permission => {
                    if (arr.indexOf(permission) === -1) {
                        arr.push(permission);
                    }
                })
                return arr;
            }, [])
        }

        return loginUserVo

    }

    async findUserById(userId: number, isAdmin: boolean) {

        const user = await this.userRepository.findOne({
            where: {
                id: userId,
                isAdmin
            },
            relations: ['roles', 'roles.permissions']
        })

        return {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            email: user.email,
            roles: user.roles.map(item => item.name),
            permissions: user.roles.reduce((arr, item) => {
                item.permissions.forEach(permission => {
                    if (arr.indexOf(permission) === -1) {
                        arr.push(permission);
                    }
                })
                return arr;
            }, [])
        }

    }

    async findUserDetailById(userId: number) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });
        const vo = new UserDetailVo()
        vo.id = user.id;
        vo.email = user.email;
        vo.username = user.username;
        vo.headPic = user.headPic;
        vo.phoneNumber = user.phoneNumber;
        vo.nickName = user.nickName;
        vo.createTime = user.createTime;
        vo.isFrozen = user.isFrozen;
        return vo;
    }

    async updatePassword(userId: number, passwordDto: UpdateUserPasswordDto) {

        const captcha = await this.redisService.get(`update_password_captcha_${passwordDto.email}`)
        if (!captcha) {
            throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST)
        }

        if (captcha !== passwordDto.captcha) {
            throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST)
        }
        //验证码使用过就无效
        await this.redisService.set(`update_password_captcha_${passwordDto.email}`, null, -1)

        const foundUser = await this.userRepository.findOne({
            where: {
                email: passwordDto.email
            }
        })
        //邮箱验证在发送验证码时就完成
        // if (!foundUser) {
        //     throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
        // }

        try {
            foundUser.password = md5(passwordDto.password)
            await this.userRepository.save(foundUser)
            return '修改成功'
        } catch (e) {
            this.logger.error(e, UserService)
            throw new HttpException('修改失败', HttpStatus.BAD_REQUEST)
        }

    }
    async updateUserInfo(userId: number, updateUserInfoDto: UpdateUserInfoDto) {

        const captcha = await this.redisService.get(`update_user_captcha_info${updateUserInfoDto.email}`)
        if (!captcha) {
            throw new HttpException('无效验证码', HttpStatus.BAD_GATEWAY)
        }
        if (captcha !== updateUserInfoDto.captcha) {
            throw new HttpException('验证码错误', HttpStatus.BAD_GATEWAY)
        }

        const userInfo = await this.userRepository.findOne({
            where: {
                id: userId
            }
        })

        if (updateUserInfoDto.headPic) {
            userInfo.headPic = updateUserInfoDto.headPic
        }

        if (updateUserInfoDto.nickName) {
            userInfo.headPic = updateUserInfoDto.nickName
        }

        try {
            await this.userRepository.save(userInfo)
            return 'success'
        } catch (e) {
            this.logger.error(e, UserService)
            throw new HttpException('修改失败', HttpStatus.BAD_REQUEST)
        }

    }
    async freezeUserById(userId: number) {
        const foundUser = await this.userRepository.findOneBy({ id: userId })
        if (!foundUser) { throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST) }
        foundUser.isFrozen = true

        try {
            await this.userRepository.save(foundUser)
            return '操作成功'
        } catch (e) {
            this.logger.error(e, UserService)
            throw new HttpException('操作失败', HttpStatus.BAD_REQUEST)
        }

    }
    async findUsersByPage(
        pageNo: number,
        pageSize: number,
        userName: string,
        nickName: string,
        email: string
    ) {
        const skipCount = (pageNo - 1) * pageSize;
        //模糊查询
        const condition: Record<string, any> = {};
        if (userName) condition.username = Like(`%${userName}%`);
        if (nickName) condition.nickName = Like(`%${nickName}%`);
        if (email) condition.email = Like(`%${email}%`);

        const [users, totalCount] = await this.userRepository.findAndCount({
            select: ['id', 'username', 'nickName', 'email', 'phoneNumber', 'isFrozen', 'headPic', 'createTime'],
            skip: skipCount,    //偏移量
            take: pageSize,   //条数
            where: condition
        })
        return {
            users,
            totalCount
        }
    }
    //初始化数据
    async initData() {
        const user1 = new User();
        user1.username = "zhangsan";
        user1.password = md5("111111");
        user1.email = "xxx@xx.com";
        user1.isAdmin = true;
        user1.nickName = '张三';
        user1.phoneNumber = '13233323333';

        const user2 = new User();
        user2.username = 'lisi';
        user2.password = md5("222222");
        user2.email = "yy@yy.com";
        user2.nickName = '李四';

        const role1 = new Role();
        role1.name = '管理员';

        const role2 = new Role();
        role2.name = '普通用户';

        const permission1 = new Permission();
        permission1.code = 'ccc';
        permission1.description = '访问 ccc 接口';

        const permission2 = new Permission();
        permission2.code = 'ddd';
        permission2.description = '访问 ddd 接口';

        user1.roles = [role1];
        user2.roles = [role2];

        role1.permissions = [permission1, permission2];
        role2.permissions = [permission1];

        await this.permissionRepository.save([permission1, permission2]);
        await this.roleRepository.save([role1, role2]);
        await this.userRepository.save([user1, user2]);
    }
}
