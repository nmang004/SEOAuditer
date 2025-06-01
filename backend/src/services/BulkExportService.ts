export class BulkExportService {
  async bulkExport(request: any): Promise<any> {
    return {
      success: false,
      error: 'Bulk export service temporarily disabled',
      message: 'This feature is under development'
    };
  }

  async getExportStatus(jobId: string): Promise<any> {
    return {
      success: false,
      error: 'Bulk export service temporarily disabled'
    };
  }

  async cancelExport(jobId: string): Promise<any> {
    return {
      success: false,
      error: 'Bulk export service temporarily disabled'
    };
  }
}