import { Controller, Get, UseGuards } from '@nestjs/common';
import { ArticlesService } from '../articles/articles.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtGuard, RolesGuard)
@Roles('DIRECTION')
@Controller('admin')
export class AdminController {
  constructor(private articlesService: ArticlesService) {}

  @Get('articles')
  findAll() {
    return this.articlesService.findAll();
  }
}
