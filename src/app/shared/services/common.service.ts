import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
declare module '@srexi/purecounterjs';


@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private apiUrls = {
    contactEnquiry: `${environment.apiHost}/api/v1/client-user/meta-data/contact-form/contact-enquiry`,
    enquiryForm: `${environment.apiHost}/api/v1/client-user/meta-data/contact-enquiry/enquiry-form`,
    listEnquiryForm: `${environment.apiHost}/api/v1/client-user/meta-data/contact-enquiry/list-enquiry-form`,
    checkApplicationStatus: `${environment.apiHost}/api/v1/client-user/meta-data/contact-form/check-application-status`,

  };

  constructor(private http: HttpClient) { }

  submitForm(formData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrls.contactEnquiry, formData, { headers });
  }

  enquiryForm(formData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrls.enquiryForm, formData, {headers});
  }
  checkApplicationStatus(uniqueId: string): Observable<any> {
    const url = `${this.apiUrls.checkApplicationStatus}/${uniqueId}`;
    return this.http.get(url);
  }
  litEnquiry(): Observable<any> {
    const url = `${this.apiUrls.listEnquiryForm}`;
    return this.http.get(url);
  }

}
