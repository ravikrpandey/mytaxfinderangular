import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private apiUrl = `${environment.apiHost}/api/v1/client-user/meta-data/contact-form/contact-enquiry`;

  constructor(private http: HttpClient) { }

  // Method to submit the form
  submitForm(formData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrl, formData, { headers });
  }
}
