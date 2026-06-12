import { AppError } from '../utils/errors.js';
import config from '../config/index.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error for debugging
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  // Handle operational errors
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
    });
  }

  // Handle Joi validation errors
  if (error.name === 'ValidationError' && error.isJoi) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      },
    });
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
        code: 'CONFLICT',
      },
    });
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return res.status(500).json({
    success: false,
    error: {
      message: config.nodeEnv === 'development'
        ? error.message
        : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
};
