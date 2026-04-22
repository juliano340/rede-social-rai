import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PostsService, Post } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LucideIconsModule } from '../../shared/icons/lucide-icons.module';
import { ToastService } from '../../shared/services/toast.service';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { ReplySectionComponent } from '../../shared/components/reply-section/reply-section.component';
import { DeleteConfirmModalComponent } from '../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { PostCreateFormComponent } from '../../shared/components/post-create-form/post-create-form.component';
import { FeedTabsComponent } from '../../shared/components/feed-tabs/feed-tabs.component';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';
import { FeedErrorComponent } from '../../shared/components/feed-error/feed-error.component';
import { FeedEmptyComponent } from '../../shared/components/feed-empty/feed-empty.component';
import { PostEditService } from '../../services/post-edit.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SkeletonComponent,
    LucideIconsModule,
    PostCardComponent,
    ReplySectionComponent,
    DeleteConfirmModalComponent,
    PostCreateFormComponent,
    FeedTabsComponent,
    FeedSkeletonComponent,
    FeedErrorComponent,
    FeedEmptyComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  posts = signal<Post[]>([]);
  feedType = signal<'all' | 'following'>('all');
  isSubmitting = signal(false);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  loadingReplies = signal(false);
  highlightPostId = signal<string | null>(null);
  highlightReplyId = signal<string | null>(null);

  postEdit = inject(PostEditService);

  get postLikingId() { return this.postEdit.postLikingId; }
  get postLikes() { return this.postEdit.postLikes; }
  get replyingToPost() { return this.postEdit.replyingToPost; }
  readonly viewingRepliesPost = this.postEdit.replyingToPost;
  get postReplies() { return this.postEdit.postReplies; }
  get isSubmittingReply() { return this.postEdit.isSubmittingReply; }
  get savingReply() { return this.postEdit.savingReply; }
  get deletingPostId() { return this.postEdit.deletingPostId; }
  get showDeletePostModal() { return this.postEdit.showDeletePostModal; }
  get showDeleteModal() { return this.postEdit.showDeleteReplyModal; }

  constructor(
    public authService: AuthService,
    private postsService: PostsService,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadPosts();
    this.route.queryParams.subscribe(params => {
      const postId = params['postId'];
      const replyId = params['replyId'];
      if (postId) {
        this.highlightPostId.set(postId);
        if (replyId) {
          this.highlightReplyId.set(replyId);
          this.viewingRepliesPost.set(postId);
          this.loadReplies(postId, () => this.scrollToReply(replyId));
        }
        setTimeout(() => this.scrollToPost(postId), 100);
      }
    });
  }

  private scrollToPost(postId: string) {
    const el = document.getElementById('post-' + postId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.highlightPostId.set(null), 3000);
    }
  }

  private scrollToReply(replyId: string) {
    const el = document.getElementById('reply-' + replyId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.highlightReplyId.set(null), 3000);
    }
  }

  loadPosts() {
    this.isLoading.set(true);
    this.loadError.set(null);

    const feed = this.feedType();
    const request = feed === 'following'
      ? this.postsService.getFollowingPosts()
      : this.postsService.getPosts();

    request.subscribe({
      next: (response) => {
        this.posts.set(response.posts);

        if (this.authService.isLoggedIn()) {
          const likes: Record<string, boolean> = {};
          response.posts.forEach((post: any) => {
            likes[post.id] = post.isLiked || false;
          });
          this.postLikes.set(likes);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Não foi possível carregar as publicações.');
        this.isLoading.set(false);
      }
    });
  }

  switchFeed(type: 'all' | 'following') {
    this.feedType.set(type);
    this.loadPosts();
  }

  onCreatePost(data: { content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.submitError.set(null);
    this.submitSuccess.set(false);
    this.isSubmitting.set(true);

    this.postsService.createPost(data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (post) => {
        this.posts.update(posts => [post, ...posts]);
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.submitSuccess.set(false), 3000);
      },
      error: (err) => {
        if (err.status === 429) {
          this.submitError.set('Você está publicando muito rápido. Aguarde um momento.');
        } else {
          this.submitError.set(err.error?.message || 'Erro ao publicar. Tente novamente.');
        }
        this.isSubmitting.set(false);
      }
    });
  }

  onLikeClick(post: Post) {
    this.postEdit.toggleLike(post);
  }

  onReplyToggle(postId: string) {
    if (this.replyingToPost() === postId) {
      this.postEdit.cancelReply();
    } else {
      this.replyingToPost.set(postId);
      this.loadReplies(postId);
    }
  }

  onDeleteClick(postId: string) {
    this.postEdit.deletePost(postId);
  }

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.postsService.updatePost(data.postId, data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (updated) => {
        this.posts.update(posts =>
          posts.map(p => p.id === data.postId
            ? { ...p, content: updated.content, mediaUrl: updated.mediaUrl, mediaType: updated.mediaType, linkUrl: updated.linkUrl }
            : p
          )
        );
        this.postEdit.editingPost.set(null);
      },
      error: () => {
        this.postEdit.editingPost.set(null);
      }
    });
  }

  onEditCancel() {
    this.postEdit.editingPost.set(null);
  }

  onOpenReplyForm(postId: string) {
    this.postEdit.openReplyForm(postId);
  }

  onSubmitReply(postId: string, content: string) {
    this.postEdit.submitReply(postId, this.posts, this.postReplies, content);
  }

  onSaveEditReply(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.saveEditReply(data.replyId, postId, this.postReplies, this.posts);
  }

  onDeleteReply(postId: string, replyId: string) {
    this.postEdit.deleteReply(replyId, postId);
  }

  onToggleReplyToComment(commentId: string) {
    this.postEdit.toggleReplyToComment(commentId);
  }

  onCancelReplyToComment() {
    this.postEdit.cancelReplyToComment();
  }

  onSubmitReplyToComment(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.submitReplyToComment(data.replyId, postId, this.postReplies, data.content, this.posts);
  }

  onSaveEditNestedReply(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.saveEditNestedReply(data.replyId, postId, '', this.postReplies, this.posts);
  }

  onDeleteNestedReply(postId: string, replyId: string) {
    this.postEdit.deleteNestedReply(replyId, postId, '');
  }

  onCloseDeleteReplyModal() {
    this.postEdit.closeDeleteReplyModal();
  }

  onConfirmDeleteReply() {
    this.postEdit.confirmDeleteReply(this.postReplies, this.posts);
  }

  onCloseDeletePostModal() {
    this.postEdit.closeDeletePostModal();
  }

  onConfirmDeletePost() {
    this.postEdit.confirmDeletePost(this.posts);
  }

  loadReplies(postId: string, callback?: () => void) {
    this.loadingReplies.set(true);
    this.postsService.getReplies(postId).subscribe({
      next: (data) => {
        this.postReplies.set(data.replies || []);
        this.loadingReplies.set(false);
        if (callback) callback();
      },
      error: () => {
        this.loadingReplies.set(false);
      }
    });
  }

  startEditReply(reply: any) {
    this.postEdit.startEditReply(reply);
  }

  cancelEditReply() {
    this.postEdit.cancelEditReply();
  }

  startEditNestedReply(reply: any) {
    this.postEdit.startEditNestedReply(reply);
  }

  cancelEditNestedReply() {
    this.postEdit.cancelEditNestedReply();
  }

}
