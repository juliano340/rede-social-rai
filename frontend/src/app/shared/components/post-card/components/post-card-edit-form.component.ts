import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../icons/lucide-icons.module';
import { Post } from '../../../models/post.model';
import { normalizeUrl } from '../../../utils/media.utils';

@Component({
  selector: 'app-post-card-edit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="edit-post-form">
      <textarea
        [(ngModel)]="editContent"
        maxlength="280"
        class="edit-post-textarea"
      ></textarea>
      <div class="media-type-selector">
        <button
          [class.active]="editMediaType() === 'image'"
          (click)="setEditMediaType('image')"
        >
          <lucide-icon name="image" [size]="14"></lucide-icon> Imagem
        </button>
        <button
          [class.active]="editMediaType() === 'youtube'"
          (click)="setEditMediaType('youtube')"
        >
          <lucide-icon name="youtube" [size]="14"></lucide-icon> YouTube
        </button>
        <button
          [class.active]="editLinkUrl() !== null"
          (click)="toggleEditLink()"
        >
          <lucide-icon name="link" [size]="14"></lucide-icon> Link
        </button>
      </div>
      @if (editMediaType()) {
        <div class="media-edit-row">
          <input
            type="text"
            [(ngModel)]="editMediaUrl"
            [placeholder]="editMediaType() === 'image' ? 'URL da imagem' : 'URL do YouTube'"
            class="media-url-input"
          />
          <button type="button" class="clear-link-btn" (click)="clearEditMedia()" title="Remover mídia">
            <lucide-icon name="x" [size]="14"></lucide-icon>
          </button>
        </div>
      }
      @if (editLinkUrl() !== null) {
        <div class="media-edit-row">
          <input
            type="text"
            [ngModel]="editLinkUrl()"
            (ngModelChange)="editLinkUrl.set($event)"
            placeholder="URL do link"
            class="media-url-input"
          />
          <button type="button" class="clear-link-btn" (click)="editLinkUrl.set(null)" title="Remover link">
            <lucide-icon name="x" [size]="14"></lucide-icon>
          </button>
        </div>
      }
      <div class="edit-post-actions">
        <span class="char-count">{{ editContent.length }}/280</span>
        <button class="cancel-btn" (click)="onCancel()">Cancelar</button>
        <button
          class="save-btn"
          (click)="onSave()"
          [disabled]="!editContent.trim() || editContent.length > 280"
        >
          Salvar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .edit-post-form { margin-top: 12px; padding: 12px; background: var(--background-secondary); border-radius: var(--radius-md); }
    .edit-post-textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px; font-size: 14px; resize: none; min-height: 60px; color: var(--text-primary); background: var(--background); }
    .edit-post-textarea:focus { outline: none; border-color: var(--primary); }
    .media-type-selector { display: flex; gap: 8px; margin: 8px 0; }
    .media-type-selector button { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--border); border-radius: 20px; background: var(--background); color: var(--text-secondary); font-size: 13px; cursor: pointer; }
    .media-type-selector button.active { background: var(--primary); color: white; border-color: var(--primary); }
    .media-type-selector button:hover:not(.active) { background: var(--background-secondary); }
    .media-edit-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .media-url-input { flex: 1; width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text-primary); background: var(--background); }
    .media-url-input:focus { outline: none; border-color: var(--primary); }
    .clear-link-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: 8px; background: var(--background-secondary); color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
    .clear-link-btn:hover { background: var(--error); color: white; }
    .edit-post-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 8px; }
    .char-count { margin-right: auto; font-size: 12px; color: var(--text-tertiary); }
    .cancel-btn { background: none; border: 1px solid var(--border); padding: 6px 12px; border-radius: var(--radius-full); font-size: 14px; cursor: pointer; color: var(--text-primary); }
    .cancel-btn:hover { background: var(--background-secondary); }
    .save-btn { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: var(--radius-full); font-size: 14px; font-weight: 500; cursor: pointer; }
    .save-btn:hover:not(:disabled) { background: var(--primary-hover); }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class PostCardEditFormComponent implements OnInit {
  post = input.required<Post>();

  save = output<{ postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }>();
  cancel = output<void>();

  editContent = '';
  editMediaUrl = '';
  editMediaType = signal<'image' | 'youtube' | null>(null);
  editLinkUrl = signal<string | null>(null);

  ngOnInit() {
    this.reset();
  }

  reset() {
    this.editContent = this.post().content;
    this.editMediaUrl = this.post().mediaUrl || '';
    this.editMediaType.set(this.post().mediaType as 'image' | 'youtube' | null);
    this.editLinkUrl.set(this.post().linkUrl || null);
  }

  setEditMediaType(type: 'image' | 'youtube') {
    if (this.editMediaType() === type) {
      this.editMediaType.set(null);
      this.editMediaUrl = '';
    } else {
      this.editMediaType.set(type);
      this.editMediaUrl = '';
    }
  }

  clearEditMedia() {
    this.editMediaType.set(null);
    this.editMediaUrl = '';
  }

  toggleEditLink() {
    if (this.editLinkUrl() !== null) {
      this.editLinkUrl.set(null);
    } else {
      this.editLinkUrl.set('');
    }
  }

  onSave() {
    if (!this.editContent.trim()) return;

    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'youtube' | null = null;

    if (this.editMediaType() && this.editMediaUrl) {
      mediaUrl = this.editMediaUrl;
      mediaType = this.editMediaType();
    }

    let linkUrl: string | null = normalizeUrl(this.editLinkUrl() || '');

    this.save.emit({
      postId: this.post().id,
      content: this.editContent,
      mediaUrl,
      mediaType,
      linkUrl
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
