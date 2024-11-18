import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../../../../shared/services/common.service';

@Component({
  selector: 'app-edit-filed-queries', 
  templateUrl: './edit-filed-queries.component.html',
  styleUrls: ['./edit-filed-queries.component.scss']
})
export class EditFiledQueriesComponent implements OnInit {
  editForm!: FormGroup; 
  queryId!: number;
  queryData: any;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.queryId = this.route.snapshot.params['id'];
    this.getQueryData();

    this.editForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      serviceType: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required]],
      status: ['', [Validators.required]],
      application_status: ['', [Validators.required]],
      ref_number: ['', [Validators.required]]
    });
  }

  getQueryData(): void {
    // this.commonService.getQueryById(this.queryId).subscribe((data: any) => {
    //   if (data.success) {
    //     this.queryData = data.data;
    //     this.editForm.patchValue(this.queryData);
    //   }
    // });
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const updatedQueryData = this.editForm.value;
      // this.commonService.updateQuery(this.queryId, updatedQueryData).subscribe(response => {
      //   if (response.success) {
      //     this.router.navigate(['/queries']);
      //   }
      // });
    }
  }

  get f() {
    return this.editForm.controls;
  }
}
