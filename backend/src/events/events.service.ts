import { HttpException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Game } from 'src/games/entities/game.entity';
import { GamesService } from 'src/games/games.service';
import {
  Board,
  Cell,
  Colors,
  Coordinates,
  Directions,
  Move,
  Player,
  State,
} from 'types/game.interface';
import { Logger } from '@nestjs/common';

@Injectable()
export class EventsService {
  constructor(private readonly gamesService: GamesService) {}

  private logger: Logger = new Logger('EventsService');

  private playerIsInGame = (game: Game, player: Player) =>
    game.players.some(({ name }) => name === player.name);

  private colorIsInGame = (game: Game, player: Player) =>
    game.players.some(({ color }) => color === player.color);

  async join(
    server: Server,
    client: Socket,
    message: { sender: string; room: string; color: string },
  ) {
    this.logger.log(`Join #${JSON.stringify(message)}`);

    try {
      const game = await this.gamesService.findOne(+message.room);
      const color: Colors = Colors[message.color as keyof typeof Colors];

      if (game.state === State.Finished) {
        return {
          status: 'failure',
          message: 'Game has already ended',
        };
      }

      const dummy = { name: message.sender, color: Colors.none };

      if (this.playerIsInGame(game, dummy)) {
        const player = game.players.find((item) => item.name === dummy.name);

        client.join(message.room);

        return {
          status: 'success',
          message: `Player #${message.sender} joined back game #${message.room} with the color #${player.color}`,
          game: game,
        };
      }

      if (game.players.length >= 6) {
        return {
          status: 'failure',
          message: 'Game is already full',
        };
      }

      if (game.state === State.OnGoing) {
        return {
          status: 'failure',
          message: 'Game is on going',
        };
      }

      const newPlayer = { name: message.sender, color: color };

      if (newPlayer.color === Colors.none) {
        return {
          status: 'failure',
          message: `Color cannot be Colors.none`,
        };
      }

      if (this.colorIsInGame(game, newPlayer)) {
        return {
          status: 'failure',
          message: `Color #${message.color} is already taken in game #${message.room}`,
        };
      }

      game.players.push({
        name: message.sender,
        color: color,
        ready: false,
        longestMove: 0,
      });
      await this.gamesService.update(game.id, { players: game.players });

      client.join(message.room);
      client.to(message.room).emit('join', { message: message, game: game });

      return {
        status: 'success',
        message: `Player #${message.sender} joined game #${message.room} with the color #${message.color}`,
        game: game,
      };
    } catch (error) {
      return { status: 'failure', message: (error as HttpException).message };
    }
  }

  async leave(
    server: Server,
    client: Socket,
    message: { sender: string; room: string },
  ) {
    this.logger.log(`Leave #${JSON.stringify(message)}`);

    try {
      const game = await this.gamesService.findOne(+message.room);

      if (game.state === State.OnGoing) {
        return {
          status: 'failure',
          message: 'Game is on going',
        };
      }

      if (game.state === State.Finished) {
        return {
          status: 'failure',
          message: 'Game has already ended',
        };
      }

      const dummy = { name: message.sender, color: Colors.none };

      if (!this.playerIsInGame(game, dummy)) {
        return {
          status: 'failure',
          message: `Player #${message.sender} is not in game #${message.room}`,
        };
      }

      game.players = game.players.filter(
        (player) => player.name !== dummy.name,
      );
      await this.gamesService.update(game.id, { players: game.players });

      client.to(message.room).emit('leave', { message: message, game: game });
      client.leave(message.room);

      // If everyone else is ready and the game had yet to start, start the game
      if (
        game.state === State.Lobby &&
        !game.players.some(({ ready }) => ready === false) &&
        game.players.length > 1
      ) {
        this.start(server, game, message.room);
      }

      return {
        status: 'success',
        message: `Player #${message.sender} left game #${message.room}`,
        game: game,
      };
    } catch (error) {
      return { status: 'failure', message: (error as HttpException).message };
    }
  }

