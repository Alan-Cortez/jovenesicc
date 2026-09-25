'use client';

import { useState } from 'react';
import { createPostAction, toggleLikeAction, addCommentAction, deletePostAction, toggleCommentLikeAction } from '@/app/actions/posts';
import styles from './social.module.css';

type CommentType = {
  id: number;
  postId: number;
  content: string;
  parentId: number | null;
  createdAt: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  likes: number[];
};

type Post = {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  likes: number[]; // userIds
  comments: CommentType[];
};

// Iconos SVG
const HeartOutline = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const HeartFilled = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff3040" stroke="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function SocialFeed({ 
  posts, 
  currentUserId,
  currentUserAvatar,
  currentUserName
}: { 
  posts: Post[], 
  currentUserId: number,
  currentUserAvatar?: string | null,
  currentUserName: string
}) {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para la caja de comentarios general del post
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{commentId: number, userName: string} | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setImagePreview(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!content.trim() && !imagePreview) return;
    setIsSubmitting(true);
    await createPostAction({ content, imageUrl: imagePreview || undefined });
    setContent('');
    setImagePreview(null);
    setIsSubmitting(false);
  };

  const handleLike = async (postId: number) => {
    await toggleLikeAction(postId);
  };

  const handleCommentLike = async (commentId: number) => {
    await toggleCommentLikeAction(commentId);
  }

  const handleComment = async (postId: number) => {
    if (!commentText.trim()) return;
    const parentId = replyingTo ? replyingTo.commentId : undefined;
    await addCommentAction(postId, commentText, parentId);
    setCommentText('');
    setReplyingTo(null);
  };

  const formatTime = (dateStr: string) => {
    let parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      parsed = new Date(dateStr.replace(' ', 'T') + 'Z');
    }
    if (isNaN(parsed.getTime())) return '';
    
    const diff = Date.now() - parsed.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `${days} d`;
  };

  const renderComment = (c: CommentType, isReply = false) => {
    const isLiked = c.likes.includes(currentUserId);
    return (
      <div key={c.id} className={`${styles.commentItem} ${isReply ? styles.isReply : ''}`}>
        {c.userAvatar ? (
          <img src={c.userAvatar} className={styles.commentAvatar} />
        ) : (
          <div className={styles.commentAvatarFallback}>{c.userName.charAt(0)}</div>
        )}
        
        <div className={styles.commentBodyWrapper}>
          <div className={styles.commentContent}>
            <span className={styles.commentAuthor}>{c.userName}</span>
            <span className={styles.commentText}>{c.content}</span>
          </div>
          
          <div className={styles.commentMeta}>
            <span>{formatTime(c.createdAt)}</span>
            {c.likes.length > 0 && <span>{c.likes.length} Me gusta</span>}
            <button 
              className={styles.replyBtn} 
              onClick={() => {
                setActiveCommentPostId(c.postId);
                setReplyingTo({ commentId: c.parentId || c.id, userName: c.userName });
              }}
            >
              Responder
            </button>
            {c.userId === currentUserId && (
               <span style={{cursor:'pointer', color:'#ff6b6b'}} onClick={() => alert('Eliminar comentario (por implementar)')}>•••</span>
            )}
          </div>
        </div>
        
        <div className={styles.commentLikeCol}>
          <button className={styles.commentLikeBtn} onClick={() => handleCommentLike(c.id)}>
            {isLiked ? (
               <svg viewBox="0 0 24 24" width="12" height="12" fill="#ff3040" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ) : (
               <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.feedContainer}>
      
      {/* Creador de Publicaciones (Estilo IG/Threads simple) */}
      <div className={styles.createPostCard}>
        <div className={styles.createPostHeader}>
          {currentUserAvatar ? (
            <img src={currentUserAvatar} className={styles.avatar} alt="Mi perfil" />
          ) : (
            <div className={styles.avatarFallback}>{currentUserName?.charAt(0).toUpperCase()}</div>
          )}
          <div className={styles.createPostInputWrapper}>
            <textarea 
              className={styles.createPostTextarea} 
              placeholder="¿Qué te habló Dios en esta semana?"
              value={content}
              onChange={e => {
                setContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
        </div>
        
        {imagePreview && (
          <div className={styles.imagePreviewWrapper}>
            <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
            <button className={styles.removeImageBtn} onClick={() => setImagePreview(null)}>✕</button>
          </div>
        )}

        <div className={styles.createPostActions}>
          <label className={styles.iconBtn}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Foto</span>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </label>
          <button 
            className={styles.publishBtn} 
            onClick={handlePost}
            disabled={isSubmitting || (!content.trim() && !imagePreview)}
          >
            Publicar
          </button>
        </div>
      </div>

      {/* Lista de Publicaciones */}
      <div className={styles.postsList}>
        {posts.map(post => {
          const isLiked = post.likes.includes(currentUserId);
          const topLevelComments = post.comments.filter(c => !c.parentId);
          
          return (
            <div key={post.id} className={styles.postCard}>
              {/* Header (Author) */}
              <div className={styles.postHeader}>
                {post.userAvatar ? (
                  <img src={post.userAvatar} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>{post.userName.charAt(0)}</div>
                )}
                <div>
                  <p className={styles.postAuthor}>{post.userName}</p>
                </div>
                {post.userId === currentUserId && (
                  <button 
                    className={styles.moreOptionsBtn} 
                    onClick={async () => {
                      if(confirm('¿Eliminar esta publicación?')) {
                        await deletePostAction(post.id);
                      }
                    }}
                  >
                    •••
                  </button>
                )}
              </div>

              {/* Contenido Texto (si hay y no hay imagen, o arriba de la imagen) */}
              {post.content && !post.imageUrl && (
                 <p className={styles.postContent}>{post.content}</p>
              )}

              {/* Imagen principal */}
              {post.imageUrl && (
                <div className={styles.postImageWrapper} onDoubleClick={() => handleLike(post.id)}>
                  <img src={post.imageUrl} className={styles.postImage} />
                </div>
              )}

              {/* Actions Row (Heart, Comment) */}
              <div className={styles.postActions}>
                <button className={styles.actionIconBtn} onClick={() => handleLike(post.id)}>
                  {isLiked ? <HeartFilled /> : <HeartOutline />}
                </button>
                <button className={styles.actionIconBtn} onClick={() => {
                  setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                  setReplyingTo(null);
                }}>
                  <CommentIcon />
                </button>
              </div>

              {/* Likes count */}
              {post.likes.length > 0 && (
                <p className={styles.likesText}>
                  Les gusta a <b>{post.likes.length} personas</b>
                </p>
              )}

              {/* Caption (Text con imagen) */}
              {post.content && post.imageUrl && (
                 <p className={styles.postCaption}>
                   <b>{post.userName}</b> {post.content}
                 </p>
              )}

              {/* Comments Section */}
              <div className={styles.commentsSection}>
                {activeCommentPostId === post.id && topLevelComments.map(c => {
                  const replies = post.comments.filter(r => r.parentId === c.id);
                  return (
                    <div key={c.id}>
                      {renderComment(c)}
                      {replies.map(r => renderComment(r, true))}
                    </div>
                  );
                })}

                {/* Quick Add Comment (Always visible or toggled) */}
                <div className={styles.addCommentRow} style={{ display: (activeCommentPostId === post.id || post.comments.length === 0) ? 'flex' : 'none' }}>
                  <input 
                    type="text" 
                    placeholder={replyingTo ? `Respondiendo a ${replyingTo.userName}...` : "Agrega un comentario..."}
                    className={styles.commentInput}
                    value={activeCommentPostId === post.id ? commentText : ''}
                    onChange={e => {
                      if (activeCommentPostId !== post.id) setActiveCommentPostId(post.id);
                      setCommentText(e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleComment(post.id);
                    }}
                  />
                  {replyingTo && (
                    <button className={styles.cancelReplyBtn} onClick={() => setReplyingTo(null)}>✕</button>
                  )}
                  {commentText && activeCommentPostId === post.id && (
                    <button className={styles.sendCommentBtn} onClick={() => handleComment(post.id)}>
                      <SendIcon />
                    </button>
                  )}
                </div>
                
                {post.comments.length > 0 && activeCommentPostId !== post.id && (
                  <p 
                    className={styles.viewAllCommentsBtn}
                    onClick={() => setActiveCommentPostId(post.id)}
                  >
                    Ver los {post.comments.length} comentarios
                  </p>
                )}
              </div>

            </div>
          );
        })}
        {posts.length === 0 && (
          <p style={{ textAlign: 'center', color: '#a0aab2' }}>No hay publicaciones aún. ¡Sé el primero en compartir!</p>
        )}
      </div>

    </div>
  );
}
