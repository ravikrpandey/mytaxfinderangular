import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxByRegionComponent } from './tax-by-region.component';

describe('TaxByRegionComponent', () => {
  let component: TaxByRegionComponent;
  let fixture: ComponentFixture<TaxByRegionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxByRegionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxByRegionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