  async ready(
    server: Server,
    client: Socket,
    message: { sender: string; room: string; ready: boolean },
  ) {
    this.logger.log(`Ready #${JSON.stringify(message)}`);

    try {
      const game = await this.gamesService.findOne(+message.room);

      if (game.state !== State.Lobby) {
        return {
          status: 'failure',
          message: `Game lobby is already closed`,
        };
      }

      const dummy = { name: message.sender, color: Colors.none };

      if (!this.playerIsInGame(game, dummy)) {
        return {
          status: 'failure',
          message: `Player #${message.sender} is not in game #${message.room}`,
        };
      }

      // No undefined as player has already been verified to be in this game
      game.players.find((player) => player.name === dummy.name).ready =
        message.ready;
      await this.gamesService.update(game.id, { players: game.players });

      client.to(message.room).emit('ready', { message: message, game: game });

      // If everyone is ready and the game had yet to start, start the game
      if (
        !game.players.some(({ ready }) => ready === false) &&
        game.players.length > 1
      ) {
        this.start(server, game, message.room);
      }

      return {
        status: 'success',
        message: `Player #${message.sender} is ready`,
        game: game,
      };
    } catch (error) {
      return { status: 'failure', message: (error as HttpException).message };
    }
  }

  private getNthOfSum(sum: number) {
    let count = 0;
    let nth = 0;

    while (count < sum) {
      nth += 1;
      count += nth;
    }

    if (nth < 4) nth = 4;
    if (nth > 7) nth = 7;

    return nth;
  }

  private getBoard(nth: number) {
    const board: Board = [];

    let index = 0;

    for (let i = 0; i < nth; i++) {
      board.push([]);
      for (let j = 0; j <= i; j++) {
        board[index].push({
          color: Colors.none,
          coordinate: { x: j, y: i },
        });
      }
      index++;
    }

    for (let i = 0; i < nth + 1; i++) {
      board.push([]);
      for (let j = 0; j < nth * 3 + 1 - i; j++) {
        board[index].push({
          color: Colors.none,
          coordinate: { x: j, y: i + nth },
        });
      }
      index++;
    }
    for (let i = 0; i < nth; i++) {
      board.push([]);
      for (let j = 0; j < nth * 2 + 2 + i; j++) {
        board[index].push({
          color: Colors.none,
          coordinate: { x: j, y: i + nth * 2 + 1 },
        });
      }
      index++;
    }

    for (let i = nth; i > 0; i--) {
      board.push([]);
      for (let j = 0; j < i; j++) {
        board[index].push({
          color: Colors.none,
          coordinate: { x: j, y: nth * 4 - i + 1 },
        });
      }
      index++;
    }

    return board;
  }

  private getColorsArea(board: Board, nth: number) {
    const colorsArea = new Map([
      [Colors.red, []],
      [Colors.orange, []],
      [Colors.yellow, []],
      [Colors.green, []],
      [Colors.blue, []],
      [Colors.purple, []],
    ]);

    // Colors.red
    for (let i = 0; i < nth; i++) {
      for (let j = 0; j <= i; j++) {
        colorsArea.get(Colors.red).push({ x: j, y: i });
      }
    }

    // Colors.orange
    for (let i = 0; i < nth; i++) {
      for (
        let j = board[nth + i].length - nth + i;
        j < board[nth + i].length;
        j++
      ) {
        colorsArea.get(Colors.orange).push({ x: j, y: i + nth });
      }
    }

    // Colors.yellow
    for (let i = 0; i < nth; i++) {
      for (
        let j = board[nth * 2 + 1 + i].length - i - 1;
        j < board[nth * 2 + 1 + i].length;
        j++
      ) {
        colorsArea.get(Colors.yellow).push({ x: j, y: i + nth * 2 + 1 });
      }
    }

    // Colors.green
    for (let i = nth; i > 0; i--) {
      for (let j = 0; j < i; j++) {
        colorsArea.get(Colors.green).push({ x: j, y: nth * 4 - i + 1 });
      }
    }

    // Colors.blue
    for (let i = 0; i < nth; i++) {
      for (let j = 0; j <= i; j++) {
        colorsArea.get(Colors.blue).push({ x: j, y: i + nth * 2 + 1 });
      }
    }

    // Colors.purple
    for (let i = nth; i > 0; i--) {
      for (let j = 0; j < i; j++) {
        colorsArea.get(Colors.purple).push({ x: j, y: nth * 2 - i });
      }
    }

    return colorsArea;
  }

