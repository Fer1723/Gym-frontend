import { TestBed } from '@angular/core/testing';

import { Membresia } from './membresia';

describe('Membresia', () => {
  let service: Membresia;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Membresia);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
