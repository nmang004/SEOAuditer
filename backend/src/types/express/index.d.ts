import { Server as SocketIOServer } from 'socket.io';
import 'express-serve-static-core';
import 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    io: SocketIOServer;
    fileData?: any;
    logout?: (callback: (err?: any) => void) => void;
  }
}

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
} 