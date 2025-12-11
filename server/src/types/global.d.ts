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

  var setTimeout: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => any;
  var clearTimeout: (timeoutId: any) => void;
  var setInterval: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => any;
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
    username: string;
    password: string;
  }

  var URL: {
    new (input: string, base?: string): URL;
    prototype: URL;
  };
}

// Declarações de módulos para Express
declare module 'express' {
  export interface Request {
    body: any;
    params: any;
    query: any;
    headers: {
      [key: string]: string | string[] | undefined;
      authorization?: string;
      [key: string]: any;
    };
    path?: string;
    method?: string;
    [key: string]: any;
  }

  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    setHeader(name: string, value: string): void;
    getHeader(name: string): string | undefined;
    end(chunk?: any): Response;
    [key: string]: any;
  }

  export type NextFunction = (err?: any) => void;

  export interface Router {
    get(path: any, ...handlers: any[]): Router;
    post(path: any, ...handlers: any[]): Router;
    put(path: any, ...handlers: any[]): Router;
    delete(path: any, ...handlers: any[]): Router;
    patch(path: any, ...handlers: any[]): Router;
    use(...handlers: any[]): Router;
    [key: string]: any;
  }

  export interface Express {
    (): any;
    Router(): Router;
    use(...handlers: any[]): Express;
    get(path: any, ...handlers: any[]): Express;
    post(path: any, ...handlers: any[]): Express;
    put(path: any, ...handlers: any[]): Express;
    delete(path: any, ...handlers: any[]): Express;
    patch(path: any, ...handlers: any[]): Express;
    options(path: any, ...handlers: any[]): Express;
    listen(port: number, hostname?: string, callback?: () => void): any;
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

// Namespace Express para multer
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}

export {};

