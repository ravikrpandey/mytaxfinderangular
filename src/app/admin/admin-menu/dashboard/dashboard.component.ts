import { Component, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    this.createBarChart();
    this.createPieChart();
  }

  createBarChart(): void {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [{
          label: 'Sales',
          data: [120, 150, 180, 220, 200],
          backgroundColor: '#163865'
        }]
      },
      options: { responsive: true }
    });
  }

  createPieChart(): void {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['New', 'In Progress', 'Closed'],
        datasets: [{
          label: 'Lead Status',
          data: [50, 30, 20],
          backgroundColor: ['#1b3a6f', '#e6982d', '#37a47c']
        }]
      },
      options: { responsive: true }
    });
  }
}
