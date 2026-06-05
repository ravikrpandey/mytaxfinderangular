import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeQueriesComponent } from './home-queries.component';

describe('HomeQueriesComponent', () => {
  let component: HomeQueriesComponent;
  let fixture: ComponentFixture<HomeQueriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeQueriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
