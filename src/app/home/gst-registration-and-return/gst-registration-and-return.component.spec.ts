import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GstRegistrationAndReturnComponent } from './gst-registration-and-return.component';

describe('GstRegistrationAndReturnComponent', () => {
  let component: GstRegistrationAndReturnComponent;
  let fixture: ComponentFixture<GstRegistrationAndReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GstRegistrationAndReturnComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GstRegistrationAndReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
