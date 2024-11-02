import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tax-planning',
  templateUrl: './tax-planning.component.html',
  styleUrls: ['./tax-planning.component.scss']
})
export class TaxPlanningComponent implements OnInit {

  activeTab: string = '';

  constructor() { }

  ngOnInit() {
    this.activeTab = 'tab-5';  // Set 'Tax Planning' as the default active tab on load
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;  // Update the active tab based on user interaction
  }

}
