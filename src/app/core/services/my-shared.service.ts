import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = 'https://your-api-endpoint.com/contact';

  constructor(private http: HttpClient) {}

  postContactForm(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
