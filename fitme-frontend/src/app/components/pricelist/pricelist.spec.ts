import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pricelist } from './pricelist';

describe('Pricelist', () => {
  let component: Pricelist;
  let fixture: ComponentFixture<Pricelist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pricelist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pricelist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
