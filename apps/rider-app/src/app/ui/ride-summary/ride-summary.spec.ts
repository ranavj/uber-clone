import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RideSummary } from './ride-summary';

describe('RideSummary', () => {
  let component: RideSummary;
  let fixture: ComponentFixture<RideSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(RideSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
