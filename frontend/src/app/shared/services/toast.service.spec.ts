import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    service.toasts = [];
  });

  afterEach(() => {
    service.toasts.forEach(t => service.remove(t.id));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast', () => {
    service.success('Test message');
    expect(service.toasts.length).toBe(1);
    expect(service.toasts[0].message).toBe('Test message');
    expect(service.toasts[0].type).toBe('success');
  });

  it('should remove a toast', fakeAsync(() => {
    service.success('Test');
    const id = service.toasts[0].id;
    service.remove(id);
    tick(300);
    expect(service.toasts.some(t => t.id === id)).toBeFalse();
  }));

  it('should dedupe identical messages within window', () => {
    service.error('Duplicate');
    service.error('Duplicate');
    expect(service.toasts.length).toBe(1);
  });

  it('should allow different types with same message', () => {
    service.error('Same text');
    service.success('Same text');
    expect(service.toasts.length).toBe(2);
  });

  it('should respect max visible limit', () => {
    for (let i = 0; i < 6; i++) {
      service.info(`msg ${i}`);
    }
    const active = service.toasts.filter(t => !t.exiting);
    expect(active.length).toBeLessThanOrEqual(4);
  });

  it('should pause and resume timer', () => {
    service.info('Pause test');
    const id = service.toasts[0].id;
    expect(service.isPaused(id)).toBeFalse();
    service.pause(id);
    expect(service.isPaused(id)).toBeTrue();
    service.resume(id);
    expect(service.isPaused(id)).toBeFalse();
  });

  it('should auto-remove after duration', (done) => {
    service.info('Auto remove', { duration: 100 });
    expect(service.toasts.length).toBe(1);
    setTimeout(() => {
      expect(service.toasts.length).toBe(0);
      done();
    }, 450);
  });

  it('should support title option', () => {
    service.success('Body', { title: 'Title' });
    expect(service.toasts[0].title).toBe('Title');
  });

  it('should support non-dismissible toast', () => {
    service.info('Sticky', { dismissible: false });
    expect(service.toasts[0].dismissible).toBeFalse();
  });
});
