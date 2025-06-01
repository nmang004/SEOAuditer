import { NextRequest, NextResponse } from 'next/server';
import { ReportTemplateService } from '../../../../../backend/src/services/ReportTemplateService';

const templateService = new ReportTemplateService();

// GET - Fetch all templates for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const includeDefault = searchParams.get('includeDefault') === 'true';

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter'
      }, { status: 400 });
    }

    const templates = await templateService.getTemplates(userId, includeDefault);

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Get templates API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create a new template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    if (!body.name || !body.userId || !body.sections) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, userId, sections'
      }, { status: 400 });
    }

    const template = await templateService.createTemplate({
      name: body.name,
      description: body.description || '',
      userId: body.userId,
      sections: body.sections,
      format: body.format || 'pdf',
      settings: body.settings || {},
      branding: body.branding || {},
      isPublic: body.isPublic || false
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Create template API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update an existing template
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.templateId || !body.userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: templateId, userId'
      }, { status: 400 });
    }

    const template = await templateService.updateTemplate(body.templateId, body.userId, {
      name: body.name,
      description: body.description,
      sections: body.sections,
      format: body.format,
      settings: body.settings,
      branding: body.branding,
      isPublic: body.isPublic
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Update template API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Delete a template
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId');
    const userId = searchParams.get('userId');

    if (!templateId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing templateId or userId parameters'
      }, { status: 400 });
    }

    await templateService.deleteTemplate(templateId, userId);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 