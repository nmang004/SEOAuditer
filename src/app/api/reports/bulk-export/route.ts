import { NextRequest, NextResponse } from 'next/server';
import { BulkExportService } from '../../../../../backend/src/services/BulkExportService';

const bulkExportService = new BulkExportService();

interface BulkExportRequest {
  userId: string;
  projectId?: string;
  analysisIds: string[];
  format: 'excel' | 'csv' | 'json';
  options: {
    includeCharts: boolean;
    includeTrends: boolean;
    includeImages: boolean;
    consolidateData: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
    sections: string[];
    groupBy?: 'project' | 'date' | 'score' | 'none';
  };
  delivery?: {
    email?: boolean;
    recipients?: string[];
    subject?: string;
    message?: string;
  };
}

// POST - Start bulk export process
export async function POST(req: NextRequest) {
  try {
    const body: BulkExportRequest = await req.json();
    
    // Validate request
    if (!body.userId || !body.analysisIds || body.analysisIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, analysisIds'
      }, { status: 400 });
    }

    // Validate format
    if (!['excel', 'csv', 'json'].includes(body.format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid format. Must be excel, csv, or json'
      }, { status: 400 });
    }

    // Check if export is too large (limit to 500 analyses as per requirements)
    if (body.analysisIds.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 500 analyses allowed per export'
      }, { status: 400 });
    }

    // Process date range
    const options = {
      ...body.options,
      dateRange: body.options.dateRange ? {
        start: new Date(body.options.dateRange.start),
        end: new Date(body.options.dateRange.end)
      } : undefined
    };

    // Start bulk export (async process)
    const exportJob = await bulkExportService.startBulkExport({
      userId: body.userId,
      projectId: body.projectId,
      analysisIds: body.analysisIds,
      format: body.format,
      options: options,
      delivery: body.delivery
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: exportJob.id,
        status: exportJob.status,
        estimatedTime: exportJob.estimatedTime,
        totalRecords: body.analysisIds.length,
        createdAt: exportJob.createdAt
      }
    });

  } catch (error) {
    console.error('Bulk export API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Check bulk export status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');

    if (!jobId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing jobId or userId parameters'
      }, { status: 400 });
    }

    const job = await bulkExportService.getExportStatus(jobId, userId);

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Export job not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        totalRecords: job.totalRecords,
        processedRecords: job.processedRecords,
        estimatedTimeRemaining: job.estimatedTimeRemaining,
        downloadUrl: job.downloadUrl,
        fileSize: job.fileSize,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }
    });

  } catch (error) {
    console.error('Get bulk export status API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Cancel bulk export job
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');

    if (!jobId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing jobId or userId parameters'
      }, { status: 400 });
    }

    const cancelled = await bulkExportService.cancelExport(jobId, userId);

    if (!cancelled) {
      return NextResponse.json({
        success: false,
        error: 'Export job not found or cannot be cancelled'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Export job cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel bulk export API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 