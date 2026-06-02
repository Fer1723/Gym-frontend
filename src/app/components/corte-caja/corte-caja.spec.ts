import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorteCaja } from './corte-caja';

describe('CorteCaja', () => {
  let component: CorteCaja;
  let fixture: ComponentFixture<CorteCaja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorteCaja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CorteCaja);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
