import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialPlanningAiComponent } from './financial-planning-ai.component';

describe('FinancialPlanningAiComponent', () => {
  let component: FinancialPlanningAiComponent;
  let fixture: ComponentFixture<FinancialPlanningAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialPlanningAiComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinancialPlanningAiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
