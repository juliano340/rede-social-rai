import { TestBed } from '@angular/core/testing';
import { PostEditService } from './post-edit.service';
import { PostsService } from './posts.service';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/services/toast.service';
import { UrlUtilsService } from '../shared/services/url-utils.service';
import { Post, Reply } from '../shared/models/post.model';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HTTP_STATUS } from '../shared/constants/app.constants';

describe('PostEditService', () => {
  let service: PostEditService;
  let postsServiceSpy: jasmine.SpyObj<PostsService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const mockPost: Post = {
    id: 'post-1',
    content: 'Test post',
    author: { id: 'user-1', username: 'test', name: 'Test', avatar: null },
    _count: { likes: 5, replies: 2 },
    createdAt: new Date().toISOString(),
  };

  const mockReply: Reply = {
    id: 'reply-1',
    content: 'Test reply',
    author: { id: 'user-1', username: 'test', name: 'Test', avatar: null },
  };

  beforeEach(() => {
    postsServiceSpy = jasmine.createSpyObj('PostsService', [
      'updatePost', 'updateReply', 'deletePost', 'deleteReply',
      'createReply', 'likePost'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    toastSpy = jasmine.createSpyObj('ToastService', ['error', 'success']);

    TestBed.configureTestingModule({
      providers: [
        PostEditService,
        { provide: PostsService, useValue: postsServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        UrlUtilsService,
      ]
    });

    service = TestBed.inject(PostEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Post Edit State', () => {
    it('should start editing a post', () => {
      service.startEditPost(mockPost);
      expect(service.editingPost()).toBe(mockPost.id);
      expect(service.editPostContent()).toBe(mockPost.content);
    });

    it('should cancel editing', () => {
      service.startEditPost(mockPost);
      service.cancelEditPost();
      expect(service.editingPost()).toBeNull();
      expect(service.editPostContent()).toBe('');
    });

    it('should save edited post and update signal', () => {
      const posts = signal<Post[]>([mockPost]);
      const updated = { ...mockPost, content: 'Updated' };
      postsServiceSpy.updatePost.and.returnValue(of(updated));

      service.startEditPost(mockPost);
      service.editPostContent.set('Updated');
      service.saveEditPost(mockPost.id, posts);

      expect(postsServiceSpy.updatePost).toHaveBeenCalled();
      expect(posts()[0].content).toBe('Updated');
      expect(service.editingPost()).toBeNull();
    });
  });

  describe('Like State', () => {
    it('should toggle like optimistically', () => {
      const post = { ...mockPost, _count: { ...mockPost._count } };
      service.postLikes.set({ [post.id]: false });

      postsServiceSpy.likePost.and.returnValue(of({ liked: true }));

      service.toggleLike(post);

      expect(service.postLikes()[post.id]).toBeTrue();
      expect(post._count.likes).toBe(6);
    });

    it('should rollback like on error', () => {
      const post = { ...mockPost, _count: { ...mockPost._count } };
      service.postLikes.set({ [post.id]: false });
      service.postLikingId.set(null);

      postsServiceSpy.likePost.and.returnValue(throwError(() => ({ status: HTTP_STATUS.INTERNAL_SERVER_ERROR })));

      service.toggleLike(post);

      expect(service.postLikes()[post.id]).toBeFalse();
      expect(post._count.likes).toBe(5);
      expect(service.postLikingId()).toBeNull();
    });

    it('should not allow concurrent like requests', () => {
      const post = { ...mockPost };
      service.postLikingId.set(post.id);

      service.toggleLike(post);

      expect(postsServiceSpy.likePost).not.toHaveBeenCalled();
    });
  });

  describe('Reply State', () => {
    it('should create reply and update signals', () => {
      const posts = signal<Post[]>([mockPost]);
      const replies = signal<Reply[]>([]);
      const newReply: Reply = { id: 'new-reply', content: 'New', author: mockPost.author };
      postsServiceSpy.createReply.and.returnValue(of(newReply));

      service.submitReply(mockPost.id, posts, replies, 'New');

      expect(replies()).toContain(newReply);
      expect(posts()[0]._count.replies).toBe(3);
      expect(service.replyContent()).toBe('');
    });

    it('should not create empty reply', () => {
      const posts = signal<Post[]>([mockPost]);
      const replies = signal<Reply[]>([]);

      service.submitReply(mockPost.id, posts, replies, '   ');

      expect(postsServiceSpy.createReply).not.toHaveBeenCalled();
    });
  });

  describe('Delete State', () => {
    it('should delete post and update signal', () => {
      const posts = signal<Post[]>([mockPost]);
      postsServiceSpy.deletePost.and.returnValue(of({}));

      service.deletePost(mockPost.id);
      service.confirmDeletePost(posts);

      expect(posts()).toEqual([]);
      expect(service.showDeletePostModal()).toBeFalse();
    });

    it('should delete reply and update signals', () => {
      const posts = signal<Post[]>([mockPost]);
      const replies = signal<Reply[]>([mockReply]);
      postsServiceSpy.deleteReply.and.returnValue(of({}));

      service.deleteReply(mockReply.id, mockPost.id);
      service.confirmDeleteReply(replies, posts);

      expect(replies()).toEqual([]);
      expect(service.showDeleteReplyModal()).toBeFalse();
    });
  });

  describe('URL Utils', () => {
    it('should detect URL in content', () => {
      const url = service.detectUrlInContent('Check out https://example.com');
      expect(url).toBe('https://example.com');
    });

    it('should normalize URL', () => {
      expect(service.normalizeUrl('example.com')).toBe('https://example.com');
      expect(service.normalizeUrl('')).toBeNull();
    });

    it('should validate image URL', () => {
      expect(service.isValidImageUrl('https://example.com/image.jpg')).toBeTrue();
      expect(service.isValidImageUrl('https://example.com/file.pdf')).toBeFalse();
    });
  });
});
