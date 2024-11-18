import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiledQueriesComponent } from './filed-queries.component';

describe('FiledQueriesComponent', () => {
  let component: FiledQueriesComponent;
  let fixture: ComponentFixture<FiledQueriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiledQueriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FiledQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
