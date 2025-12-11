// Declarações de tipos globais para Node.js e Express
// Isso permite que o TypeScript compile mesmo sem @types/node e @types/express instalados

declare global {
  var console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
  };

  var process: {
    env: {
      [key: string]: string | undefined;
      NODE_ENV?: string;
      PORT?: string;
      DATABASE_URL?: string;
      JWT_SECRET?: string;
      CORS_ORIGIN?: string;
    };
    exit(code?: number): never;
  };

  var setTimeout: (callback: () => void, ms: number) => any;
  var clearTimeout: (timeoutId: any) => void;
  var setInterval: (callback: () => void, ms: number) => any;
  var clearInterval: (intervalId: any) => void;

  interface URL {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
  }

  var URL: {
    new (input: string, base?: string): URL;
    prototype: URL;
  };
}

// Declarações de módulos para Express
declare module 'express' {
  export interface Request {
    body?: any;
    params?: any;
    query?: any;
    headers?: any;
    [key: string]: any;
  }

  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    setHeader(name: string, value: string): void;
    getHeader(name: string): string | undefined;
    [key: string]: any;
  }

  export type NextFunction = (err?: any) => void;

  export interface Express {
    (): any;
    [key: string]: any;
  }

  const express: Express;
  export default express;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export const sep: string;
  export const delimiter: string;
}

export {};

