import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideIconsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
<div class="logo-mini">J</div>
      <h1>Entrar no JVerso</h1>
          <p>Bem-vindo de volta!</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="login()" class="auth-form">
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
            @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
              <span class="field-error">
                @if (loginForm.get('email')?.hasError('required')) {
                  Email é obrigatório
                } @else if (loginForm.get('email')?.hasError('email')) {
                  Email inválido
                }
              </span>
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
                autocomplete="current-password"
              >
            </div>
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <span class="field-error">
                @if (loginForm.get('password')?.hasError('required')) {
                  Senha é obrigatória
                }
              </span>
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
            [disabled]="isLoading() || loginForm.invalid"
            [class.loading]="isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Entrando...
            } @else {
              Entrar
            }
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Não tem uma conta? <a routerLink="/register">Cadastre-se</a></p>
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
      gap: 20px;
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
        }
      }
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
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });
  isLoading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  login() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    
    const { email, password } = this.loginForm.getRawValue();
    
    this.isLoading.set(true);
    this.error.set('');

    this.authService.login(email, password).subscribe({
      next: () => {
        this.toast.success('Login realizado com sucesso!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao fazer login. Tente novamente.';
        this.error.set(msg);
        this.toast.error(msg);
        this.isLoading.set(false);
      }
    });
  }
}