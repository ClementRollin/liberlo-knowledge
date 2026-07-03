import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { ServicesModule } from './services/services.module'
import { ArticlesModule } from './articles/articles.module'
import { SearchModule } from './search/search.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ServicesModule,
    ArticlesModule,
    SearchModule,
    AdminModule,
  ],
})
export class AppModule {}
