import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      throw new ValidationError('Validation failed', details);
    }

    req.body = value;
    next();
  };
};

export const schemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
      }),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  createModelProfile: Joi.object({
    name: Joi.string().max(50).required(),
    provider: Joi.string()
      .valid('openai', 'deepseek', 'qwen', 'moonshot', 'zhipu', 'doubaoImage', 'other')
      .required(),
    endpoint: Joi.string().uri().required(),
    model: Joi.string().max(100).required(),
    apiKey: Joi.string().required(),
    enabled: Joi.boolean().default(true),
  }),

  updateModelProfile: Joi.object({
    name: Joi.string().max(50),
    provider: Joi.string().valid('openai', 'deepseek', 'qwen', 'moonshot', 'zhipu', 'doubaoImage', 'other'),
    endpoint: Joi.string().uri(),
    model: Joi.string().max(100),
    apiKey: Joi.string(),
    enabled: Joi.boolean(),
  }).min(1),

  createDrawing: Joi.object({
    name: Joi.string().max(100).required(),
    actions: Joi.array().required(),
    thumbnail: Joi.string().allow(null, '').optional(),
  }),

  updateDrawing: Joi.object({
    name: Joi.string().max(100),
    actions: Joi.array(),
    thumbnail: Joi.string().allow(null, ''),
  }).min(1),

  aiChat: Joi.object({
    profileId: Joi.string().uuid().optional(),
    messages: Joi.array().items(
      Joi.object({
        role: Joi.string().valid('system', 'user', 'assistant').required(),
        content: Joi.string().required(),
      })
    ).min(1).required(),
    temperature: Joi.number().min(0).max(2).default(0.1),
  }),

  aiRefineImage: Joi.object({
    profileId: Joi.string().uuid().optional(),
    prompt: Joi.string().min(2).max(2000).required(),
    canvasImage: Joi.string().max(8 * 1024 * 1024).allow(null, '').optional(),
    size: Joi.string().valid('512x512', '768x768', '1024x1024', '1024x768', '768x1024').default('1024x1024'),
    referenceMode: Joi.string().valid('redraw', 'reference').default('redraw'),
    responseFormat: Joi.string().valid('b64_json', 'url').default('b64_json'),
    guidanceScale: Joi.number().min(1).max(20).optional(),
    seed: Joi.number().integer().min(0).optional(),
    watermark: Joi.boolean().optional(),
  }),
};
