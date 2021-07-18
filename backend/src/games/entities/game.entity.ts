import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Board, Colors, History, Player, State } from 'types/game.interface';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ default: Number(10) })
  public pieces: number;

  @Column({
    type: 'jsonb',
    default: [],
  })
  public board: Board;

  @Column({
    type: 'jsonb',
    default: [],
  })
  public history: History;

  @Column({
    type: 'enum',
    enum: [
      Colors.none,
      Colors.red,
      Colors.orange,
      Colors.yellow,
      Colors.green,
      Colors.blue,
      Colors.purple,
    ],
    default: Colors.none,
  })
  nextColorToPlay: Colors;

  @Column({ default: '' })
  public winner: string;

  @Column({
    type: 'jsonb',
    default: [],
  })
  public players: Array<Player>;

  @Column({
    type: 'enum',
    enum: [State.Lobby, State.OnGoing, State.Finished],
    default: State.Lobby,
  })
  public state: State;
}
