import { TestBed } from '@angular/core/testing';

import { MarkerAnimation } from './marker-animation';

describe('MarkerAnimation', () => {
  let service: MarkerAnimation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarkerAnimation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
