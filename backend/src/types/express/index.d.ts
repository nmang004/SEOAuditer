import { Server as SocketIOServer } from 'socket.io';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    io: SocketIOServer;
    fileData?: any;
    logout?: (callback: (err?: any) => void) => void;
  }
} 