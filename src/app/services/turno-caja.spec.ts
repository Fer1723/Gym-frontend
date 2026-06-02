import { TestBed } from '@angular/core/testing';

import { TurnoCaja } from './turno-caja';

describe('TurnoCaja', () => {
  let service: TurnoCaja;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TurnoCaja);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
