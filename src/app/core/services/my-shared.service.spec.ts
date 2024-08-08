import { TestBed } from '@angular/core/testing';

import { MySharedService } from './my-shared.service';

describe('MySharedService', () => {
  let service: MySharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MySharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
