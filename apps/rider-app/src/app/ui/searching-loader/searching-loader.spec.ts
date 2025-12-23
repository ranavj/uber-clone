import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchingLoader } from './searching-loader';

describe('SearchingLoader', () => {
  let component: SearchingLoader;
  let fixture: ComponentFixture<SearchingLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchingLoader],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchingLoader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
