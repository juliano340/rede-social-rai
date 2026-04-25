import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="textarea-wrapper">
      @if (label) {
        <label [for]="id" class="textarea__label">
          {{ label }}
          @if (required) {
            <span class="textarea__required">*</span>
          }
        </label>
      }
      
      <div class="textarea__container" [class.textarea__container--focused]="isFocused">
        <textarea
          [id]="id"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [rows]="rows"
          [maxlength]="maxlength"
          [class]="textareaClasses"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        ></textarea>
        
        @if (maxlength) {
          <span class="textarea__counter" [class.textarea__counter--warning]="charCountWarning">
            {{ value?.length || 0 }}/{{ maxlength }}
          </span>
        }
      </div>
      
      @if (hint || error) {
        <p class="textarea__hint" [class.textarea__hint--error]="error">
          {{ error || hint }}
        </p>
      }
    </div>
  `,
  styles: [`
    .textarea-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      width: 100%;
    }
    
    .textarea__label {
      font-size: var(--font-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    
    .textarea__required {
      color: var(--error);
    }
    
    .textarea__container {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-md);
      border: 2px solid var(--border);
      background: var(--background-secondary);
      transition: border-color var(--duration-150) var(--ease-out),
                  box-shadow var(--duration-150) var(--ease-out);
      
      &:has(textarea:focus) {
        border-color: var(--border-focus);
        box-shadow: 0 0 0 3px var(--primary-light);
      }
      
      &:has(textarea:disabled) {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &:has(textarea[readonly]) {
        background: var(--background-tertiary);
      }
    }
    
    .textarea {
      flex: 1;
      width: 100%;
      min-width: 0;
      border: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--font-base);
      color: var(--text-primary);
      resize: vertical;
      padding: var(--space-3);
      line-height: var(--leading-normal);
      
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
    
    .textarea__counter {
      align-self: flex-end;
      font-size: var(--font-xs);
      color: var(--text-tertiary);
      padding: var(--space-1) var(--space-2);
      
      &--warning {
        color: var(--warning);
      }
    }
    
    .textarea__hint {
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
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() id = `textarea-${Math.random().toString(36).slice(2, 9)}`;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() rows = 4;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() maxlength?: number;
  
  @Output() onClear = new EventEmitter<void>();
  
  value: string = '';
  isFocused = false;
  
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  
  get textareaClasses(): string {
    return 'textarea';
  }
  
  get charCountWarning(): boolean {
    if (!this.maxlength || !this.value) return false;
    return this.value.length / this.maxlength > 0.8;
  }
  
  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }
  
  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }
  
  onFocus(): void {
    this.isFocused = true;
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
