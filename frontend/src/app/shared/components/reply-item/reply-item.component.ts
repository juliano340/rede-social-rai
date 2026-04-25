import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { Reply } from '../../models';
import { getAvatarUrl } from '../../utils/avatar.utils';

export interface ReplyViewModel {
  reply: Reply;
  validChildren: Reply[];
  childCount: number;
  isExpanded: boolean;
}

@Component({
  selector: 'app-reply-item',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="reply-item" [class.highlight-reply]="highlightReplyId === reply.id" [attr.id]="'reply-' + reply.id">
      <div class="reply-avatar">
        @if (reply.author?.avatar) {
          <img [src]="getAvatarUrl(reply.author.avatar)" alt="Avatar" class="avatar-image">
        } @else {
          <span class="avatar-initial">{{ getAvatarInitial(reply.author?.name) }}</span>
        }
      </div>
      <div class="reply-content">
        <div class="reply-header-row">
          <div class="reply-header">
            <span class="reply-name">{{ reply.author?.name || 'Usuário' }}</span>
            <span class="reply-username">&#64;{{ reply.author?.username || 'usuario' }}</span>
            <span class="reply-time">· {{ reply.createdAt | date:'shortTime' }}</span>
          </div>
          @if (currentUserId && reply.author?.id && currentUserId === reply.author.id) {
            <button
              class="reply-menu-trigger"
              (click)="toggleMenu()"
              [attr.aria-expanded]="menuOpen"
              aria-label="Opções"
            >
              <lucide-icon name="more-horizontal" [size]="16"></lucide-icon>
            </button>
            @if (menuOpen) {
              <div class="reply-action-menu" role="menu">
                <button class="reply-action-menu-item" (click)="onEdit(); menuOpen = false">
                  <lucide-icon name="pencil" [size]="14"></lucide-icon> Editar
                </button>
                <button class="reply-action-menu-item destructive" (click)="onDelete(); menuOpen = false">
                  <lucide-icon name="trash-2" [size]="14"></lucide-icon> Excluir
                </button>
              </div>
            }
          }
        </div>

        <p class="reply-text">{{ reply.content }}</p>

        @if (currentUserId) {
          <div class="reply-actions-bar">
            @if (showReplyToReply) {
              <button class="reply-to-reply-btn" (click)="onToggleReply()">
                <lucide-icon name="arrow-big-up" [size]="14"></lucide-icon> Responder
              </button>
            }
            @if (childCount > 0) {
              <button class="toggle-thread-btn" (click)="onToggleThread()">
                @if (isExpanded) {
                  <lucide-icon name="chevron-up" [size]="14"></lucide-icon> Ocultar respostas
                } @else {
                  <lucide-icon name="chevron-down" [size]="14"></lucide-icon>
                  Ver {{ childCount }} {{ childCount === 1 ? 'resposta' : 'respostas' }}
                }
              </button>
            }
          </div>
        }

        @if (showReplyForm) {
          <div class="reply-to-reply-form">
            <textarea
              [(ngModel)]="replyFormContent"
              placeholder="Escreva uma resposta..."
              maxlength="280"
              rows="2"
            ></textarea>
            <div class="reply-actions">
              <button class="cancel-btn" (click)="onCancelReply()">Cancelar</button>
              <button class="submit-reply-btn" (click)="onSubmitReply()" [disabled]="!replyFormContent.trim()">
                Responder
              </button>
            </div>
          </div>
        }

        @if (isExpanded && validChildren.length > 0) {
          <div class="nested-replies">
            @for (child of validChildren; track child.id) {
              <div class="reply-item nested">
                <div class="nested-line"></div>
                <div class="reply-avatar small">
                  @if (child.author?.avatar) {
                    <img [src]="getAvatarUrl(child.author.avatar)" alt="Avatar" class="avatar-image">
                  } @else {
                    <span class="avatar-initial">{{ getAvatarInitial(child.author?.name) }}</span>
                  }
                </div>
                <div class="reply-content">
                  <div class="reply-header-row">
                    <div class="reply-header">
                      <span class="reply-name">{{ child.author?.name || 'Usuário' }}</span>
                      <span class="reply-username">&#64;{{ child.author?.username || 'usuario' }}</span>
                      <span class="reply-time">· {{ child.createdAt | date:'shortTime' }}</span>
                    </div>
                    @if (currentUserId && child.author?.id && currentUserId === child.author.id) {
                      <button
                        class="reply-menu-trigger small"
                        (click)="toggleChildMenu(child.id)"
                        [attr.aria-expanded]="childMenuOpen === child.id"
                        aria-label="Opções"
                      >
                        <lucide-icon name="more-horizontal" [size]="14"></lucide-icon>
                      </button>
                      @if (childMenuOpen === child.id) {
                        <div class="reply-action-menu" role="menu">
                          <button class="reply-action-menu-item" (click)="onEditNested(child); childMenuOpen = null">
                            <lucide-icon name="pencil" [size]="14"></lucide-icon> Editar
                          </button>
                          <button class="reply-action-menu-item destructive" (click)="onDeleteNested(child.id); childMenuOpen = null">
                            <lucide-icon name="trash-2" [size]="14"></lucide-icon> Excluir
                          </button>
                        </div>
                      }
                    }
                  </div>
                  <p class="reply-text">{{ child.content }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [``]
})
export class ReplyItemComponent {
  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
      this.childMenuOpen = null;
    }
  }

  @Input({ required: true }) reply!: Reply;
  @Input() validChildren: Reply[] = [];
  @Input() childCount = 0;
  @Input() isExpanded = false;
  @Input() currentUserId: string | null = null;
  @Input() highlightReplyId: string | null = null;
  @Input() showReplyToReply = true;
  @Input() showReplyForm = false;

  @Output() toggleThread = new EventEmitter<void>();
  @Output() toggleReplyForm = new EventEmitter<void>();
  @Output() submitReply = new EventEmitter<string>();
  @Output() cancelReply = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Reply>();
  @Output() delete = new EventEmitter<string>();
  @Output() editNested = new EventEmitter<Reply>();
  @Output() deleteNested = new EventEmitter<string>();

  menuOpen = false;
  childMenuOpen: string | null = null;
  replyFormContent = '';

  getAvatarUrl = getAvatarUrl;

  getAvatarInitial(name: string | undefined | null): string {
    return ((name && name[0]) || '?').toUpperCase();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleChildMenu(childId: string) {
    this.childMenuOpen = this.childMenuOpen === childId ? null : childId;
  }

  onToggleThread() {
    this.toggleThread.emit();
  }

  onToggleReply() {
    this.toggleReplyForm.emit();
  }

  onSubmitReply() {
    if (!this.replyFormContent.trim()) return;
    this.submitReply.emit(this.replyFormContent);
    this.replyFormContent = '';
  }

  onCancelReply() {
    this.replyFormContent = '';
    this.cancelReply.emit();
  }

  onEdit() {
    this.edit.emit(this.reply);
  }

  onDelete() {
    this.delete.emit(this.reply.id);
  }

  onEditNested(child: Reply) {
    this.editNested.emit(child);
  }

  onDeleteNested(childId: string) {
    this.deleteNested.emit(childId);
  }
}
