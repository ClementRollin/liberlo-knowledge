import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post()
  search(@Body() dto: SearchDto, @Request() req: { user: User }) {
    return this.searchService.search(dto, req.user);
  }
}
