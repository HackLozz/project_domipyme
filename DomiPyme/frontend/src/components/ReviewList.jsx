// ReviewList.jsx - Lista de reseñas con filtros y acciones
import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import api from './Api';
import { useAuth } from '../context/AuthProvider';
import '../styles.css';

const ReviewList = ({ productId, onReviewUpdate = null }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/reviews/product-reviews/${productId}/`, {
        params: {
          sort: sortBy,
          page: currentPage
        }
      });
      setReviews(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 10));
    } catch (err) {
      console.error('Error al cargar reseñas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!user) {
      alert('Debes iniciar sesión para marcar reseñas como útiles');
      return;
    }

    try {
      const response = await api.post(`/api/reviews/${reviewId}/mark-helpful/`);
      // Actualizar el estado local
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              is_helpful: response.data.is_helpful,
              helpful_count: response.data.helpful_count 
            }
          : review
      ));
    } catch (err) {
      console.error('Error al marcar como útil:', err);
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      }
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      return;
    }

    try {
      await api.delete(`/api/reviews/${reviewId}/`);
      setReviews(reviews.filter(review => review.id !== reviewId));
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (err) {
      console.error('Error al eliminar reseña:', err);
      alert('Error al eliminar la reseña');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && currentPage === 1) {
    return <div className="loading-spinner">Cargando reseñas...</div>;
  }

  return (
    <div className="review-list-container">
      <div className="review-list-header">
        <h3>Reseñas de Clientes</h3>
        <div className="sort-controls">
          <label htmlFor="sort-select">Ordenar por:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="recent">Más recientes</option>
            <option value="helpful">Más útiles</option>
            <option value="rating_high">Calificación: Alta a Baja</option>
            <option value="rating_low">Calificación: Baja a Alta</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>Aún no hay reseñas para este producto.</p>
          <p>¡Sé el primero en dejar una reseña!</p>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-author">
                    <strong>{review.user_name || review.user_email}</strong>
                    {review.verified_purchase && (
                      <span className="verified-badge" title="Compra verificada">
                        ✓ Compra verificada
                      </span>
                    )}
                  </div>
                  <div className="review-date">
                    {formatDate(review.created_at)}
                  </div>
                </div>

                <div className="review-rating">
                  <StarRating rating={review.rating} size="small" />
                </div>

                <div className="review-comment">
                  <p>{review.comment}</p>
                </div>

                <div className="review-actions">
                  <button
                    className={`btn-helpful ${review.is_helpful ? 'active' : ''}`}
                    onClick={() => handleMarkHelpful(review.id)}
                    disabled={!user || review.user_email === user?.email}
                    title={review.user_email === user?.email ? 'No puedes marcar tu propia reseña' : 'Marcar como útil'}
                  >
                    👍 Útil ({review.helpful_count})
                  </button>

                  {review.can_edit && (
                    <div className="review-owner-actions">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => setEditingReview(review)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(review.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {review.updated_at !== review.created_at && (
                  <div className="review-edited">
                    <small>Editado: {formatDate(review.updated_at)}</small>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1 || loading}
                className="btn btn-secondary"
              >
                ← Anterior
              </button>
              <span className="page-info">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages || loading}
                className="btn btn-secondary"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de edición */}
      {editingReview && (
        <div className="modal-overlay" onClick={() => setEditingReview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingReview(null)}>×</button>
            <ReviewForm
              productId={productId}
              existingReview={editingReview}
              onSuccess={() => {
                setEditingReview(null);
                fetchReviews();
                if (onReviewUpdate) {
                  onReviewUpdate();
                }
              }}
              onCancel={() => setEditingReview(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Importar ReviewForm inline
import ReviewForm from './ReviewForm';

export default ReviewList;