  private fillColorsArea(game: Game, board: Board, colorsArea) {
    // Fill red
    if (game.players.some(({ color }) => color === Colors.red)) {
      for (const coordinates of colorsArea.get(Colors.red)) {
        board[coordinates.y][coordinates.x].color = Colors.red;
      }
    }
    // Fill orange
    if (game.players.some(({ color }) => color === Colors.orange)) {
      for (const coordinates of colorsArea.get(Colors.orange)) {
        board[coordinates.y][coordinates.x].color = Colors.orange;
      }
    }
    // Fill yellow
    if (game.players.some(({ color }) => color === Colors.yellow)) {
      for (const coordinates of colorsArea.get(Colors.yellow)) {
        board[coordinates.y][coordinates.x].color = Colors.yellow;
      }
    }
    // Fill green
    if (game.players.some(({ color }) => color === Colors.green)) {
      for (const coordinates of colorsArea.get(Colors.green)) {
        board[coordinates.y][coordinates.x].color = Colors.green;
      }
    }
    // Fill blue
    if (game.players.some(({ color }) => color === Colors.blue)) {
      for (const coordinates of colorsArea.get(Colors.blue)) {
        board[coordinates.y][coordinates.x].color = Colors.blue;
      }
    }
    // Fill purple
    if (game.players.some(({ color }) => color === Colors.purple)) {
      for (const coordinates of colorsArea.get(Colors.purple)) {
        board[coordinates.y][coordinates.x].color = Colors.purple;
      }
    }
  }

  private getNextColorToPlay(game: Game) {
    let nextColorToPlay: Colors;

    const colorsInGame: Colors[] = [];

    for (const player of game.players) {
      colorsInGame.push(player.color);
    }

    for (
      nextColorToPlay = game.nextColorToPlay + 1;
      !colorsInGame.some((color) => color === nextColorToPlay);
      nextColorToPlay++
    ) {
      if (nextColorToPlay > Colors.purple) {
        nextColorToPlay = Colors.none;
      }
    }

    return nextColorToPlay;
  }

  async start(server: Server, game: Game, room: string) {
    this.logger.log(`Start room #${room}`);

    const nth = this.getNthOfSum(game.pieces);
    const board = this.getBoard(nth);
    const colorsArea = this.getColorsArea(board, nth);

    this.fillColorsArea(game, board, colorsArea);
    game.board = board;
    game.state = State.OnGoing;
    game.nextColorToPlay = this.getNextColorToPlay(game);

    await this.gamesService.update(game.id, {
      board: game.board,
      state: game.state,
      nextColorToPlay: game.nextColorToPlay,
    });

    server.to(room).emit('start', {
      message: `Game #${game.id} has started`,
      game: game,
    });
  }

  private winningColorMap = new Map([
    [Colors.red, Colors.green],
    [Colors.orange, Colors.blue],
    [Colors.yellow, Colors.purple],
    [Colors.green, Colors.red],
    [Colors.blue, Colors.orange],
    [Colors.purple, Colors.yellow],
  ]);

  private hasPlayerWon(game: Game, player: Player) {
    const nth = this.getNthOfSum(game.pieces);
    const colorsArea = this.getColorsArea(game.board, nth);

    const colorToCheck = this.winningColorMap.get(player.color);
    const AreaToCheck = colorsArea.get(colorToCheck);

    for (const coord of AreaToCheck) {
      if (game.board[coord.y][coord.x].color !== player.color) {
        return false;
      }
    }
    return true;
  }

