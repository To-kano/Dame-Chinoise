import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game } from './entities/game.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {}

  async create(gameData: CreateGameDto) {
    const newGame = this.gamesRepository.create(gameData);
    await this.gamesRepository.save(newGame);
    return newGame;
  }

  findAll() {
    return this.gamesRepository.find();
  }

  async findOne(id: number) {
    const game = await this.gamesRepository.findOne({ id });
    if (game) {
      return game;
    }
    throw new HttpException(
      `User with id #${id} does not exist`,
      HttpStatus.NOT_FOUND,
    );
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return this.gamesRepository.update(id, updateGameDto);
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }
}
