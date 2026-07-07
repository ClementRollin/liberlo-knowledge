import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ImportModule } from './import/import.module';
import { ServicesModule } from './services/services.module';
import { ArticlesModule } from './articles/articles.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    ArticlesModule,
    SearchModule,
    AdminModule,
    ConversationsModule,
    ImportModule,
  ],
})
export class AppModule {}
