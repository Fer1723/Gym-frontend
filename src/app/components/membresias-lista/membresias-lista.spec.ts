import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembresiasLista } from './membresias-lista';

describe('MembresiasLista', () => {
  let component: MembresiasLista;
  let fixture: ComponentFixture<MembresiasLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembresiasLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembresiasLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
