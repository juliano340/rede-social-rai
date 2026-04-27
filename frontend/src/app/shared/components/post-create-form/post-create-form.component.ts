import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { isValidImageUrl, normalizeUrl } from '../../utils/media.utils';

@Component({
  selector: 'app-post-create-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="new-post">
      <textarea
        [(ngModel)]="content"
        placeholder="O que está acontecendo?"
        maxlength="280"
        [disabled]="isSubmitting"
        aria-label="O que está acontecendo?"
      ></textarea>

      @if (showMediaInput()) {
        <div class="media-input">
          <div class="media-type-selector">
            <button
              [class.active]="mediaType() === 'image'"
              (click)="setMediaType('image')"
            >
              <lucide-icon name="image" [size]="16"></lucide-icon> Imagem
            </button>
            <button
              [class.active]="mediaType() === 'youtube'"
              (click)="setMediaType('youtube')"
            >
              <lucide-icon name="youtube" [size]="16"></lucide-icon> YouTube
            </button>
            <button
              [class.active]="linkUrl() !== null"
              (click)="toggleLink()"
            >
              <lucide-icon name="link" [size]="16"></lucide-icon> Link
            </button>
          </div>
          @if (mediaType()) {
            <input
              type="text"
              [(ngModel)]="mediaUrl"
              [placeholder]="mediaType() === 'image' ? 'URL da imagem (jpg, png, gif, webp)' : 'URL do vídeo do YouTube'"
              class="media-url-input"
            />
            @if (mediaUrl) {
              <div class="media-preview-container">
                @if (mediaType() === 'image' && isValidImageUrl(mediaUrl)) {
                  <img [src]="mediaUrl" alt="Preview" class="media-preview" />
                }
                @if (mediaType() === 'youtube') {
                  <iframe [src]="getYouTubeEmbed(mediaUrl)" frameborder="0" allowfullscreen class="media-preview-video" loading="lazy"></iframe>
                }
              </div>
            }
          }
          @if (linkUrl() !== null) {
            <input
              type="text"
              [ngModel]="linkUrl()"
              (ngModelChange)="linkUrl.set($event)"
              placeholder="URL do link"
              class="media-url-input"
            />
          }
        </div>
      } @else {
        <button class="add-media-btn" (click)="showMediaInput.set(true)">
          <lucide-icon name="image" [size]="16"></lucide-icon> Adicionar mídia
        </button>
      }

      <div class="new-post-footer">
        <span
          class="char-count"
          [class.warning]="content.length > 260"
          [class.danger]="content.length >= 280"
        >
          {{ content.length }}/280
        </span>
        <button class="publish-btn" (click)="onSubmit()" [disabled]="!canSubmit()" [class.loading]="isSubmitting">
          @if (isSubmitting) {
            <span class="spinner"></span>
            Publicando...
          } @else {
            Publicar
          }
        </button>
      </div>
      @if (error) {
        <div class="submit-error" role="alert">
          {{ error }}
        </div>
      }
      @if (success) {
        <div class="submit-success" role="status">
          Post publicado com sucesso!
        </div>
      }
    </div>
  `,
  styles: [`
    .new-post {
      background: var(--surface-composer);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: 0;
      box-shadow: var(--shadow-xs);
      transition: background var(--duration-150) var(--ease-out),
                  border-color var(--duration-150) var(--ease-out),
                  box-shadow var(--duration-150) var(--ease-out);

      &:focus-within {
        background: var(--surface-composer);
        border-color: var(--border-strong);
        box-shadow: var(--shadow-sm);
      }

      textarea {
        width: 100%;
        border: none;
        resize: none;
        font-size: var(--font-lg);
        min-height: 80px;
        outline: none;
        color: var(--text-primary);
        background: transparent;
        transition: opacity var(--duration-150) var(--ease-out);

        &::placeholder {
          color: var(--text-tertiary);
        }

        &:disabled {
          opacity: 0.5;
        }
      }
    }

    .add-media-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background: var(--background-tertiary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: var(--font-sm);
      font-weight: var(--font-medium);
      cursor: pointer;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-full);
      transition: all var(--duration-150) var(--ease-out);

      &:hover {
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary);
      }

      &:focus-visible {
        outline: 2px solid var(--border-focus);
        outline-offset: 2px;
      }
    }

    .media-input {
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: var(--background-tertiary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);

      .media-type-selector {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-3);

        button {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          background: var(--background-secondary);
          color: var(--text-secondary);
          font-size: var(--font-sm);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all var(--duration-150) var(--ease-out);

          &.active {
            background: var(--primary);
            color: var(--text-inverse);
            border-color: var(--primary);
            box-shadow: var(--shadow-sm);
          }

          &:hover:not(.active) {
            background: var(--background-hover);
            color: var(--text-primary);
            border-color: var(--border-hover);
          }

          &:focus-visible {
            outline: 2px solid var(--border-focus);
            outline-offset: 2px;
          }
        }
      }

      .media-url-input {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        font-size: var(--font-sm);
        color: var(--text-primary);
        background: var(--background-secondary);
        transition: border-color var(--duration-150) var(--ease-out),
                    box-shadow var(--duration-150) var(--ease-out);

        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        &::placeholder {
          color: var(--text-tertiary);
        }
      }

      .media-preview-container {
        margin-top: var(--space-3);
        border-radius: var(--radius-lg);
        overflow: hidden;

        .media-preview {
          max-width: 100%;
          max-height: 200px;
          border-radius: var(--radius-md);
          object-fit: contain;
          box-shadow: var(--shadow-md);
        }

        .media-preview-video {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: var(--radius-md);
          border: none;
          box-shadow: var(--shadow-md);
        }
      }
    }

    .new-post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-subtle);
      padding-top: var(--space-3);
      margin-top: var(--space-3);

      .char-count {
        font-size: var(--font-xs);
        font-weight: var(--font-medium);
        color: var(--text-tertiary);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        background: var(--background-tertiary);
        transition: color var(--duration-150) var(--ease-out),
                    background var(--duration-150) var(--ease-out);

        &.warning {
          color: var(--warning);
          background: var(--warning-light);
        }

        &.danger {
          color: var(--error);
          background: var(--error-light);
        }
      }

      .publish-btn {
        background: var(--primary);
        color: var(--text-inverse);
        border: none;
        padding: var(--space-2) var(--space-5);
        border-radius: var(--radius-full);
        font-weight: var(--font-semibold);
        font-size: var(--font-sm);
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        transition: background var(--duration-150) var(--ease-out),
                    transform var(--duration-100) var(--ease-out),
                    box-shadow var(--duration-150) var(--ease-out);

        &:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        &:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }

        &.loading {
          background: var(--primary-hover);
        }

        [data-theme="dark"] & {
          color: #0f172a;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;

          [data-theme="dark"] & {
            border-color: rgba(15, 23, 42, 0.3);
            border-top-color: #0f172a;
          }
        }
      }
    }

    .submit-error {
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: var(--error-light);
      border: 1px solid var(--error-lighter);
      border-radius: var(--radius-md);
      color: var(--error);
      font-size: var(--font-sm);
    }

    .submit-success {
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: var(--success-light);
      border: 1px solid var(--success-lighter);
      border-radius: var(--radius-md);
      color: var(--success);
      font-size: var(--font-sm);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .publish-btn:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class PostCreateFormComponent {
  @Input() isSubmitting = false;
  @Input() error: string | null = null;
  @Input() success = false;

  @Output() submit = new EventEmitter<{
    content: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'youtube' | null;
    linkUrl: string | null;
  }>();

  content = '';
  mediaUrl = '';
  mediaType = signal<'image' | 'youtube' | null>(null);
  linkUrl = signal<string | null>(null);
  showMediaInput = signal(false);

  isValidImageUrl = isValidImageUrl;

  constructor(private sanitizer: DomSanitizer) {}

  getYouTubeEmbed(url: string): SafeResourceUrl | null {
    if (!url) return null;
    const match = url.match(/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (!match) return null;
    const embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  canSubmit(): boolean {
    return this.content.trim().length > 0 &&
           this.content.length <= 280 &&
           !this.isSubmitting;
  }

  setMediaType(type: 'image' | 'youtube') {
    if (this.mediaType() === type) {
      this.mediaType.set(null);
      this.mediaUrl = '';
    } else {
      this.mediaType.set(type);
      this.mediaUrl = '';
    }
  }

  toggleLink() {
    if (this.linkUrl() !== null) {
      this.linkUrl.set(null);
    } else {
      this.linkUrl.set('');
    }
  }

  onSubmit() {
    if (!this.canSubmit()) return;

    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'youtube' | null = null;
    let linkUrl: string | null = null;

    if (this.mediaType()) {
      mediaUrl = this.mediaUrl || null;
      mediaType = this.mediaType();
    }

    if (this.linkUrl()) {
      linkUrl = normalizeUrl(this.linkUrl() || '');
    }

    this.submit.emit({
      content: this.content,
      mediaUrl,
      mediaType,
      linkUrl
    });

    this.reset();
  }

  reset() {
    this.content = '';
    this.mediaUrl = '';
    this.mediaType.set(null);
    this.linkUrl.set(null);
    this.showMediaInput.set(false);
  }
}
