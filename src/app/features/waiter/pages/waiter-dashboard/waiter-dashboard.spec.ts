import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaiterDashboard } from './waiter-dashboard';

describe('WaiterDashboard', () => {
  let component: WaiterDashboard;
  let fixture: ComponentFixture<WaiterDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaiterDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaiterDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
