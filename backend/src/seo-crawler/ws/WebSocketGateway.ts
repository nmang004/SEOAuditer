import { io } from '../../index';

export class WebSocketGateway {
  emitProgress(jobId: string, progress: any) {
    io.to(`crawl:${jobId}`).emit('crawl:progress', { jobId, ...progress });
  }

  emitPageComplete(jobId: string, page: any) {
    io.to(`crawl:${jobId}`).emit('crawl:pageComplete', { jobId, page });
  }

  emitIssue(jobId: string, issue: any) {
    io.to(`crawl:${jobId}`).emit('crawl:issue', { jobId, issue });
  }

  emitComplete(jobId: string, results: any) {
    io.to(`crawl:${jobId}`).emit('crawl:complete', { jobId, results });
  }

  emitError(jobId: string, error: any) {
    io.to(`crawl:${jobId}`).emit('crawl:error', { jobId, error });
  }

  emitCancelled(jobId: string) {
    io.to(`crawl:${jobId}`).emit('crawl:cancelled', { jobId, status: 'cancelled' });
  }
} 