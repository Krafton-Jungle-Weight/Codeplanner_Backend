import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VerifyEmailDto } from 'src/email/dto/verify-email.dto';
import { EmailService } from 'src/email/email.service';
import * as uuid from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    private emailService: EmailService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  PASSWORD_SALT = 10;
  async createUser(input: CreateUserDto) {
    const { email, display_name, password, password_again, auth_provider } =
      input;
    await this.checkUserExists(email);

    if (password !== password_again) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    }
    const hashedPassword = await bcrypt.hash(
      input.password,
      this.PASSWORD_SALT,
    );
    const signupVerifyToken = uuid.v1();

    await this.saveUser(
      display_name,
      email,
      hashedPassword,
      auth_provider || 'local',
    );
    await this.sendMemberJoinEmail(email, signupVerifyToken);
  }

  private async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ email });
    return Boolean(user);
  }

  private async saveUser(
    display_name: string,
    email: string,
    hashedPassword: string,
    auth_provider: string,
  ) {
    const result = await this.userRepository.save({
      email,
      display_name,
      password_hash: hashedPassword,
      is_verified: false,
      auth_provider,
    });
    return result;
  }

  private async sendMemberJoinEmail(email: string, signupVerifyToken: string) {
    await this.emailService.sendMemberJoinVerification(
      email,
      signupVerifyToken,
    );
  }

  async verifyEmail(email: string, verifyToken: string) {
    console.log('verifyEmail : ', email);
    console.log('Token', verifyToken);
    return;
  }
}
