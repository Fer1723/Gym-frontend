import { TestBed } from '@angular/core/testing';

import { Caja } from './caja';

describe('Caja', () => {
  let service: Caja;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Caja);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
