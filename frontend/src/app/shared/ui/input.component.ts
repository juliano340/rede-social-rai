import { Component, Input, Output, EventEmitter, HostBinding, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="input-wrapper">
      @if (label) {
        <label [for]="id" class="input__label">
          {{ label }}
          @if (required) {
            <span class="input__required">*</span>
          }
        </label>
      }
      
      <div class="input__container" [class]="inputContainerClasses">
        @if (iconLeft) {
          <span class="input__icon input__icon--left">
            <ng-content select="[icon-left]"></ng-content>
          </span>
        }
        
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [autocomplete]="autocomplete"
          [class]="inputClasses"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus.emit($event)"
        />
        
        @if (iconRight || clearable) {
          <span class="input__icon input__icon--right">
            @if (clearable && value) {
              <button
                type="button"
                class="input__clear"
                (click)="clear()"
                aria-label="Clear"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            } @else {
              <ng-content select="[icon-right]"></ng-content>
            }
          </span>
        }
      </div>
      
      @if (hint || error) {
        <p class="input__hint" [class.input__hint--error]="error">
          {{ error || hint }}
        </p>
      }
    </div>
  `,
  styles: [`
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      width: 100%;
    }
    
    .input__label {
      font-size: var(--font-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    
    .input__required {
      color: var(--error);
    }
    
    .input__container {
      display: flex;
      align-items: center;
      border-radius: var(--radius-md);
      border: 2px solid var(--border);
      background: var(--background-secondary);
      transition: border-color var(--duration-150) var(--ease-out),
                  box-shadow var(--duration-150) var(--ease-out);
      
      &:has(input:focus) {
        border-color: var(--border-focus);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
      
      &:has(input:disabled) {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &:has(input[readonly]) {
        background: var(--background-tertiary);
      }
    }
    
    .input__container--sm {
      height: 32px;
      padding: 0 var(--space-2);
    }
    
    .input__container--md {
      height: 40px;
      padding: 0 var(--space-3);
    }
    
    .input__container--lg {
      height: 48px;
      padding: 0 var(--space-4);
    }
    
    .input__container--with-icon-left {
      padding-left: var(--space-2);
    }
    
    .input__container--with-icon-right {
      padding-right: var(--space-2);
    }
    
    .input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--font-base);
      color: var(--text-primary);
      
      &::placeholder {
        color: var(--text-tertiary);
      }
      
      &:focus {
        outline: none;
      }
      
      &:disabled {
        cursor: not-allowed;
      }
    }
    
    .input--sm {
      height: 28px;
      font-size: var(--font-sm);
    }
    
    .input--md {
      height: 36px;
      font-size: var(--font-base);
    }
    
    .input--lg {
      height: 44px;
      font-size: var(--font-lg);
    }
    
    .input__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      flex-shrink: 0;
      
      &--left {
        margin-right: var(--space-2);
      }
      
      &--right {
        margin-left: var(--space-2);
      }
    }
    
    .input__clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      margin: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: background var(--duration-150) var(--ease-out),
                  color var(--duration-150) var(--ease-out);
      
      &:hover {
        background: var(--background-tertiary);
        color: var(--text-primary);
      }
      
      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }
    
    .input__hint {
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      margin: 0;
      
      &--error {
        color: var(--error);
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).slice(2, 9)}`;
  @Input() type = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() size: InputSize = 'md';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() autocomplete = 'off';
  @Input() iconLeft = false;
  @Input() iconRight = false;
  @Input() clearable = false;
  
  @Output() onFocus = new EventEmitter<FocusEvent>();
  @Output() onClear = new EventEmitter<void>();
  
  value: string = '';
  
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  
  get inputClasses(): string {
    return `input input--${this.size}`;
  }
  
  get inputContainerClasses(): string {
    const classes = [`input__container`, `input__container--${this.size}`];
    if (this.iconLeft) classes.push('input__container--with-icon-left');
    if (this.iconRight || this.clearable) classes.push('input__container--with-icon-right');
    return classes.join(' ');
  }
  
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }
  
  onBlur(): void {
    this.onTouched();
  }
  
  clear(): void {
    this.value = '';
    this.onChange('');
    this.onClear.emit();
  }
  
  writeValue(value: string): void {
    this.value = value ?? '';
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
