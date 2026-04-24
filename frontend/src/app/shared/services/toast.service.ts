import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
  duration: number;
  dismissible: boolean;
  exiting?: boolean;
}

interface ToastTimer {
  timeoutId: ReturnType<typeof setTimeout>;
  startTime: number;
  remaining: number;
  duration: number;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 6000,
  info: 4000,
};

const MAX_VISIBLE = 4;
const DEDUPE_WINDOW_MS = 800;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toasts: Toast[] = [];
  private timers = new Map<number, ToastTimer>();
  private lastAdded = new Map<string, number>();
  private paused = new Set<number>();

  private createKey(message: string, type: ToastType): string {
    return `${type}::${message}`;
  }

  private shouldDedupe(message: string, type: ToastType): boolean {
    const key = this.createKey(message, type);
    const last = this.lastAdded.get(key);
    if (last && Date.now() - last < DEDUPE_WINDOW_MS) {
      return true;
    }
    this.lastAdded.set(key, Date.now());
    return false;
  }

  private scheduleRemoval(id: number, delay: number) {
    const timeoutId = setTimeout(() => this.remove(id), delay);
    this.timers.set(id, { timeoutId, startTime: Date.now(), remaining: delay, duration: delay });
  }

  private add(message: string, type: ToastType, options?: { title?: string; duration?: number; dismissible?: boolean }) {
    if (this.shouldDedupe(message, type)) return;

    const id = ++this.counter;
    const duration = options?.duration ?? DEFAULT_DURATIONS[type];
    const dismissible = options?.dismissible ?? true;

    const toast: Toast = {
      id,
      message,
      type,
      title: options?.title,
      duration,
      dismissible,
    };

    this.toasts.push(toast);

    const activeToasts = this.toasts.filter(t => !t.exiting);
    if (activeToasts.length > MAX_VISIBLE) {
      const oldest = activeToasts[0];
      this.remove(oldest.id);
    }

    this.scheduleRemoval(id, duration);
  }

  success(message: string, options?: { title?: string; duration?: number; dismissible?: boolean }) {
    this.add(message, 'success', options);
  }

  error(message: string, options?: { title?: string; duration?: number; dismissible?: boolean }) {
    this.add(message, 'error', options);
  }

  warning(message: string, options?: { title?: string; duration?: number; dismissible?: boolean }) {
    this.add(message, 'warning', options);
  }

  info(message: string, options?: { title?: string; duration?: number; dismissible?: boolean }) {
    this.add(message, 'info', options);
  }

  remove(id: number) {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast || toast.exiting) return;

    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer.timeoutId);
      this.timers.delete(id);
    }
    this.paused.delete(id);

    toast.exiting = true;
    this.toasts = [...this.toasts];

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 280);
  }

  pause(id: number) {
    const timer = this.timers.get(id);
    if (!timer || this.paused.has(id)) return;

    this.paused.add(id);
    clearTimeout(timer.timeoutId);
    const elapsed = Date.now() - timer.startTime;
    timer.remaining = Math.max(0, timer.remaining - elapsed);
    this.timers.set(id, timer);
  }

  resume(id: number) {
    const timer = this.timers.get(id);
    if (!timer || !this.paused.has(id)) return;

    this.paused.delete(id);

    if (timer.remaining <= 0) {
      this.remove(id);
      return;
    }

    timer.startTime = Date.now();
    timer.timeoutId = setTimeout(() => this.remove(id), timer.remaining);
    this.timers.set(id, timer);
  }

  isPaused(id: number): boolean {
    return this.paused.has(id);
  }
}
