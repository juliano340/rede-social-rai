import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-mini">R</div>
          <h1>Criar conta</h1>
          <p>Junte-se à comunidade RAI!</p>
        </div>
        
        <form (ngSubmit)="register()" class="auth-form">
          <div class="form-group">
            <label for="name">Nome</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input 
                type="text" 
                id="name" 
                [(ngModel)]="name" 
                name="name"
                required
                placeholder="Seu nome completo"
                autocomplete="name"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <span class="input-icon">&#64;</span>
              <input 
                type="text" 
                id="username" 
                [(ngModel)]="username" 
                name="username"
                required
                placeholder="seudousername"
                autocomplete="username"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <span class="input-icon">📧</span>
              <input 
                type="email" 
                id="email" 
                [(ngModel)]="email" 
                name="email"
                required
                placeholder="seu@email.com"
                autocomplete="email"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">Senha</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                type="password" 
                id="password" 
                [(ngModel)]="password" 
                name="password"
                required
                minlength="6"
                placeholder="••••••••"
                autocomplete="new-password"
              >
            </div>
            <small class="hint">Mínimo 6 caracteres</small>
          </div>
          
          @if (error()) {
            <div class="alert alert-error" role="alert">
              <span class="alert-icon">⚠️</span>
              {{ error() }}
            </div>
          }
          
          <button 
            type="submit" 
            [disabled]="isLoading() || !isFormValid()"
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
          font-size: 16px;
          opacity: 0.6;
          width: 20px;
          text-align: center;
        }
        
        input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
          background: var(--background);
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
      
      .hint {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
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
  name = '';
  username = '';
  email = '';
  password = '';
  isLoading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isFormValid(): boolean {
    return this.name.trim().length > 0 &&
           this.username.trim().length > 0 &&
           this.email.trim().length > 0 &&
           this.password.length >= 6;
  }

  register() {
    if (!this.isFormValid()) return;
    
    this.isLoading.set(true);
    this.error.set('');

    this.authService.register(this.username, this.email, this.password, this.name).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erro ao criar conta. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }
}