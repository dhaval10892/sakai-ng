import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitchenBoard } from './kitchen-board';

describe('KitchenBoard', () => {
  let component: KitchenBoard;
  let fixture: ComponentFixture<KitchenBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KitchenBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
