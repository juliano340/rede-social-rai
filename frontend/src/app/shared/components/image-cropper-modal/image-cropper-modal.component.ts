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
        <div class="crop-card" (click)="$event.stopPropagation()">
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
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: fadeIn 0.15s ease; padding: 16px;
    }
    .crop-card {
      background: var(--popover);
      border-radius: var(--radius-xl);
      width: min(100%, 460px); max-height: calc(100vh - 32px);
      box-shadow: var(--shadow-2xl);
      overflow: hidden; display: flex; flex-direction: column;
      border: 1px solid var(--border);
    }
    .cropper-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 18px 22px; border-bottom: 1px solid var(--border); gap: 16px;
    }
    .cropper-header h2 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em; }
    .cropper-header p { margin: 4px 0 0; color: var(--text-tertiary); font-size: 13px; line-height: 1.4; }
    .cropper-close {
      background: none; border: none; font-size: 22px; color: var(--text-tertiary);
      cursor: pointer; padding: 6px; border-radius: var(--radius-md); line-height: 1;
      transition: all 0.15s; flex-shrink: 0;
    }
    .cropper-close:hover { background: var(--accent); color: var(--text-primary); }
    .cropper-body {
      padding: 16px 22px; overflow: auto;
    }
    .image-container {
      max-width: 100%; max-height: 52vh;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background: var(--surface-page);
    }
    .image-container img {
      max-width: 100%; display: block;
    }
    .cropper-loading, .cropper-error {
      min-height: 220px; display: flex; align-items: center; justify-content: center;
      border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);
      color: var(--text-tertiary); font-size: 14px; text-align: center; padding: 24px;
      background: var(--surface-page);
    }
    .cropper-error { color: var(--error); background: var(--error-light); border-color: var(--destructive-light); }
    .cropper-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 22px 20px;
    }
    .btn-cancel {
      padding: 10px 22px; border-radius: var(--radius-full);
      font-size: 14px; font-weight: 600; cursor: pointer;
      background: var(--accent); color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      transition: all 0.15s;
    }
    .btn-cancel:hover { background: var(--muted); border-color: var(--border-strong); }
    .btn-confirm {
      padding: 10px 22px; border-radius: var(--radius-full);
      font-size: 14px; font-weight: 600; cursor: pointer;
      background: var(--primary); color: var(--text-inverse);
      border: none; transition: all 0.15s;
    }
    .btn-confirm:hover:not(:disabled) { background: var(--primary-hover); }
    .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-confirm:focus-visible, .btn-cancel:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
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
    }, { allowSignalWrites: true });
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
