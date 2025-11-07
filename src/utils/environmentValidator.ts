/**
 * Environment validation utility
 * Helps ensure all required API keys are properly configured
 */

interface EnvironmentConfig {
  cmisApiKey: string | null;
  cmisBaseUrl: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  isDevelopment: boolean;
  isProduction: boolean;
}

class EnvironmentValidator {
  private config: EnvironmentConfig;

  constructor() {
    this.config = {
      cmisApiKey: import.meta.env.VITE_CMIS_API_KEY || null,
      cmisBaseUrl: import.meta.env.VITE_CMIS_BASE_URL || 'https://api.cimis.water.ca.gov/api/data',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || null,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || null,
      isDevelopment: import.meta.env.DEV,
      isProduction: import.meta.env.PROD,
    };
  }

  /**
   * Validate CMIS API configuration
   */
  validateCMIS(): { isValid: boolean; message: string; canUseMock: boolean } {
    if (!this.config.cmisApiKey) {
      return {
        isValid: false,
        message: 'CMIS API key not found. Set VITE_CMIS_API_KEY in .env.local to enable California irrigation data.',
        canUseMock: false
      };
    }

    if (this.config.cmisApiKey === 'your_cmis_api_key_here') {
      return {
        isValid: false,
        message: 'CMIS API key is placeholder value. Replace with actual key from CIMIS website.',
        canUseMock: false
      };
    }

    if (this.config.cmisApiKey.length < 10) {
      return {
        isValid: false,
        message: 'CMIS API key appears to be invalid (too short). Check your key.',
        canUseMock: false
      };
    }

    return {
      isValid: true,
      message: 'CMIS API key is configured and appears valid.',
      canUseMock: false
    };
  }

  /**
   * Get current environment configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Check if we're in a secure environment for API keys
   */
  isSecureEnvironment(): boolean {
    // In development, localhost is considered secure
    if (this.config.isDevelopment) {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    // In production, check for HTTPS
    return window.location.protocol === 'https:';
  }

  /**
   * Log environment status for debugging
   */
  logStatus(): void {
    if (this.config.isDevelopment) {
      const cmisValidation = this.validateCMIS();
      
      console.group('🔧 Environment Configuration Status');
      console.log('Environment:', this.config.isDevelopment ? 'Development' : 'Production');
      console.log('Secure Context:', this.isSecureEnvironment() ? '✅' : '❌');
      console.log('CMIS API Key:', this.config.cmisApiKey ? '✅ Configured' : '❌ Missing');
      console.log('CMIS Status:', cmisValidation.message);
      console.log('Supabase URL:', this.config.supabaseUrl ? '✅ Configured' : '❌ Missing');
      console.groupEnd();
    }
  }

  /**
   * Get user-friendly setup instructions
   */
  getSetupInstructions(): string[] {
    const instructions: string[] = [];
    const cmisValidation = this.validateCMIS();

    if (!cmisValidation.isValid) {
      instructions.push(
        '1. Get CMIS API key from: https://cimis.water.ca.gov/WSNReportCriteria.aspx',
        '2. Add to .env.local: VITE_CMIS_API_KEY=your_actual_key',
        '3. Restart development server'
      );
    }

    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      instructions.push(
        '4. Configure Supabase keys in .env.local',
        '5. Check .env.example for required variables'
      );
    }

    return instructions;
  }
}

export const environmentValidator = new EnvironmentValidator();
export type { EnvironmentConfig };