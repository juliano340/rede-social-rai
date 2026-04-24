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
  templateUrl: './reply-section.component.html',
  styleUrl: './reply-section.component.scss'
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

  onOpenForm() {
    this.showReplyForm = true;
    this.openForm.emit();
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
