import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SociosForm } from './socios-form';

describe('SociosForm', () => {
  let component: SociosForm;
  let fixture: ComponentFixture<SociosForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SociosForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SociosForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
