import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ServicesService } from './services.service'
import { JwtGuard } from '../auth/guards/jwt.guard'

@UseGuards(JwtGuard)
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAll()
  }

  @Get(':slug/articles')
  findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlugWithArticles(slug)
  }
}
