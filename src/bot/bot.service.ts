import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const rm = promisify(fs.rm);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class BotService implements OnModuleInit {
  private client: Client = new Client({
    authStrategy: new LocalAuth(),
  });
  private enterpriseId: string = '';
  private prisma = new PrismaClient();
  private readonly logger = new Logger(BotService.name);
  private followUpTimer: NodeJS.Timeout | null = null;

  constructor(private eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.client.on('qr', (qr) => {
      this.logger.log(
        `QrCode: http://localhost:${3000}/bot/qrcode/421a24c1-e02d-44b3-af45-267e1b5e306c`,
      );
      this.eventEmitter.emit('qrcode.created', qr);
    });

    this.client.on('ready', async () => {
      this.logger.log("You're connected successfully!");
    });

    let numOrderCount: number = 0;
    let idPadre: string = ' ';
    let advance: number = 0;

    this.client.on('message', async (msg) => {
      this.logger.verbose(`${msg.from}: ${msg.body}`);
      const messages = await this.prisma.messages.findMany({where: {enterpriseId: this.enterpriseId}, orderBy: {numOrder: 'asc'}});
      let m;
      if(msg.body === '1') {
        advance = 1;
        numOrderCount = numOrderCount+advance;
      } else if(msg.body === '2') {
        advance = 2;
        numOrderCount = numOrderCount+advance;
      } else if(msg.body === '3') {
        advance = 3;
        numOrderCount = numOrderCount+advance;
      }

      for(let i = numOrderCount; i <= messages.length;) {

        if(messages[i]?.parentMessageId === null && messages[i]?.option === 'MENU') {
          m = messages[i]?.body;
          msg.reply(m);
          console.log('te respondi')
          idPadre = messages[i]?.id;
          break;
        }

        if(messages[i]?.parentMessageId === idPadre && messages[i]?.option === 'MENU' && messages[i]?.trigger.toLowerCase() === msg.body.toLowerCase()) {
          console.log('entro?')
          const counti = await this.prisma.messages.count({where: {parentMessageId: messages[i]?.id}});
          const x = await this.prisma.messages.findUnique({where: {id: idPadre}});
          m = messages[i]?.body;
          msg.reply(m);
          idPadre = messages[i]?.id;
          break;
        }

        if(messages[i]?.parentMessageId === idPadre && messages[i]?.trigger.toLowerCase() === msg.body.toLowerCase()) {
          const counti = await this.prisma.messages.count({where: {parentMessageId: messages[i]?.id}});
          const x = await this.prisma.messages.findUnique({where: {id: idPadre}});
          m = messages[i]?.body;
          msg.reply(m);
          idPadre = messages[i]?.id;
          //numOrderCount = 0;
          if(messages[i]?.finishLane === true) {
            numOrderCount = 0;
            break;
          } else {
            break;
          }

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
          numOrderCount = numOrderCount+1;
        }
        i++;
      }
    });

    this.client.initialize();
  }

  async setEnterpriseId(id: string) {
    this.enterpriseId = id;
  }

  async disconnect() {
    const cachePath = path.join(__dirname, '..', '..', '.wwebjs_cache');

    const deleteFolder = async (folderPath: string) => {
      try {
        if (fs.existsSync(folderPath)) {
          await rm(folderPath, { recursive: true, force: true });
        }
      } catch (error) {
        if (error.code === 'EBUSY') {
          this.logger.warn(`Resource busy, retrying: ${folderPath}`);
          await sleep(1000);
          await deleteFolder(folderPath);
        } else {
          throw error;
        }
      }
    };

    try {
      await deleteFolder(cachePath);
      await this.client.logout();
      this.logger.log('Client disconnected and folders deleted successfully.');
      this.client.initialize(); // Reiniciar el cliente después de la desconexión
      this.logger.log('Client initialized again.');
    } catch (error) {
      this.logger.error(`Error while cleaning up: ${error.message}`);
    }
  }
}
