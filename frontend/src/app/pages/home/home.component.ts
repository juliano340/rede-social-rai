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
import { Reply } from '../../shared/models';

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
  feedType = signal<'all' | 'following'>('all');
  isSubmitting = signal(false);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  highlightPostId = signal<string | null>(null);
  highlightReplyId = signal<string | null>(null);

  postsService = inject(PostsService);
  postEdit = inject(PostEditService);

  get posts() { return this.postsService.feedPosts; }

  constructor(
    public authService: AuthService,
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
          this.postEdit.openComments(postId);
          setTimeout(() => this.scrollToReply(replyId), 500);
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
        if (this.authService.isLoggedIn()) {
          this.postEdit.setPostLikes(response.posts);
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
      next: () => {
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
    this.postEdit.toggleComments(postId);
  }

  onCloseComments() {
    this.postEdit.closeComments();
  }

  onDeleteClick(postId: string) {
    this.postEdit.deletePost(postId);
  }

  onEditSave(data: { postId: string; content: string; mediaUrl: string | null; mediaType: 'image' | 'youtube' | null; linkUrl: string | null }) {
    this.postsService.updatePost(data.postId, data.content, data.mediaUrl, data.mediaType, data.linkUrl).subscribe({
      next: (updated) => {
        this.postsService.updatePostInSignals(data.postId, {
          content: updated.content,
          mediaUrl: updated.mediaUrl,
          mediaType: updated.mediaType,
          linkUrl: updated.linkUrl,
        });
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

  onSubmitReply(postId: string, content: string) {
    this.postEdit.submitReply(postId, content);
  }

  onSubmitReplyToComment(postId: string, data: { replyId: string; content: string }) {
    this.postEdit.submitReplyToComment(data.replyId, postId, data.content);
  }

  onLoadMoreReplies(postId: string) {
    this.postEdit.loadMoreComments(postId);
  }

  onCloseDeletePostModal() {
    this.postEdit.closeDeletePostModal();
  }

  onConfirmDeletePost() {
    this.postEdit.confirmDeletePost();
  }

  onOpenReplyForm(_postId: string) {
    // ReplySection has its own composer, no action needed here
  }
}