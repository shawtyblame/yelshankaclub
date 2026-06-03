import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL, useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './GalleryItem.module.css';

export default function GalleryItem() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [editComment, setEditComment] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/gallery/${id}`)
      .then(res => res.json())
      .then(data => {
        let images = [];
        if (data.images) {
          try {
            images = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
          } catch {
            images = [data.images];
          }
        } else if (data.image) {
          images = [data.image];
        }
        setItem({ ...data, images });
        
        return fetch(`${API_URL}/gallery/${id}/comments`);
      })
      .then(res => res.json())
      .then(commentsData => {
        const commentsMap = {};
        commentsData.forEach(c => {
          commentsMap[c.image_id] = c;
        });
        setComments(commentsMap);
      })
      .catch(err => console.error('Failed to fetch:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const saveComment = (imageId) => {
    if (!commentText.trim()) return;
    
    fetch(`${API_URL}/gallery/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        image_id: imageId,
        comment_ru: commentText
      })
    })
      .then(res => res.json())
      .then(updatedComments => {
        const commentsMap = {};
        updatedComments.forEach(c => {
          commentsMap[c.image_id] = c;
        });
        setComments(commentsMap);
        setEditComment(null);
        setCommentText('');
      })
      .catch(err => console.error('Failed to save comment:', err));
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item || !item.images || item.images.length === 0) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <Link to="/works" className={styles.back}>← Назад</Link>
            <div className={styles.empty}>Работа не найдена</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <Link to="/works" className={styles.back}>← Назад</Link>
          
          <h1 className={styles.title}>{item.title_ru}</h1>
          
          {item.description_ru && (
            <p className={styles.description}>{item.description_ru}</p>
          )}
          
          <div className={styles.gallery}>
            {item.images.map((img, idx) => {
              const imageId = img;
              return (
                <div key={idx} className={styles.imageItem}>
                  <div 
                    className={styles.imageWrapper}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`${item.title_ru} ${idx + 1}`} />
                  </div>
                  
                  <div className={styles.imageInfo}>
                    <span className={styles.imageNumber}>Фото {idx + 1}</span>
                    
                    {user?.role === 'admin' && (
                      <div className={styles.commentSection}>
                        {editComment === imageId ? (
                          <div className={styles.commentEdit}>
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Комментарий..."
                              className={styles.commentInput}
                            />
                            <div className={styles.commentActions}>
                              <button 
                                onClick={() => saveComment(imageId)}
                                className={styles.saveBtn}
                              >
                                Сохранить
                              </button>
                              <button 
                                onClick={() => { setEditComment(null); setCommentText(''); }}
                                className={styles.cancelBtn}
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { 
                              setEditComment(imageId); 
                              setCommentText(comments[imageId]?.comment_ru || ''); 
                            }}
                            className={styles.editCommentBtn}
                          >
                            {comments[imageId]?.comment_ru ? 'Редактировать комментарий' : 'Добавить комментарий'}
                          </button>
                        )}
                        
                        {comments[imageId]?.comment_ru && editComment !== imageId && (
                          <div className={styles.commentText}>
                            {comments[imageId].comment_ru}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!user || user.role !== 'admin' && comments[imageId]?.comment_ru && (
                      <div className={styles.commentText}>
                        {comments[imageId].comment_ru}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}