import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketClient } from './socket-client';

describe('SocketClient', () => {
  let component: SocketClient;
  let fixture: ComponentFixture<SocketClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocketClient],
    }).compileComponents();

    fixture = TestBed.createComponent(SocketClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
