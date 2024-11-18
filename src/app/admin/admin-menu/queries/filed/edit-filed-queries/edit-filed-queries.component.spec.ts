import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFiledQueriesComponent } from './edit-filed-queries.component';

describe('EditFiledQueriesComponent', () => {
  let component: EditFiledQueriesComponent;
  let fixture: ComponentFixture<EditFiledQueriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFiledQueriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditFiledQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
