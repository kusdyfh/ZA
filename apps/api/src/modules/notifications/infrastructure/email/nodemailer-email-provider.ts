import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { AppConfig } from '../../../../shared/config/configuration';
import type { EmailMessage, EmailProviderPort } from './email-provider.port';

/** SMTP via `nodemailer` — defaults to the Mailpit container `docker-compose.yml` already provisions (ADR 0024). */
@Injectable()
export class NodemailerEmailProvider implements EmailProviderPort {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const appConfig = config.getOrThrow<AppConfig>('app');
    this.from = appConfig.smtpFrom;
    this.transporter = nodemailer.createTransport({
      host: appConfig.smtpHost,
      port: appConfig.smtpPort,
      secure: false,
      auth: appConfig.smtpUser ? { user: appConfig.smtpUser, pass: appConfig.smtpPassword } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
