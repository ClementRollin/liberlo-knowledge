import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  findByService(@Request() req: { user: User }) {
    return this.articlesService.findByService(req.user.serviceId!);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  create(@Body() dto: CreateArticleDto, @Request() req: { user: User }) {
    return this.articlesService.create(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @Request() req: { user: User },
  ) {
    return this.articlesService.update(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('RESPONSABLE')
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.articlesService.remove(id, req.user);
  }
}
