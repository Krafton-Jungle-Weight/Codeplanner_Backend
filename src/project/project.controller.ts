import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { format } from 'date-fns';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getAll(): Promise<any[]> {
    const projects = await this.projectService.findAll();
    return projects.map((project) => ({
      ...project,
      project_deadline: format(project.project_deadline, 'yyyy년 MM월 dd일'), // ⬅️ 날짜 가공
    }));
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const project = await this.projectService.findOne(id);
    return {
      ...project,
      project_deadline: format(project.project_deadline, 'yyyy년 MM월 dd일'),
    };
  }

  @Post()
  createProject(@Body() body: Partial<Project>): Promise<Project> {
    return this.projectService.create(body);
  }

  @Put(':id')
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Project>
  ): Promise<Project> {
    return this.projectService.update(id, body);
  }

  @Delete(':id')
  deleteProject(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projectService.remove(id);
  }
}

