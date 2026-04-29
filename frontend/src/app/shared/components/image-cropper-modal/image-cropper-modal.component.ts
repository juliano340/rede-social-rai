import { Component, input, output, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import Cropper from 'cropperjs';

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show()) {
      <div class="cropper-overlay" (click)="cancel.emit()">
        <div class="cropper-modal" (click)="$event.stopPropagation()">
          <div class="cropper-header">
            <div>
              <h2>Ajustar foto</h2>
              <p>Arraste a imagem para centralizar seu avatar.</p>
            </div>
            <button class="cropper-close" (click)="cancel.emit()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="cropper-body">
            @if (loadError()) {
              <div class="cropper-error">
                Não foi possível carregar esta imagem. Tente uma foto em JPG, PNG ou WebP.
              </div>
            } @else if (imageSrc()) {
              <div class="image-container" #imageContainer>
                <img #image [src]="imageSrc()" alt="Preview" (load)="onImageLoad($event)" (error)="onImageError()" />
              </div>
            } @else {
              <div class="cropper-loading">Carregando imagem...</div>
            }
          </div>
          <div class="cropper-footer">
            <button class="btn-cancel" (click)="cancel.emit()">Cancelar</button>
            <button class="btn-confirm" (click)="confirm()" [disabled]="!ready()">
              Usar foto cortada
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cropper-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: fadeIn 0.15s ease; padding: 16px;
    }
    .cropper-modal {
      background: var(--background);
      border-radius: var(--radius-xl);
      width: min(100%, 460px); max-height: calc(100vh - 32px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
      overflow: hidden; display: flex; flex-direction: column;
    }
    .cropper-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
    }
    h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
    p { margin: 4px 0 0; color: var(--text-secondary); font-size: 13px; }
    .cropper-close {
      background: none; border: none; font-size: 24px; color: var(--text-secondary);
      cursor: pointer; padding: 4px 8px; border-radius: var(--radius-md); line-height: 1;
    }
    .cropper-close:hover { background: var(--background-secondary); }
    .cropper-body {
      padding: 16px; overflow: auto;
    }
    .image-container {
      max-width: 100%; max-height: 52vh;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }
    .image-container img {
      max-width: 100%; display: block;
    }
    .cropper-loading, .cropper-error {
      min-height: 220px; display: flex; align-items: center; justify-content: center;
      border: 1px dashed var(--border); border-radius: var(--radius-lg);
      color: var(--text-secondary); font-size: 14px; text-align: center; padding: 24px;
    }
    .cropper-error { color: var(--error); background: var(--error-light); border-color: rgba(224, 36, 94, 0.25); }
    .cropper-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding: 16px 20px; border-top: 1px solid var(--border);
    }
    .btn-cancel {
      padding: 10px 24px; border-radius: var(--radius-full);
      font-size: 14px; font-weight: 500; cursor: pointer;
      background: var(--background-secondary); color: var(--text-primary);
      border: 1px solid var(--border); transition: background 0.15s;
    }
    .btn-cancel:hover { background: var(--background-hover); }
    .btn-confirm {
      padding: 10px 24px; border-radius: var(--radius-full);
      font-size: 14px; font-weight: 600; cursor: pointer;
      background: var(--primary); color: var(--text-inverse);
      border: none; transition: background 0.15s;
    }
    .btn-confirm:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (max-width: 520px) {
      .cropper-footer { flex-direction: column-reverse; }
      .btn-cancel, .btn-confirm { width: 100%; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ImageCropperModalComponent implements AfterViewInit, OnDestroy {
  show = input.required<boolean>();
  imageFile = input.required<File | null>();

  cropped = output<Blob>();
  cancel = output<void>();

  @ViewChild('image') image!: ElementRef<HTMLImageElement>;
  @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;

  imageSrc = signal<string>('');
  loadError = signal(false);
  ready = signal(false);
  private cropper: Cropper | null = null;
  private objectUrl: string | null = null;

  constructor() {
    effect(() => {
      if (this.show() && this.imageFile()) {
        this.loadImage();
      } else if (!this.show()) {
        this.destroyCropper();
        this.ready.set(false);
      }
    });
  }

  ngAfterViewInit() {
    if (this.show() && this.imageFile()) {
      this.loadImage();
    }
  }

  ngOnDestroy() {
    this.destroyCropper();
  }

  private loadImage() {
    const file = this.imageFile();
    if (!file) return;

    this.destroyCropper();
    this.loadError.set(false);
    this.ready.set(false);
    this.objectUrl = URL.createObjectURL(file);
    this.imageSrc.set(this.objectUrl);
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img || this.cropper) return;

    const container = this.imageContainer?.nativeElement;
    if (!container) return;

    setTimeout(() => {
      this.cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        cropBoxMovable: true,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
        responsive: true,
        restore: false,
      });
      this.ready.set(true);
    }, 100);
  }

  onImageError() {
    this.loadError.set(true);
    this.ready.set(false);
    this.destroyCropper();
  }

  confirm() {
    if (!this.cropper) return;

    const canvas = this.cropper.getCroppedCanvas({
      width: 400,
      height: 400,
    });

    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        this.cropped.emit(blob);
      }
      this.destroyCropper();
    }, 'image/webp', 0.85);
  }

  private destroyCropper() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.imageSrc.set('');
  }
}
