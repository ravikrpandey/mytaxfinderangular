import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // This makes the service available throughout the application
})
export class SharedService {
  private queryData: any = null; // Store the shared data

  constructor() {}

  // Method to set data
  setQueryData(data: any): void {
    this.queryData = data;
  }

  // Method to get data
  getQueryData(): any {
    return this.queryData;
  }

  // Method to clear data (optional)
  clearQueryData(): void {
    this.queryData = null;
  }
}
