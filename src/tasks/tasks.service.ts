import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getTasks(filterDto: GetTasksFilterDto, user: User) {
    const { status, search } = filterDto;
    const query = this.tasksRepository.createQueryBuilder('task');
    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const tasks = await query.getMany();

    return tasks;
  }

  async getTaskById(id: string, user: User) {
    const task = await this.tasksRepository.findOne({ where: { id, user } });

    if (!task) throw new NotFoundException(`Task with id: "${id}" not found`);

    return task;
  }

  async removeTaskById(id: string, user: User) {
    const { affected } = await this.tasksRepository.delete({ id, user });
    if (affected === 0)
      throw new NotFoundException(`Task with id: "${id}" not found`);
  }

  async updateTaskStatus(id: string, status: TaskStatus, user: User) {
    const task = await this.getTaskById(id, user);
    task.status = status;
    await this.tasksRepository.save(task);
    return task;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      status: TaskStatus.OPEN,
      user,
    });

    await this.tasksRepository.save(task);

    return task;
  }
}
