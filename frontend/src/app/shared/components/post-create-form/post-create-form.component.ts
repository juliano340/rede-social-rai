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
        <button
          (click)="onSubmit()"
          [disabled]="!canSubmit()"
          [class.loading]="isSubmitting"
        >
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
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
      transition: box-shadow 0.2s, border-color 0.2s;

      &:focus-within {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.2);
      }

      textarea {
        width: 100%;
        border: none;
        resize: none;
        font-size: 18px;
        min-height: 80px;
        outline: none;
        color: var(--text-primary);
        background: var(--background);
        transition: opacity 0.2s;

        &::placeholder {
          color: var(--text-tertiary);
        }

        &:disabled {
          opacity: 0.6;
        }
      }
    }

    .add-media-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 14px;
      cursor: pointer;
      padding: 8px 0;

      &:hover {
        color: var(--primary);
      }
    }

    .media-input {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-tertiary);
      border-radius: 8px;
    }

    .media-type-selector {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: 1px solid var(--border);
        border-radius: 20px;
        background: var(--background);
        color: var(--text-secondary);
        font-size: 13px;
        cursor: pointer;

        &.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        &:hover:not(.active) {
          background: var(--background-secondary);
        }
      }
    }

    .media-url-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      color: var(--text-primary);
      background: var(--background);

      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }

    .media-preview-container {
      margin-top: 8px;

      .media-preview {
        max-width: 100%;
        max-height: 200px;
        border-radius: 8px;
        object-fit: contain;
      }

      .media-preview-video {
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 8px;
        border: none;
      }
    }

    .new-post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
      padding-top: 12px;

      .char-count {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;

        &.warning {
          color: #f59e0b;
        }

        &.danger {
          color: var(--error);
        }
      }

      button {
        background: var(--primary);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s, transform 0.1s, opacity 0.2s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }

        &.loading {
          background: var(--primary-hover);
        }
      }
    }

    .submit-error {
      margin-top: 12px;
      padding: 10px 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: var(--error);
      font-size: 14px;
    }

    .submit-success {
      margin-top: 12px;
      padding: 10px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      color: var(--success);
      font-size: 14px;
      animation: fadeIn 0.3s ease;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
