export enum Colors {
  none,
  red,
  orange,
  yellow,
  green,
  blue,
  purple,
}

export enum Directions {
  BottomLeft,
  BottomRight,
  Left,
  Right,
  TopLeft,
  TopRight,
}

export type Cell = { color: Colors; coordinate: Coordinates };

export type Board = Array<Array<Cell>>;

export type Coordinates = {
  x: number;
  y: number;
};

export type Move = Array<Coordinates>;

export type History = Array<Move>;

export type Player = {
  name: string;
  color: Colors;
  ready?: boolean;
  longestMove?: number;
};

export enum State {
  Lobby,
  OnGoing,
  Finished,
}
