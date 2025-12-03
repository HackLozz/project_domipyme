// ReviewForm.jsx - Formulario para crear/editar reseñas
import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import api from './Api';
import '../styles.css';

const ReviewForm = ({ productId, existingReview = null, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      setError('El comentario debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        product: productId,
        rating,
        comment: comment.trim()
      };

      if (existingReview) {
        // Actualizar reseña existente
        await api.patch(`/api/reviews/${existingReview.id}/`, data);
      } else {
        // Crear nueva reseña
        await api.post('/api/reviews/', data);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error al guardar reseña:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          setError(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          setError(errorData.detail || 'Error al guardar la reseña');
        }
      } else {
        setError('Error al guardar la reseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-container">
      <h3>{existingReview ? 'Editar Reseña' : 'Escribe una Reseña'}</h3>
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Calificación *</label>
          <StarRating
            rating={rating}
            interactive={true}
            onChange={setRating}
            size="large"
          />
          {rating > 0 && (
            <p className="rating-text">
              {rating === 1 && '⭐ Malo'}
              {rating === 2 && '⭐⭐ Regular'}
              {rating === 3 && '⭐⭐⭐ Bueno'}
              {rating === 4 && '⭐⭐⭐⭐ Muy Bueno'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excelente'}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comentario *</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos tu experiencia con este producto..."
            rows="5"
            maxLength="1000"
            required
            disabled={loading}
          />
          <small>{comment.length} / 1000 caracteres</small>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || rating === 0}
          >
            {loading ? 'Guardando...' : existingReview ? 'Actualizar Reseña' : 'Publicar Reseña'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
