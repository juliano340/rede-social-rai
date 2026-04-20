import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../icons/lucide-icons.module';
import { Reply } from '../../models';
import { getAvatarUrl } from '../../utils/avatar.utils';

@Component({
  selector: 'app-reply-section',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  template: `
    <div class="replies-list">
      <button class="close-replies" (click)="onClose()">
        <lucide-icon name="x" [size]="18"></lucide-icon>
      </button>

      @if (showForm) {
        <button class="add-reply-link" (click)="openForm.emit()">
          <lucide-icon name="message-circle" [size]="16"></lucide-icon> Comentar
        </button>
      }

      @if (showReplyForm) {
        <div class="reply-form">
          <textarea
            [(ngModel)]="replyContent"
            placeholder="Escreva um comentário..."
            maxlength="280"
          ></textarea>
          <div class="reply-actions">
            <span class="char-count">{{ replyContent.length }}/280</span>
            <div class="reply-buttons">
              <button class="cancel-btn" (click)="cancelReply()">Cancelar</button>
              <button
                class="submit-reply-btn"
                (click)="submitReply()"
                [disabled]="!replyContent.trim() || isSubmitting"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      }

      @if (loading) {
        <div class="loading-replies">
          <div class="spinner-sm"></div>
        </div>
      } @else if (replies.length === 0 && !showReplyForm) {
        <p class="no-replies">Nenhuma resposta ainda.</p>
      } @else {
        @for (reply of replies; track reply.id) {
          <div class="reply-item" [class.highlight-reply]="highlightReplyId === reply.id" [attr.id]="'reply-' + reply.id">
            <div class="reply-avatar">
              @if (reply.author.avatar) {
                <img [src]="getAvatarUrl(reply.author.avatar)" alt="Avatar" class="avatar-image">
              } @else {
                {{ getAvatarInitial(reply.author.name) }}
              }
            </div>
            <div class="reply-content">
              <div class="reply-header">
                <span class="reply-name">{{ reply.author.name }}</span>
                <span class="reply-username">&#64;{{ reply.author.username }}</span>
              </div>
              @if (editingReplyId === reply.id) {
                <div class="edit-reply-form">
                  <textarea
                    [(ngModel)]="editReplyContent"
                    maxlength="280"
                  ></textarea>
                  <div class="edit-actions">
                    <button class="cancel-edit" (click)="cancelEditReply()">Cancelar</button>
                    <button
                      class="save-edit"
                      (click)="saveEditReply(reply.id)"
                      [disabled]="!editReplyContent.trim() || savingReply"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              } @else {
                <p class="reply-text">{{ reply.content }}</p>
              }
              @if (currentUserId && editingReplyId !== reply.id) {
                <div class="reply-actions">
                  @if (currentUserId === reply.author.id) {
                    <button class="reply-edit-btn" (click)="startEditReply(reply)">Editar</button>
                    <button class="reply-delete-btn" (click)="deleteReply(reply.id)">Excluir</button>
                  }
                  @if (showReplyToReply) {
                    <button class="reply-to-reply-btn" (click)="toggleReplyToComment(reply.id)">
                      Responder
                    </button>
                  }
                </div>
              }
              @if (replyingToCommentId === reply.id) {
                <div class="reply-to-reply-form">
                  <textarea
                    [(ngModel)]="replyingToCommentContent"
                    placeholder="Escreva uma resposta..."
                    maxlength="280"
                  ></textarea>
                  <div class="reply-actions">
                    <button class="cancel-btn" (click)="cancelReplyToComment()">Cancelar</button>
                    <button
                      class="submit-reply-btn"
                      (click)="submitReplyToComment(reply.id)"
                      [disabled]="!replyingToCommentContent.trim()"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              }

              @if (reply.children && reply.children.length > 0) {
                <div class="nested-replies">
                  @for (child of reply.children; track child.id) {
                    <div class="reply-item nested">
                      <div class="reply-avatar small">
                        @if (child.author.avatar) {
                          <img [src]="getAvatarUrl(child.author.avatar)" alt="Avatar" class="avatar-image">
                        } @else {
                          {{ getAvatarInitial(child.author.name) }}
                        }
                      </div>
                      <div class="reply-content">
                        <div class="reply-header">
                          <span class="reply-name">{{ child.author.name }}</span>
                          <span class="reply-username">&#64;{{ child.author.username }}</span>
                        </div>
                        @if (editingNestedReplyId === child.id) {
                          <div class="edit-reply-form">
                            <textarea
                              [(ngModel)]="editNestedReplyContent"
                              maxlength="280"
                            ></textarea>
                            <div class="edit-actions">
                              <button class="cancel-edit" (click)="cancelEditNestedReply()">Cancelar</button>
                              <button
                                class="save-edit"
                                (click)="saveEditNestedReply(child.id)"
                                [disabled]="!editNestedReplyContent.trim() || savingReply"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        } @else {
                          <p class="reply-text">{{ child.content }}</p>
                        }
                        @if (currentUserId === child.author.id && editingNestedReplyId !== child.id) {
                          <div class="reply-actions">
                            <button class="reply-edit-btn" (click)="startEditNestedReply(child)">Editar</button>
                            <button class="reply-delete-btn" (click)="deleteNestedReply(child.id)">Excluir</button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .replies-list {
      margin-top: 12px;
      padding: 12px;
      background: var(--background-secondary);
      border-radius: var(--radius-md);
      position: relative;

      .close-replies {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 16px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-sm);

        &:hover {
          background: var(--border);
        }
      }

      .add-reply-link {
        display: block;
        width: 100%;
        padding: 10px;
        background: none;
        border: none;
        color: var(--primary);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid var(--border);

        &:hover {
          background: var(--background-secondary);
        }
      }

      .loading-replies {
        text-align: center;
        padding: 20px;
      }

      .no-replies {
        text-align: center;
        color: var(--text-secondary);
        padding: 20px;
      }

      .reply-form {
        margin-top: 12px;
        padding: 12px;
        background: var(--background-secondary);
        border-radius: var(--radius-md);

        textarea {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px;
          font-size: 14px;
          resize: none;
          min-height: 60px;
          color: var(--text-primary);
          background: var(--background);

          &:focus {
            outline: none;
            border-color: var(--primary);
          }
        }

        .reply-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;

          .char-count {
            font-size: 12px;
            color: var(--text-tertiary);
          }

          .reply-buttons {
            display: flex;
            gap: 8px;

            .cancel-btn {
              background: none;
              border: 1px solid var(--border);
              padding: 6px 12px;
              border-radius: var(--radius-full);
              font-size: 14px;
              color: var(--text-primary);

              &:hover {
                background: var(--background-secondary);
              }
            }

            .submit-reply-btn {
              background: var(--primary);
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: var(--radius-full);
              font-size: 14px;
              font-weight: 500;

              &:hover:not(:disabled) {
                background: var(--primary-hover);
              }

              &:disabled {
                opacity: 0.5;
              }
            }
          }
        }
      }

      .reply-item {
        display: flex;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);

        &:last-child {
          border-bottom: none;
        }
      }

      .highlight-reply {
        animation: highlight-fade 3s ease-out;
        border-radius: 8px;
      }

      @keyframes highlight-fade {
        0% { background: rgba(99, 102, 241, 0.2); }
        100% { background: transparent; }
      }

      .reply-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary), #0d8ecf);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        flex-shrink: 0;
        overflow: hidden;

        .avatar-image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
      }

      .reply-content {
        flex: 1;
        min-width: 0;

        .reply-header {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }

        .reply-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 14px;
        }

        .reply-username {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .reply-text {
          color: var(--text-primary);
          font-size: 14px;
        }

        .edit-reply-form {
          margin-top: 8px;

          textarea {
            width: 100%;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 8px;
            font-size: 14px;
            resize: none;
            min-height: 50px;
            color: var(--text-primary);
            background: var(--background);

            &:focus {
              outline: none;
              border-color: var(--primary);
            }
          }

          .edit-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            justify-content: flex-end;
          }

          .cancel-edit, .save-edit {
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            cursor: pointer;
          }

          .cancel-edit {
            background: var(--background-secondary);
            border: 1px solid var(--border);
            color: var(--text-primary);

            &:hover {
              background: var(--border);
            }
          }

          .save-edit {
            background: var(--primary);
            color: white;
            border: none;

            &:hover:not(:disabled) {
              background: var(--primary-hover);
            }

            &:disabled {
              opacity: 0.5;
            }
          }
        }

        .reply-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;

          .reply-edit-btn, .reply-delete-btn, .reply-to-reply-btn {
            background: none;
            border: none;
            font-size: 12px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            color: var(--text-secondary);

            &:hover {
              background: var(--background-secondary);
            }
          }

          .reply-delete-btn {
            color: var(--error);
          }
        }

        .reply-to-reply-btn {
          color: var(--primary);

          &:hover {
            text-decoration: underline;
          }
        }

        .reply-to-reply-form {
          margin-top: 8px;

          textarea {
            width: 100%;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 8px;
            font-size: 13px;
            resize: none;
            min-height: 40px;
            color: var(--text-primary);
            background: var(--background);

            &:focus {
              outline: none;
              border-color: var(--primary);
            }
          }

          .reply-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 6px;
          }

          .cancel-btn, .submit-reply-btn {
            padding: 4px 10px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            cursor: pointer;
          }

          .cancel-btn {
            background: var(--background-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);

            &:hover {
              background: var(--border);
            }
          }

          .submit-reply-btn {
            background: var(--primary);
            color: white;
            border: none;

            &:hover:not(:disabled) {
              background: var(--primary-hover);
            }

            &:disabled {
              opacity: 0.5;
            }
          }
        }

        .nested-replies {
          margin-top: 8px;
          padding-left: 12px;
          border-left: 2px solid var(--border);

          .reply-item.nested {
            padding: 8px 0;
            border-bottom: 1px solid var(--border);

            &:last-child {
              border-bottom: none;
            }

            .reply-avatar.small {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--primary), #0d8ecf);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 10px;
              flex-shrink: 0;
              overflow: hidden;

              .avatar-image {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                object-fit: cover;
              }
            }

            .reply-text {
              color: var(--text-primary);
              font-size: 14px;
            }

            .edit-reply-form {
              margin-top: 8px;

              textarea {
                width: 100%;
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 8px;
                font-size: 14px;
                resize: none;
                min-height: 50px;
                color: var(--text-primary);
                background: var(--background);

                &:focus {
                  outline: none;
                  border-color: var(--primary);
                }
              }

              .edit-actions {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 4px;
                justify-content: flex-end;
              }

              .cancel-edit, .save-edit {
                padding: 4px 10px;
                border-radius: var(--radius-sm);
                font-size: 13px;
                cursor: pointer;
              }

              .cancel-edit {
                background: var(--background-secondary);
                border: 1px solid var(--border);
                color: var(--text-primary);

                &:hover {
                  background: var(--border);
                }
              }

              .save-edit {
                background: var(--primary);
                color: white;
                border: none;

                &:hover:not(:disabled) {
                  background: var(--primary-hover);
                }

                &:disabled {
                  opacity: 0.5;
                }
              }
            }

            .reply-actions {
              display: flex;
              gap: 8px;
              margin-top: 4px;

              .reply-edit-btn, .reply-delete-btn {
                background: none;
                border: none;
                font-size: 12px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: var(--radius-sm);
                color: var(--text-secondary);

                &:hover {
                  background: var(--background-secondary);
                }
              }

              .reply-delete-btn {
                color: var(--error);
              }
            }
          }
        }
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ReplySectionComponent {
  @Input() replies: Reply[] = [];
  @Input() loading = false;
  @Input() showForm = true;
  @Input() showReplyToReply = true;
  @Input() currentUserId: string | null = null;
  @Input() highlightReplyId: string | null = null;
  @Input() isSubmitting = false;
  @Input() savingReply = false;

  @Output() close = new EventEmitter<void>();
  @Output() openForm = new EventEmitter<void>();
  @Output() submitReplyEvent = new EventEmitter<string>();
  @Output() startEdit = new EventEmitter<Reply>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<{ replyId: string; content: string }>();
  @Output() deleteReplyEvent = new EventEmitter<string>();
  @Output() toggleReplyToCommentEvent = new EventEmitter<string>();
  @Output() cancelReplyToCommentEvent = new EventEmitter<void>();
  @Output() submitReplyToCommentEvent = new EventEmitter<{ replyId: string; content: string }>();
  @Output() startEditNested = new EventEmitter<Reply>();
  @Output() cancelEditNested = new EventEmitter<void>();
  @Output() saveEditNested = new EventEmitter<{ replyId: string; content: string }>();
  @Output() deleteNestedReplyEvent = new EventEmitter<string>();

  showReplyForm = false;
  replyContent = '';
  editingReplyId: string | null = null;
  editReplyContent = '';
  replyingToCommentId: string | null = null;
  replyingToCommentContent = '';
  editingNestedReplyId: string | null = null;
  editNestedReplyContent = '';

  getAvatarUrl = getAvatarUrl;

  getAvatarInitial(name: string): string {
    return ((name && name[0]) || '?').toUpperCase();
  }

  onClose() {
    this.close.emit();
  }

  cancelReply() {
    this.showReplyForm = false;
    this.replyContent = '';
    this.openForm.emit();
  }

  submitReply() {
    if (!this.replyContent.trim()) return;
    this.submitReplyEvent.emit(this.replyContent);
    this.replyContent = '';
    this.showReplyForm = false;
  }

  startEditReply(reply: Reply) {
    this.editingReplyId = reply.id;
    this.editReplyContent = reply.content;
    this.startEdit.emit(reply);
  }

  cancelEditReply() {
    this.editingReplyId = null;
    this.editReplyContent = '';
    this.cancelEdit.emit();
  }

  saveEditReply(replyId: string) {
    if (!this.editReplyContent.trim()) return;
    this.saveEdit.emit({ replyId, content: this.editReplyContent });
    this.editingReplyId = null;
    this.editReplyContent = '';
  }

  deleteReply(replyId: string) {
    this.deleteReplyEvent.emit(replyId);
  }

  toggleReplyToComment(replyId: string) {
    if (this.replyingToCommentId === replyId) {
      this.replyingToCommentId = null;
      this.replyingToCommentContent = '';
    } else {
      this.replyingToCommentId = replyId;
      this.replyingToCommentContent = '';
    }
    this.toggleReplyToCommentEvent.emit(replyId);
  }

  cancelReplyToComment() {
    this.replyingToCommentId = null;
    this.replyingToCommentContent = '';
    this.cancelReplyToCommentEvent.emit();
  }

  submitReplyToComment(replyId: string) {
    if (!this.replyingToCommentContent.trim()) return;
    this.submitReplyToCommentEvent.emit({ replyId, content: this.replyingToCommentContent });
    this.replyingToCommentId = null;
    this.replyingToCommentContent = '';
  }

  startEditNestedReply(reply: Reply) {
    this.editingNestedReplyId = reply.id;
    this.editNestedReplyContent = reply.content;
    this.startEditNested.emit(reply);
  }

  cancelEditNestedReply() {
    this.editingNestedReplyId = null;
    this.editNestedReplyContent = '';
    this.cancelEditNested.emit();
  }

  saveEditNestedReply(replyId: string) {
    if (!this.editNestedReplyContent.trim()) return;
    this.saveEditNested.emit({ replyId, content: this.editNestedReplyContent });
    this.editingNestedReplyId = null;
    this.editNestedReplyContent = '';
  }

  deleteNestedReply(replyId: string) {
    this.deleteNestedReplyEvent.emit(replyId);
  }
}
