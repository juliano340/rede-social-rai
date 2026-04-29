import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../shared/icons/lucide-icons.module';
import { UserProfile } from '../../../shared/models/user.model';
import { VALIDATION_LIMITS } from '../../../shared/constants/validation.constants';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideIconsModule],
  template: `
    @if (show()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="edit-profile-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Editar perfil</h2>
            <button class="modal-close" (click)="close.emit()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form">
              <div class="form-group">
                <label for="edit-name">Nome</label>
                <input id="edit-name" type="text" formControlName="name" placeholder="Seu nome" maxlength="50" />
                <span class="char-hint">{{ form.get('name')?.value?.length || 0 }}/50</span>
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <span class="field-error">Nome é obrigatório</span>
                }
              </div>
              <div class="form-group">
                <label for="edit-bio">Bio</label>
                <textarea id="edit-bio" formControlName="bio" placeholder="Conte sobre você..." maxlength="160" rows="3"></textarea>
                <span class="char-hint">{{ form.get('bio')?.value?.length || 0 }}/160</span>
              </div>
              <div class="form-group">
                <label for="edit-bio-link">Link da bio</label>
                <input id="edit-bio-link" type="text" formControlName="bioLink" placeholder="seusite.com ou https://seusite.com" maxlength="200" />
                <span class="char-hint">{{ form.get('bioLink')?.value?.length || 0 }}/200</span>
                @if (bioLinkError()) {
                  <span class="field-error">{{ bioLinkError() }}</span>
                }
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="close.emit()">Cancelar</button>
            <button class="btn-save" (click)="onSave()" [disabled]="form.invalid || saving()">
              @if (saving()) { Salvando... } @else { Salvar }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 500; animation: fadeIn 0.15s ease; padding: 16px;
    }
    .edit-profile-modal {
      background: var(--popover);
      border-radius: var(--radius-xl);
      width: min(100%, 440px); max-height: calc(100vh - 32px);
      overflow-y: auto;
      box-shadow: var(--shadow-2xl);
      border: 1px solid var(--border);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid var(--border);
    }
    h2 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
    .modal-close {
      background: none; border: none; font-size: 22px; color: var(--text-tertiary);
      cursor: pointer; padding: 6px; border-radius: var(--radius-md); line-height: 1;
      transition: all 0.15s;
    }
    .modal-close:hover { background: var(--accent); color: var(--text-primary); }
    .modal-body { padding: 22px; }
    .form-group { margin-bottom: 18px; }
    .form-group:last-child { margin-bottom: 0; }
    label {
      display: block; font-size: 13px; font-weight: 600;
      color: var(--text-primary); margin-bottom: 7px;
    }
    input, textarea {
      width: 100%;
      border: 1px solid var(--border-strong); border-radius: var(--radius-md);
      padding: 11px 13px; font-size: 14px; color: var(--text-primary);
      background: var(--surface-input);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus, textarea:focus {
      outline: none; border-color: var(--ring);
      box-shadow: 0 0 0 3px var(--primary-light);
    }
    input::placeholder, textarea::placeholder { color: var(--text-muted); }
    textarea { resize: vertical; min-height: 90px; }
    .char-hint {
      display: block; text-align: right;
      font-size: 12px; font-weight: 500;
      color: var(--text-muted); margin-top: 5px;
    }
    .field-error { display: block; margin-top: 6px; color: var(--error); font-size: 12px; font-weight: 500; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 18px 22px 20px;
      border-top: 1px solid var(--border);
    }
    .btn-cancel {
      background: var(--accent); color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      padding: 9px 22px; border-radius: var(--radius-full);
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.15s;
    }
    .btn-cancel:hover { background: var(--muted); border-color: var(--border-strong); }
    .btn-save {
      background: var(--primary); color: var(--text-inverse);
      border: none; padding: 9px 22px; border-radius: var(--radius-full);
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.15s;
    }
    .btn-save:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-cancel:focus-visible, .btn-save:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class EditProfileModalComponent {
  show = input.required<boolean>();
  profile = input.required<UserProfile | null>();
  saving = input.required<boolean>();
  bioLinkError = input.required<string>();

  save = output<{ name: string; bio: string; bioLink: string }>();
  close = output<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      bio: ['', Validators.maxLength(160)],
      bioLink: ['', Validators.maxLength(200)],
    });

    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.form.patchValue({
          name: profile.name || '',
          bio: profile.bio || '',
          bioLink: profile.bioLink || '',
        });
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value);
  }
}