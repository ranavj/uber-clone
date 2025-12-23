import { TestBed } from '@angular/core/testing';

import { MapUtils } from './map-utils';

describe('MapUtils', () => {
  let service: MapUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
