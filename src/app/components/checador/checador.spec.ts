import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Checador } from './checador';

describe('Checador', () => {
  let component: Checador;
  let fixture: ComponentFixture<Checador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Checador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
