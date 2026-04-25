import { Component, Input, Output, EventEmitter, signal, HostListener, ElementRef, inject } from '@angular/core';
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
  selector: 'app-reply-section',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule],
  templateUrl: './reply-section.component.html',
  styleUrl: './reply-section.component.scss'
})
export class ReplySectionComponent {
  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.openActionMenuId && !this.elementRef.nativeElement.contains(event.target)) {
      this.openActionMenuId = null;
    }
  }

  private _replies: Reply[] = [];

  @Input() set replies(value: Reply[]) {
    this._replies = value || [];
    this.rebuildViewModels();
  }

  get replies(): Reply[] {
    return this._replies;
  }
  @Input() loading = false;
  @Input() showForm = true;
  @Input() showReplyToReply = true;
  @Input() currentUserId: string | null = null;
  @Input() highlightReplyId: string | null = null;
  @Input() isSubmitting = false;
  @Input() savingReply = false;
  @Input() hasMore = false;
  @Input() isLoadingMore = false;

  @Output() close = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();
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

  replyContent = '';
  replyingToCommentId: string | null = null;
  replyingToCommentContent = '';
  openActionMenuId: string | null = null;

  private _expandedThreadIds = signal<Set<string>>(new Set());
  viewModels: ReplyViewModel[] = [];
  totalCount = 0;

  private rebuildViewModels(): void {
    const expanded = this._expandedThreadIds();
    this.viewModels = this._replies
      .filter(reply => this.isRenderableReply(reply))
      .map(reply => {
        const normalizedReply = this.normalizeReply(reply);
        const validChildren = (reply.children || [])
          .filter(child => this.isRenderableReply(child))
          .map(child => this.normalizeReply(child));
        return {
          reply: normalizedReply,
          validChildren,
          childCount: validChildren.length,
          isExpanded: expanded.has(normalizedReply.id),
        };
      });
    this.totalCount = this.viewModels.length;
  }

  private isRenderableReply(reply: Reply | null | undefined): reply is Reply {
    return !!reply?.id && typeof reply.content === 'string';
  }

  private normalizeReply(reply: Reply): Reply {
    const safeAuthor = reply.author || {} as any;
    return {
      ...reply,
      content: String(reply.content || '').trim(),
      author: {
        id: String(safeAuthor.id || ''),
        name: String(safeAuthor.name || 'Usuário').trim() || 'Usuário',
        username: String(safeAuthor.username || 'usuario').trim() || 'usuario',
        avatar: safeAuthor.avatar || null,
      },
    };
  }

  getAvatarUrl = getAvatarUrl;

  getAvatarInitial(name: string | null | undefined): string {
    const n = String(name || '').trim();
    return (n[0] || '?').toUpperCase();
  }

  formatTime(value: string | Date | null | undefined): string {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  toggleThread(replyId: string): void {
    this._expandedThreadIds.update(ids => {
      const next = new Set(ids);
      if (next.has(replyId)) { next.delete(replyId); }
      else { next.add(replyId); }
      return next;
    });
    this.rebuildViewModels();
  }

  isThreadExpanded(replyId: string): boolean {
    return this._expandedThreadIds().has(replyId);
  }

  onClose() { this.close.emit(); }

  onOpenForm() { this.openForm.emit(); }

  submitReply() {
    if (!this.replyContent.trim()) return;
    this.submitReplyEvent.emit(this.replyContent);
    this.replyContent = '';
  }

  startEditReply(reply: Reply) {
    this.startEdit.emit(reply);
  }

  cancelEditReply() { this.cancelEdit.emit(); }

  saveEditReply(replyId: string, content: string) {
    if (!content.trim()) return;
    this.saveEdit.emit({ replyId, content });
  }

  deleteReply(replyId: string) { this.deleteReplyEvent.emit(replyId); }

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

  startEditNestedReply(reply: Reply) { this.startEditNested.emit(reply); }

  cancelEditNestedReply() { this.cancelEditNested.emit(); }

  saveEditNestedReply(replyId: string, content: string) {
    if (!content.trim()) return;
    this.saveEditNested.emit({ replyId, content });
  }

  deleteNestedReply(replyId: string) { this.deleteNestedReplyEvent.emit(replyId); }

  toggleActionMenu(replyId: string) {
    this.openActionMenuId = this.openActionMenuId === replyId ? null : replyId;
  }

  closeActionMenu() { this.openActionMenuId = null; }
}
