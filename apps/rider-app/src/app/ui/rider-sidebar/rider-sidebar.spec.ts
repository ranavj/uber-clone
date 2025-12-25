import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiderSidebar } from './rider-sidebar';

describe('RiderSidebar', () => {
  let component: RiderSidebar;
  let fixture: ComponentFixture<RiderSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiderSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiderSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
