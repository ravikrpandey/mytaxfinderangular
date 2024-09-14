import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private apiUrls = {
    contactEnquiry: `${environment.apiHost}/api/v1/client-user/meta-data/contact-form/contact-enquiry`,
    enquiryForm: `${environment.apiHost}/api/v1/client-user/meta-data/contact-enquiry`

  };

  constructor(private http: HttpClient) { }

  submitForm(formData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrls.contactEnquiry, formData, { headers });
  }

  // Example method for another endpoint
  enquiryForm(formData: any): Observable<any> {
    return this.http.get(this.apiUrls.enquiryForm, formData);
  }
}
