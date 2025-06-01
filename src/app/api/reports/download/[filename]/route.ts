import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    
    if (!filename) {
      return new NextResponse('Filename required', { status: 400 });
    }

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    // Check if this is a report or export file
    const reportsDir = path.join(process.cwd(), 'reports');
    const exportsDir = path.join(process.cwd(), 'exports');
    
    let filePath: string | null = null;
    let fileType: 'report' | 'export' | null = null;

    // Try reports directory first
    try {
      const reportPath = path.join(reportsDir, filename);
      await fs.access(reportPath);
      filePath = reportPath;
      fileType = 'report';
    } catch {
      // Try exports directory
      try {
        const exportPath = path.join(exportsDir, filename);
        await fs.access(exportPath);
        filePath = exportPath;
        fileType = 'export';
      } catch {
        return new NextResponse('File not found', { status: 404 });
      }
    }

    if (!filePath) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Optional: Add additional security checks here
    // For example, verify the user has access to this file by checking database records

    // Get file stats
    const stats = await fs.stat(filePath);
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let downloadName = filename;

    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', stats.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${downloadName}"`);
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 