  private getNeightboors(board: Board, cell: Cell) {
    const neightboors = new Object();

    neightboors[Directions.BottomLeft] = undefined;
    neightboors[Directions.BottomRight] = undefined;
    neightboors[Directions.Left] = undefined;
    neightboors[Directions.Right] = undefined;
    neightboors[Directions.TopLeft] = undefined;
    neightboors[Directions.TopRight] = undefined;

    // Left
    if (cell.coordinate.x > 0) {
      // --> Left
      neightboors[Directions.Left] =
        board[cell.coordinate.y][cell.coordinate.x - 1];
    }

    // Right
    if (cell.coordinate.x < board[cell.coordinate.y].length - 1) {
      // --> Right
      neightboors[Directions.Right] =
        board[cell.coordinate.y][cell.coordinate.x + 1];
    }

    // Bottoms
    if (cell.coordinate.y < board.length - 1) {
      const growing =
        board[cell.coordinate.y].length < board[cell.coordinate.y + 1].length;
      const shrinking =
        board[cell.coordinate.y].length > board[cell.coordinate.y + 1].length;
      const offset =
        Math.abs(
          board[cell.coordinate.y].length - board[cell.coordinate.y + 1].length,
        ) !== 1
          ? (Math.abs(
              board[cell.coordinate.y + 1].length -
                board[cell.coordinate.y].length,
            ) -
              1) /
            2
          : 0;

      if (growing) {
        // --> BottomLeft
        neightboors[Directions.BottomLeft] =
          board[cell.coordinate.y + 1][cell.coordinate.x + offset];
        // --> BottomRight
        neightboors[Directions.BottomRight] =
          board[cell.coordinate.y + 1][cell.coordinate.x + offset + 1];
      } else if (shrinking) {
        if (
          cell.coordinate.x - offset > 0 && // - offset & next line: middle board into bottom triangle
          cell.coordinate.x - offset <= board[cell.coordinate.y + 1].length
        ) {
          // --> BottomLeft
          neightboors[Directions.BottomLeft] =
            board[cell.coordinate.y + 1][cell.coordinate.x - offset - 1];
        }
        if (
          cell.coordinate.x - offset >= 0 && // - offset & this line: middle board into bottom triangle
          cell.coordinate.x - offset < board[cell.coordinate.y + 1].length
        ) {
          // --> BottomRight
          neightboors[Directions.BottomRight] =
            board[cell.coordinate.y + 1][cell.coordinate.x - offset];
        }
      }
    }

    // Tops
    if (cell.coordinate.y > 0) {
      const growing =
        board[cell.coordinate.y - 1].length < board[cell.coordinate.y].length;
      const shrinking =
        board[cell.coordinate.y - 1].length > board[cell.coordinate.y].length;
      const offset =
        Math.abs(
          board[cell.coordinate.y - 1].length - board[cell.coordinate.y].length,
        ) !== 1
          ? (Math.abs(
              board[cell.coordinate.y - 1].length -
                board[cell.coordinate.y].length,
            ) -
              1) /
            2
          : 0;

      if (growing) {
        if (
          cell.coordinate.x - offset > 0 && // - offset & next line: top triangle into middle board
          cell.coordinate.x - offset <= board[cell.coordinate.y - 1].length
        ) {
          // --> TopLeft
          neightboors[Directions.TopLeft] =
            board[cell.coordinate.y - 1][cell.coordinate.x - offset - 1];
        }
        if (
          cell.coordinate.x - offset >= 0 && // - offset & this line: top triangle into middle board
          cell.coordinate.x - offset < board[cell.coordinate.y - 1].length
        ) {
          // --> TopRight
          neightboors[Directions.TopRight] =
            board[cell.coordinate.y - 1][cell.coordinate.x - offset];
        }
      } else if (shrinking) {
        // --> TopLeft
        neightboors[Directions.TopLeft] =
          board[cell.coordinate.y - 1][cell.coordinate.x + offset];
        // --> TopRight
        neightboors[Directions.TopRight] =
          board[cell.coordinate.y - 1][cell.coordinate.x + offset + 1];
      }
    }
    return neightboors;
  }

