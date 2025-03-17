
// Base API client with authentication and common utilities

// Define common types for the API
export type ApiConnectionStatus = {
  isAuthenticated: boolean;
  isOnline: boolean;
};

export class ApiClient {
  protected isAuthenticated = false;
  protected isOnline = true;
  protected appsScriptUrl: string | null = null;

  constructor() {
    // Try to load Apps Script URL from localStorage
    this.appsScriptUrl = localStorage.getItem('googleAppsScriptUrl');
    this.isAuthenticated = !!this.appsScriptUrl;
  }

  // Check if we're connected to a Google Sheet via Apps Script
  isConnected(): boolean {
    return this.isAuthenticated && !!this.appsScriptUrl;
  }

  async authenticate(): Promise<boolean> {
    // In this implementation, we just check if we have an Apps Script URL
    this.appsScriptUrl = localStorage.getItem('googleAppsScriptUrl');
    this.isAuthenticated = !!this.appsScriptUrl;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.isAuthenticated);
      }, 1000);
    });
  }

  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  getAppsScriptUrl(): string | null {
    return this.appsScriptUrl;
  }

  setAppsScriptUrl(url: string): void {
    this.appsScriptUrl = url;
    localStorage.setItem('googleAppsScriptUrl', url);
    this.isAuthenticated = !!url;
  }

  getConnectionStatus(): ApiConnectionStatus {
    return {
      isAuthenticated: this.isAuthenticated,
      isOnline: this.isOnline
    };
  }

  // Helper method for API requests
  protected async fetchApi(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    if (!this.appsScriptUrl) {
      throw new Error('Apps Script URL not set');
    }

    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.appsScriptUrl}${endpoint}`;

    try {
      const options: RequestInit = { method };

      if (body) {
        options.headers = {
          'Content-Type': 'application/json',
        };
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error in ${method} request to ${endpoint}:`, error);
      throw error;
    }
  }
}
