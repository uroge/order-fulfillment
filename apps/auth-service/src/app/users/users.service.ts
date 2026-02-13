import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createUser(email: string, passwordHash: string, roles = ['USER']) {
    const user = this.usersRepository.create({ email, passwordHash, roles });
    return this.usersRepository.save(user);
  }
}
