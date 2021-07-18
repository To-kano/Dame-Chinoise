import { Injectable, Logger } from '@nestjs/common';
import { Game } from 'src/games/entities/game.entity';
import { GamesService } from 'src/games/games.service';
import { State } from 'types/game.interface';

@Injectable()
export class ScoresService {
  constructor(private readonly gamesService: GamesService) {}

  private logger: Logger = new Logger('ScoresService');

  async findScores() {
    this.logger.log('findScores');

    const scores = [];

    await this.gamesService.findAll().then((games: Game[]) => {
      const finishedGames = games.filter(
        ({ state }) => state === State.Finished,
      );
      finishedGames.forEach((game) => {
        game.players.forEach((player) => {
          if (!scores.some((item) => item.player === player.name)) {
            scores.push({
              player: player.name,
              score: { win: 0, loss: 0, longestMove: 0 },
            });
          }
          const score = scores.find(
            (item) => item.player === player.name,
          ).score;
          if (score.longestMove < player.longestMove) {
            score.longestMove = player.longestMove;
          }
          if (game.winner !== player.name) {
            score.loss += 1;
          } else {
            score.win += 1;
          }
        });
      });
    });

    return scores;
  }

  async findPlayerScore(player: string) {
    this.logger.log(`findPlayerScore #${player}`);

    const scores = await this.findScores();
    const playerScore = scores.find((score) => score.player === player);

    if (playerScore === undefined) {
      return [];
    }

    return [playerScore];
  }
}
