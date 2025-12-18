import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiMap } from './ui-map';

describe('UiMap', () => {
  let component: UiMap;
  let fixture: ComponentFixture<UiMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiMap],
    }).compileComponents();

    fixture = TestBed.createComponent(UiMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
