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
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 140px);
      padding: 20px;
    }
    
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: var(--shadow-md);
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: 28px;
      
      .logo-mini {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--primary), #0d8ecf);
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 24px;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);
      }
      
      h1 {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
      }
      
      p {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      label {
        font-weight: 500;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
      }
      
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        
        .input-icon {
          position: absolute;
          left: 14px;
          width: 20px;
          height: 20px;
          color: var(--text-tertiary);
          pointer-events: none;
        }
        
        input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
          background: var(--background);
          color: var(--text-primary);
          transition: all var(--transition-fast);
          
          &::placeholder {
            color: var(--text-tertiary);
          }
          
          &:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
          }
          
          &.ng-invalid.ng-touched {
            border-color: var(--error);
          }
        }
      }
    }
    
    .field-error {
      font-size: var(--font-size-xs);
      color: var(--error);
    }
    
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      
      .alert-icon {
        font-size: 16px;
      }
      
      &.alert-error {
        background: var(--error-light);
        border: 1px solid rgba(224, 36, 94, 0.2);
        color: var(--error);
      }
    }
    
    button {
      width: 100%;
      padding: 14px 24px;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: white;
      border: none;
      border-radius: var(--radius-full);
      font-size: var(--font-size-md);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
      transition: all var(--transition-fast);
      margin-top: 8px;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &.loading {
        background: var(--primary-hover);
      }
    }
    
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      
      p {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }
    }
  `]
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