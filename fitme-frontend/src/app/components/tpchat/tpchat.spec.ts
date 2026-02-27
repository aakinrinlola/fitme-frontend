import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tpchat } from './tpchat';

describe('Tpchat', () => {
  let component: Tpchat;
  let fixture: ComponentFixture<Tpchat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tpchat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tpchat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
