import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toasts: Toast[] = [];

  private add(message: string, type: ToastType) {
    const id = ++this.counter;
    this.toasts.push({ id, message, type });
    if (this.toasts.length > 3) {
      this.toasts.shift();
    }
    setTimeout(() => this.remove(id), 3000);
  }

  success(message: string) { this.add(message, 'success'); }
  error(message: string) { this.add(message, 'error'); }
  warning(message: string) { this.add(message, 'warning'); }
  info(message: string) { this.add(message, 'info'); }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}