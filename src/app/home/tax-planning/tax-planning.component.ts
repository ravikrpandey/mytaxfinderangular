import { Component, OnInit } from '@angular/core';
import { Router } from 'express';

@Component({
  selector: 'app-tax-planning',
  templateUrl: './tax-planning.component.html',
  styleUrls: ['./tax-planning.component.scss']
})
export class TaxPlanningComponent implements OnInit {

  activeTab: string = '';

  constructor(private router: Router) {}

// goBackToHome() {
//   this.router.navigate(['/home'], { fragment: 'services' });
// }

  ngOnInit() {
    this.activeTab = 'tab-5';  
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;  // Update the active tab based on user interaction
  }

}
