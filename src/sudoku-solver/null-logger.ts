import { Logger } from './logger';

export class NullLogger implements Logger {
  log(message: string): void {
    return;
  }

  info(message: string): void {
    return;
  }

  debug(message: string): void {
    return;
  }

  warn(message: string): void {
    return;
  }

  error(message: string): void {
    return;
  }
}

export const nullLogger: NullLogger = new NullLogger();
