import { Module } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { GamesModule } from 'src/games/games.module';

@Module({
  controllers: [ScoresController],
  imports: [GamesModule],
  providers: [ScoresService],
})
export class ScoresModule {}
