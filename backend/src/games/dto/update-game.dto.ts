import { PartialType } from '@nestjs/mapped-types';
import { Board, Colors, History, Player, State } from 'types/game.interface';
import { CreateGameDto } from './create-game.dto';

export class UpdateGameDto extends PartialType(CreateGameDto) {
  board?: Board;
  history?: History;
  nextColorToPlay?: Colors;
  players?: Array<Player>;
  state?: State;
  winner?: string;
}
