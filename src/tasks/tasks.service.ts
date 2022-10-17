import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { v4 as uuid } from 'uuid';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  getAllTasks(): Task[] {
    return this.tasks;
  }

  getTasksWithFilters(filterDto: GetTasksFilterDto) {
    const { search, status } = filterDto;

    let tasks = this.getAllTasks();

    if (status) {
      tasks = tasks.filter((task) => task.status === status);
    }

    if (search) {
      tasks = tasks.filter((task) => {
        if (task.description.includes(search) || task.title.includes(search))
          return task;
      });
    }

    return tasks;
  }

  async getTaskById(id: string) {
    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) throw new NotFoundException(`Task with id: "${id}" not found`);

    return task;
  }

  async removeTaskById(id: string) {
    const { affected } = await this.tasksRepository.delete(id);
    if (affected === 0)
      throw new NotFoundException(`Task with id: "${id}" not found`);
  }

  async updateTaskStatus(id: string, status: TaskStatus) {
    const task = await this.getTaskById(id);
    task.status = status;
    await this.tasksRepository.save(task);
    return task;
  }

  async createTask(createTaskDto: CreateTaskDto) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      status: TaskStatus.OPEN,
    });

    await this.tasksRepository.save(task);

    return task;
  }
}
