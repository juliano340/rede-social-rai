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
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 500; animation: fadeIn 0.15s ease; }
    .edit-profile-modal { background: var(--background); border-radius: var(--radius-lg); width: 90%; max-width: 440px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
    h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .modal-close { background: none; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer; padding: 4px 8px; border-radius: var(--radius-md); }
    .modal-close:hover { background: var(--background-secondary); }
    .modal-body { padding: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group:last-child { margin-bottom: 0; }
    label { display: block; font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 6px; }
    input, textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 15px; color: var(--text-primary); background: var(--background); transition: border-color 0.15s; }
    input:focus, textarea:focus { outline: none; border-color: var(--primary); }
    input::placeholder, textarea::placeholder { color: var(--text-tertiary); }
    textarea { resize: vertical; min-height: 80px; }
    .char-hint { display: block; text-align: right; font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }
    .field-error { display: block; margin-top: 6px; color: var(--error); font-size: 12px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid var(--border); }
    .btn-cancel { background: var(--background-secondary); color: var(--text-primary); border: 1px solid var(--border); padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-cancel:hover { background: var(--border); }
    .btn-save { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-save:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
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