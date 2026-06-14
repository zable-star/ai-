import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas, validate } from '../src/middleware/validation.js';
import { ValidationError } from '../src/utils/errors.js';
import { successResponse } from '../src/utils/helpers.js';
import { isImageGenerationProfile } from '../src/controllers/aiController.js';

test('createModelProfile fills enabled default and strips unknown fields', () => {
  const { error, value } = schemas.createModelProfile.validate({
    name: 'DeepSeek',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKey: 'sk-test',
    ignored: true,
  }, {
    stripUnknown: true,
  });

  assert.equal(error, undefined);
  assert.equal(value.enabled, true);
  assert.equal(value.ignored, undefined);
});

test('updateModelProfile rejects empty updates', () => {
  const { error } = schemas.updateModelProfile.validate({});

  assert.ok(error);
  assert.equal(error.details[0].type, 'object.min');
});

test('createModelProfile accepts Doubao image generation provider', () => {
  const { error, value } = schemas.createModelProfile.validate({
    name: 'Seedream',
    provider: 'doubaoImage',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
    model: 'doubao-seedream-4-0-250828',
    apiKey: 'sk-test',
  });

  assert.equal(error, undefined);
  assert.equal(value.provider, 'doubaoImage');
});

test('image profile detection separates Seedream from chat models', () => {
  assert.equal(isImageGenerationProfile({
    provider: 'doubaoImage',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
    model: 'doubao-seedream-4-0-250828',
  }), true);

  assert.equal(isImageGenerationProfile({
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
  }), false);
});

test('aiRefineImage accepts prompt and canvas image', () => {
  const { error, value } = schemas.aiRefineImage.validate({
    prompt: '把这幅图变成高清插画',
    canvasImage: 'data:image/png;base64,abc',
  });

  assert.equal(error, undefined);
  assert.equal(value.size, '1024x1024');
  assert.equal(value.referenceMode, 'redraw');
  assert.equal(value.responseFormat, 'b64_json');
});

test('createDrawing requires an actions array', () => {
  const { error } = schemas.createDrawing.validate({
    name: 'Untitled',
    actions: { type: 'drawShape' },
  });

  assert.ok(error);
  assert.equal(error.details[0].path.join('.'), 'actions');
});

test('validate middleware replaces request body with sanitized values', () => {
  const middleware = validate(schemas.login);
  const req = {
    body: {
      username: 'demo',
      password: 'secret',
      extra: 'remove me',
    },
  };
  let called = false;

  middleware(req, {}, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.deepEqual(req.body, {
    username: 'demo',
    password: 'secret',
  });
});

test('validate middleware throws app validation errors', () => {
  const middleware = validate(schemas.register);

  assert.throws(
    () => middleware({ body: { username: 'no', password: '123' } }, {}, () => {}),
    ValidationError,
  );
});

test('successResponse keeps null payloads and optional messages', () => {
  assert.deepEqual(successResponse(null, 'Deleted'), {
    success: true,
    data: null,
    message: 'Deleted',
  });
});
