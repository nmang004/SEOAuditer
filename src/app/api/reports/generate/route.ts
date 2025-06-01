import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerationService } from '../../../../../backend/src/services/ReportGenerationService';
import { ReportTemplateService } from '../../../../../backend/src/services/ReportTemplateService';
import { EmailService } from '../../../../../backend/src/services/EmailService';

interface ReportRequest {
  analysisId: string;
  projectId: string;
  config: {
    format: 'pdf' | 'excel' | 'csv' | 'json';
    template: 'executive' | 'detailed' | 'technical' | 'custom';
    sections: string[];
    includeTrends: boolean;
    includeCharts: boolean;
    includeImages: boolean;
    branding?: {
      logo?: string;
      primaryColor?: string;
      companyName?: string;
      whiteLabelMode?: boolean;
    };
    dateRange?: {
      start: string;
      end: string;
    };
    customization?: {
      title?: string;
      subtitle?: string;
      description?: string;
      footer?: string;
    };
    delivery?: {
      email?: boolean;
      recipients?: string[];
      subject?: string;
      message?: string;
    };
  };
  userId: string;
}

const reportService = new ReportGenerationService();
const templateService = new ReportTemplateService();
const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    const body: ReportRequest = await req.json();
    
    // Validate request
    if (!body.analysisId || !body.projectId || !body.userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: analysisId, projectId, userId'
      }, { status: 400 });
    }

    // Validate format
    if (!['pdf', 'excel', 'csv', 'json'].includes(body.config.format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid format. Must be pdf, excel, csv, or json'
      }, { status: 400 });
    }

    // Process date range
    const config = {
      ...body.config,
      dateRange: body.config.dateRange ? {
        start: new Date(body.config.dateRange.start),
        end: new Date(body.config.dateRange.end)
      } : undefined
    };

    // Generate report
    const result = await reportService.generateReport({
      analysisId: body.analysisId,
      projectId: body.projectId,
      config: config,
      userId: body.userId
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Report generation failed'
      }, { status: 500 });
    }

    // Handle email delivery if requested
    if (body.config.delivery?.email && body.config.delivery?.recipients && body.config.delivery.recipients.length > 0) {
      try {
        await emailService.sendEmail({
          to: body.config.delivery.recipients,
          subject: body.config.delivery.subject || 'SEO Analysis Report',
          body: body.config.delivery.message || 'Please find your SEO analysis report attached.'
        });
      } catch (emailError) {
        console.warn('Email delivery failed:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: result.reportId,
        downloadUrl: result.downloadUrl,
        fileSize: result.fileSize,
        format: body.config.format,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    });

  } catch (error) {
    console.error('Report generation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint for checking report generation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');

    if (!reportId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing reportId or userId'
      }, { status: 400 });
    }

    const status = await reportService.getReportStatus(reportId);

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Report status API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 