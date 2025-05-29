declare module 'lighthouse' {
  export interface Flags {
    port?: number;
    output?: string | string[];
    maxWaitForLoad?: number;
    logLevel?: 'silent' | 'error' | 'info' | 'verbose';
    disableStorageReset?: boolean;
    chromeFlags?: string[];
    chromePath?: string;
    disableDeviceEmulation?: boolean;
    disableCpuThrottling?: boolean;
    disableNetworkThrottling?: boolean;
    throttlingMethod?: 'devtools' | 'provided' | 'simulate';
    throttling?: {
      rttMs?: number;
      throughputKbps?: number;
      requestLatencyMs?: number;
      downloadThroughputKbps?: number;
      uploadThroughputKbps?: number;
      cpuSlowdownMultiplier?: number;
    };
    formFactor?: 'mobile' | 'desktop';
    screenEmulation?: {
      mobile: boolean;
      width: number;
      height: number;
      deviceScaleFactor: number;
      disabled: boolean;
    };
    emulatedUserAgent?: string;
  }

  export interface Config {
    extends?: 'lighthouse:default' | 'lighthouse:full' | string;
    settings?: {
      maxWaitForFcp?: number;
      maxWaitForLoad?: number;
      skipAudits?: string[];
      onlyCategories?: string[];
      onlyAudits?: string[];
      formFactor?: 'mobile' | 'desktop';
      throttling?: {
        rttMs?: number;
        throughputKbps?: number;
        requestLatencyMs?: number;
        downloadThroughputKbps?: number;
        uploadThroughputKbps?: number;
        cpuSlowdownMultiplier?: number;
      };
      screenEmulation?: {
        mobile: boolean;
        width: number;
        height: number;
        deviceScaleFactor: number;
        disabled: boolean;
      };
    };
  }

  export interface AuditResult {
    id: string;
    title: string;
    description: string;
    score: number | null;
    scoreDisplayMode: string;
    displayValue?: string;
    details?: any;
  }

  export interface CategoryResult {
    id: string;
    title: string;
    description?: string;
    manualDescription?: string;
    score: number | null;
    auditRefs: Array<{ id: string; weight: number; group?: string }>;
  }

  export interface Result {
    lhr: {
      requestedUrl: string;
      finalUrl: string;
      fetchTime: string;
      audits: Record<string, AuditResult>;
      categories: Record<string, CategoryResult>;
      categoryGroups: Record<string, { title: string; description: string }>;
      configSettings: any;
      environment: any;
      i18n: any;
      runtimeConfig: any;
      timing: any;
      userAgent: string;
    };
    report: string[];
    artifacts: any;
  }

  export default function lighthouse(
    url: string,
    flags?: Flags,
    config?: Config | null,
    runnerFlags?: any
  ): Promise<Result>;

  export function generateReport(
    lhr: any,
    output: string | string[],
    options?: { port?: number; disableDeviceEmulation?: boolean }
  ): Promise<string>;

  export const Flags: {
    init(flags?: Flags): Flags;
  };
}
