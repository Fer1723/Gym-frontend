import { TestBed } from '@angular/core/testing';

import { Suscripcion } from './suscripcion';

describe('Suscripcion', () => {
  let service: Suscripcion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Suscripcion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
