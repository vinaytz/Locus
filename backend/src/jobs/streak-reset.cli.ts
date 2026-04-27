/**
 * Manual entry point for invoking the streak reset job (e.g. from cron
 * outside the running server). Run with: `npm run streak:reset`.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JobsService } from './jobs.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jobs = app.get(JobsService);
  const out = await jobs.resetBrokenStreaks();
  // eslint-disable-next-line no-console
  console.log(out);
  await app.close();
}
void main();
