import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from './jwt.payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private authRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto) {
    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(authCredentialsDto.password, salt);
    const user = this.authRepository.create({
      ...authCredentialsDto,
      password: hashedPass,
    });

    try {
      await this.authRepository.save(user);
    } catch (err) {
      //23505 -> duplicate error
      if (err.code === '23505') {
        throw new ConflictException('username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(authCredentialsDto: AuthCredentialsDto) {
    const user = await this.authRepository.findOne({
      where: { username: authCredentialsDto.username },
    });
    if (
      user &&
      (await bcrypt.compare(authCredentialsDto.password, user.password))
    ) {
      const { username } = authCredentialsDto;
      const payload: IJwtPayload = { username };
      const accessToken = this.jwtService.sign(payload);
      return {
        accessToken,
      };
    } else {
      throw new UnauthorizedException('please check your credentials');
    }
  }
}
