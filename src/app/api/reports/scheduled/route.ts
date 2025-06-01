import { NextRequest, NextResponse } from 'next/server';
import { ScheduledReportService } from '../../../../../backend/src/services/ScheduledReportService';

const scheduledReportService = new ScheduledReportService();

// GET - Fetch scheduled reports for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter'
      }, { status: 400 });
    }

    const scheduledReports = await scheduledReportService.getScheduledReports(userId);

    return NextResponse.json({
      success: true,
      data: scheduledReports
    });

  } catch (error) {
    console.error('Get scheduled reports API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create a new scheduled report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    if (!body.name || !body.userId || !body.projectId || !body.templateId || !body.schedule) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, userId, projectId, templateId, schedule'
      }, { status: 400 });
    }

    // Validate schedule
    if (!body.schedule.frequency || !['daily', 'weekly', 'monthly', 'quarterly'].includes(body.schedule.frequency)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid frequency. Must be daily, weekly, monthly, or quarterly'
      }, { status: 400 });
    }

    const scheduledReport = await scheduledReportService.createScheduledReport({
      name: body.name,
      description: body.description || '',
      userId: body.userId,
      projectId: body.projectId,
      templateId: body.templateId,
      schedule: {
        frequency: body.schedule.frequency,
        dayOfWeek: body.schedule.dayOfWeek,
        dayOfMonth: body.schedule.dayOfMonth,
        time: body.schedule.time || '09:00',
        timezone: body.schedule.timezone || 'UTC'
      },
      recipients: body.recipients || [],
      isActive: body.isActive !== false // Default to true
    });

    return NextResponse.json({
      success: true,
      data: scheduledReport
    });

  } catch (error) {
    console.error('Create scheduled report API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update an existing scheduled report
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.scheduleId || !body.userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: scheduleId, userId'
      }, { status: 400 });
    }

    const scheduledReport = await scheduledReportService.updateScheduledReport(body.scheduleId, {
      name: body.name,
      description: body.description,
      templateId: body.templateId,
      schedule: body.schedule,
      recipients: body.recipients,
      isActive: body.isActive
    });

    return NextResponse.json({
      success: true,
      data: scheduledReport
    });

  } catch (error) {
    console.error('Update scheduled report API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Delete a scheduled report
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('scheduleId');
    const userId = searchParams.get('userId');

    if (!scheduleId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing scheduleId or userId parameters'
      }, { status: 400 });
    }

    await scheduledReportService.deleteScheduledReport(scheduleId);

    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });

  } catch (error) {
    console.error('Delete scheduled report API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 