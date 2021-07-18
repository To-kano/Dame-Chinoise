import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ScoresService } from './scores.service';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  findAll() {
    return this.scoresService.findScores();
  }

  @Get(':player')
  findOne(@Param('player') player: string) {
    return this.scoresService.findPlayerScore(player);
  }
}
