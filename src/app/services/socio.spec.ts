import { TestBed } from '@angular/core/testing';

import { Socio } from './socio';

describe('Socio', () => {
  let service: Socio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Socio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
