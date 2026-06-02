import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SociosLista } from './socios-lista';

describe('SociosLista', () => {
  let component: SociosLista;
  let fixture: ComponentFixture<SociosLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SociosLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SociosLista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
