import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { PrismaClient } from '@prisma/client';
import { repeat } from 'rxjs';

@Injectable()
export class BotService implements OnModuleInit {
  private client: Client = new Client({
    authStrategy: new LocalAuth(),
  });

  private prisma = new PrismaClient();

  private readonly enterpriseId = '31f3dd7a-adf1-475c-96b0-4ad02f5378a6';

  private readonly logger = new Logger(BotService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.client.on('qr', (qr) => {
      this.logger.log(
        `QrCode: http://localhost:${3000}/bot/qrcode`,
      );
      this.eventEmitter.emit('qrcode.created', qr);
    });

    this.client.on('ready', async () => {
      this.logger.log("You're connected successfully!");
    });

    let numOrderCount: number = 0;
    let idPadre: string = ' ';

    this.client.on('message', async (msg) => {
      this.logger.verbose(`${msg.from}: ${msg.body}`);
      const messages = await this.prisma.messages.findMany({where: {available: true}, orderBy: {numOrder: 'asc'}});
      let m;
      for(let i = numOrderCount; i <= messages.length;) {

        if(messages[i]?.parentMessageId === null && messages[i]?.option === 'MENU') {
          m = messages[i]?.body;
          msg.reply(m);
          console.log('te respondi')
          numOrderCount = numOrderCount+2;
          idPadre = messages[i]?.id;
          break;
        }

        if(messages[i]?.parentMessageId === idPadre && messages[i]?.option === 'MENU' && messages[i]?.trigger === msg.body) {
          console.log('entro?')
          const counti = await this.prisma.messages.count({where: {parentMessageId: messages[i]?.id}});
          const x = await this.prisma.messages.findUnique({where: {id: idPadre}});
          m = messages[i]?.body;
          msg.reply(m);
          idPadre = messages[i]?.id;
          numOrderCount = (counti + x?.numOrder);
          break;
        }

        if(messages[i]?.parentMessageId === idPadre && messages[i]?.trigger === msg.body) {
          const counti = await this.prisma.messages.count({where: {parentMessageId: messages[i]?.id}});
          const x = await this.prisma.messages.findUnique({where: {id: idPadre}});
          m = messages[i]?.body;
          msg.reply(m);
          idPadre = messages[i]?.id;
          numOrderCount = (counti + x?.numOrder) + 1;
          //numOrderCount = 0;
          break;
        }

        if(i == messages.length-1) {
          m = messages[i]?.body;
          await msg.reply(m);
          numOrderCount = 0;
          break;
        }

        if(numOrderCount === 0) {
          m = messages[i]?.body;
          await msg.reply(m);
        }
        i++;
      }
    });

    this.client.initialize();
  }
}
