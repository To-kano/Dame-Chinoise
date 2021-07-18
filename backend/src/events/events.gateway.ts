import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { Logger } from '@nestjs/common';
import { Move } from 'types/game.interface';

@WebSocketGateway(3002, { cors: { credentials: true }})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly eventsService: EventsService) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  async handleConnection(socket: Socket) {
    this.logger.log(`Socket id #${socket.id} connected`);
  }

  async handleDisconnect(socket: Socket) {
    this.logger.log(`Socket id #${socket.id} disconnected`);
  }
  @SubscribeMessage('join')
  handleJoin(
    client: Socket,
    message: { sender: string; room: string; color: string },
  ) {
    return this.eventsService.join(this.server, client, message);
  }

  @SubscribeMessage('leave')
  handleLeave(client: Socket, message: { sender: string; room: string }) {
    return this.eventsService.leave(this.server, client, message);
  }

  @SubscribeMessage('ready')
  handleReady(
    client: Socket,
    message: { sender: string; room: string; ready: boolean },
  ) {
    return this.eventsService.ready(this.server, client, message);
  }

  @SubscribeMessage('play')
  handlePlay(
    client: Socket,
    message: { sender: string; room: string; move: Move },
  ) {
    return this.eventsService.play(this.server, client, message);
  }
}
