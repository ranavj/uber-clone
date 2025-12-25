import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiSidebar } from './ui-sidebar';

describe('UiSidebar', () => {
  let component: UiSidebar;
  let fixture: ComponentFixture<UiSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
