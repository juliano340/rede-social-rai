import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { VALIDATION_LIMITS, VALIDATION_PATTERNS, VALIDATION_MESSAGES } from '../../shared/constants/validation.constants';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideIconsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-mini">J</div>
          <h1>Criar conta</h1>
          <p>Junte-se à comunidade JVerso!</p>
        </div>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="name">Nome</label>
            <div class="input-wrapper">
              <lucide-icon name="user" [size]="20" class="input-icon"></lucide-icon>
              <input 
                type="text" 
                id="name" 
                formControlName="name" 
                placeholder="Seu nome completo"
                autocomplete="name"
              >
            </div>
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <span class="field-error">{{ getNameError() }}</span>
            }
          </div>
          
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <span class="input-icon">&#64;</span>
              <input 
                type="text" 
                id="username" 
                formControlName="username" 
                placeholder="seudousername"
                autocomplete="username"
              >
            </div>
            @if (form.get('username')?.invalid && form.get('username')?.touched) {
              <span class="field-error">{{ getUsernameError() }}</span>
            }
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <lucide-icon name="mail" [size]="20" class="input-icon"></lucide-icon>
              <input 
                type="email" 
                id="email" 
                formControlName="email" 
                placeholder="seu@email.com"
                autocomplete="email"
              >
            </div>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="field-error">{{ getEmailError() }}</span>
            }
          </div>
          
          <div class="form-group">
            <label for="password">Senha</label>
            <div class="input-wrapper">
              <lucide-icon name="lock" [size]="20" class="input-icon"></lucide-icon>
              <input 
                type="password" 
                id="password" 
                formControlName="password" 
                placeholder="••••••••"
                autocomplete="new-password"
              >
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="field-error">{{ getPasswordError() }}</span>
            }
          </div>
          
          @if (error()) {
            <div class="alert alert-error" role="alert">
              <span class="alert-icon">⚠️</span>
              {{ error() }}
            </div>
          }
          
          <button 
            type="submit" 
            [disabled]="form.invalid || isLoading()"
            [class.loading]="isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Criando conta...
            } @else {
              Criar conta
            }
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Já tem uma conta? <a routerLink="/login">Entrar</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../../shared/styles/auth-forms.scss'
})
export class RegisterComponent {
  form: FormGroup;
  isLoading = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(VALIDATION_LIMITS.NAME.MAX)]],
      username: ['', [Validators.required, Validators.minLength(VALIDATION_LIMITS.USERNAME.MIN), Validators.maxLength(VALIDATION_LIMITS.USERNAME.MAX), Validators.pattern(VALIDATION_PATTERNS.USERNAME)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(VALIDATION_LIMITS.EMAIL.MAX)]],
      password: ['', [Validators.required, Validators.minLength(VALIDATION_LIMITS.PASSWORD.MIN), Validators.maxLength(VALIDATION_LIMITS.PASSWORD.MAX)]]
    });
  }

  getNameError(): string {
    const name = this.form.get('name');
    if (name?.hasError('required')) return VALIDATION_MESSAGES.REQUIRED('Nome');
    if (name?.hasError('maxlength')) return VALIDATION_LIMITS.NAME.MAX_MESSAGE;
    return '';
  }

  getUsernameError(): string {
    const username = this.form.get('username');
    if (username?.hasError('required')) return VALIDATION_MESSAGES.REQUIRED('Username');
    if (username?.hasError('minlength')) return VALIDATION_LIMITS.USERNAME.MIN_MESSAGE;
    if (username?.hasError('maxlength')) return VALIDATION_LIMITS.USERNAME.MAX_MESSAGE;
    if (username?.hasError('pattern')) return VALIDATION_MESSAGES.USERNAME_CHARS;
    return '';
  }

  getEmailError(): string {
    const email = this.form.get('email');
    if (email?.hasError('required')) return VALIDATION_MESSAGES.REQUIRED('Email');
    if (email?.hasError('email')) return VALIDATION_MESSAGES.INVALID_FORMAT('Email');
    if (email?.hasError('maxlength')) return VALIDATION_LIMITS.EMAIL.MAX_MESSAGE;
    return '';
  }

  getPasswordError(): string {
    const password = this.form.get('password');
    if (password?.hasError('required')) return VALIDATION_MESSAGES.REQUIRED('Senha');
    if (password?.hasError('minlength')) return VALIDATION_LIMITS.PASSWORD.MIN_MESSAGE;
    if (password?.hasError('maxlength')) return VALIDATION_LIMITS.PASSWORD.MAX_MESSAGE;
    return '';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Preencha todos os campos corretamente');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    const { name, username, email, password } = this.form.value;

    this.authService.register(username, email, password, name).subscribe({
      next: () => {
        this.toast.success('Conta criada com sucesso!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao criar conta. Tente novamente.';
        this.error.set(msg);
        this.toast.error(msg);
        this.isLoading.set(false);
      }
    });
  }
}