  private areCoordinatesPlayable(
    board: Board,
    sc: Coordinates,
    ec: Coordinates,
  ): boolean {
    if (sc.x === ec.x && sc.y === ec.y) {
      return false;
    }
    if (
      board[sc.y][sc.x].color === Colors.none ||
      board[ec.y][ec.x].color !== Colors.none
    ) {
      return false;
    }

    const scNeightboors = this.getNeightboors(board, board[sc.y][sc.x]);

    for (const key in scNeightboors) {
      const neightboor: Cell | undefined = scNeightboors[key];

      if (neightboor !== undefined) {
        const nc: Coordinates = neightboor.coordinate;

        if (nc.x === ec.x && nc.y === ec.y) {
          return true;
        } else if (neightboor.color !== Colors.none) {
          const nbNeightboors = this.getNeightboors(board, board[nc.y][nc.x]);
          const nbNeightboor: Cell | undefined = nbNeightboors[key];

          if (nbNeightboor !== undefined) {
            if (
              nbNeightboor.coordinate.x === ec.x &&
              nbNeightboor.coordinate.y === ec.y
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private isMovePlayable(board: Board, move: Move): boolean {
    const dummyBoard = JSON.parse(JSON.stringify(board));
    const penultimate = move.length - 1;

    for (let index = 0; index < penultimate; index++) {
      const sc = move[index];
      const ec = move[index + 1];

      if (this.areCoordinatesPlayable(dummyBoard, sc, ec)) {
        dummyBoard[ec.y][ec.x].color = dummyBoard[sc.y][sc.x].color;
        dummyBoard[sc.y][sc.x].color = Colors.none;
      } else {
        return false;
      }
    }

    return true;
  }

  async play(
    server: Server,
    client: Socket,
    message: { sender: string; room: string; move: Move },
  ) {
    this.logger.log(`Play #${JSON.stringify(message)}`);

    try {
      const game = await this.gamesService.findOne(+message.room);

      if (game.state !== State.OnGoing) {
        return {
          status: 'failure',
          message: `Game is not on going`,
        };
      }

      const dummy = { name: message.sender, color: Colors.none };

      if (!this.playerIsInGame(game, dummy)) {
        return {
          status: 'failure',
          message: `Player #${message.sender} is not in game #${message.room}`,
        };
      }

      const player = game.players.find((item) => item.name === dummy.name);

      if (player.color !== game.nextColorToPlay) {
        return {
          status: 'failure',
          message: `Player color #${player.color} cannot play yet`,
        };
      }

      if (message.move.length < 2) {
        return {
          status: 'failure',
          message: `Move played must have at least 2 coordinates`,
        };
      }

      const firstMove = message.move[0];
      const lastMove = message.move[message.move.length - 1];

      if (player.color !== game.board[firstMove.y][firstMove.x].color) {
        return {
          status: 'failure',
          message: `Player color #${player.color} cannot play another color`,
        };
      }

      if (game.board[lastMove.y][lastMove.x].color !== Colors.none) {
        return {
          status: 'failure',
          message: `Player color #${player.color} can not end its play on top of another color`,
        };
      }

      /*if (!this.isMovePlayable(game.board, message.move)) {
        return {
          status: 'failure',
          message: `Move is not playable`,
        };
      }*/

      if (player.longestMove < message.move.length - 1) {
        player.longestMove = message.move.length - 1;
      }

      game.board[lastMove.y][lastMove.x].color =
        game.board[firstMove.y][firstMove.x].color;
      game.board[firstMove.y][firstMove.x].color = Colors.none;
      game.history.push(message.move);

      if (this.hasPlayerWon(game, player)) {
        this.logger.log(`End #${game.id}`);

        game.winner = player.name;

        await this.gamesService.update(game.id, {
          board: game.board,
          history: game.history,
          nextColorToPlay: Colors.none,
          players: game.players,
          winner: player.name,
          state: State.Finished,
        });

        server
          .to(message.room)
          .emit('end', { message: { winner: game.winner }, game: game });
        // Kick clients from room maybe?

        return {
          status: 'success',
          message: `Player #${message.sender} has won`,
          game: game,
        };
      }

      game.nextColorToPlay = this.getNextColorToPlay(game);

      await this.gamesService.update(game.id, {
        board: game.board,
        history: game.history,
        nextColorToPlay: game.nextColorToPlay,
        players: game.players,
      });

      client.to(message.room).emit('play', { message: message, game: game });

      return {
        status: 'success',
        message: `Player #${message.sender} has played`,
        game: game,
      };
    } catch (error) {
      return { status: 'failure', message: (error as HttpException).message };
    }
  }
}
