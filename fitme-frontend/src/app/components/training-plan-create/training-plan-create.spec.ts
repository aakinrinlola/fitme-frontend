import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingPlanCreate } from './training-plan-create';

describe('TrainingPlanCreate', () => {
  let component: TrainingPlanCreate;
  let fixture: ComponentFixture<TrainingPlanCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingPlanCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingPlanCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
