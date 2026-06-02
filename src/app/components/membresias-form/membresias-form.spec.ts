import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembresiasForm } from './membresias-form';

describe('MembresiasForm', () => {
  let component: MembresiasForm;
  let fixture: ComponentFixture<MembresiasForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembresiasForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembresiasForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
