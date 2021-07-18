import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsGateway } from './events.gateway';
import { GamesModule } from 'src/games/games.module';

@Module({
  imports: [GamesModule],
  providers: [EventsGateway, EventsService],
})
export class EventsModule {}
