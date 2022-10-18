import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private authRepository: Repository<User>,
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
}
