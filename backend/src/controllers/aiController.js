import pool from '../config/database.js';
import { getDecryptedProfile } from './modelController.js';
import { ValidationError } from '../utils/errors.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

async function resolveModelProfile(profileId, userId) {
  if (profileId) {
    const profile = await getDecryptedProfile(profileId, userId);
    if (!profile) {
      throw new ValidationError('Model profile not found');
    }
    return profile;
  }

  const result = await pool.query(
    `SELECT id FROM model_profiles
     WHERE user_id = $1
       AND enabled = true
       AND provider <> 'doubaoImage'
       AND endpoint NOT ILIKE '%/images/generations%'
       AND model NOT ILIKE '%seedream%'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('No active semantic/chat model configuration found. Please configure a chat model first.');
  }

  return await getDecryptedProfile(result.rows[0].id, userId);
}

async function resolveImageProfile(profileId, userId) {
  if (profileId) return await resolveModelProfile(profileId, userId);

  const result = await pool.query(
    `SELECT id FROM model_profiles
     WHERE user_id = $1
       AND enabled = true
       AND (
         provider = 'doubaoImage'
         OR endpoint ILIKE '%/images/generations%'
         OR model ILIKE '%seedream%'
       )
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('No image generation model configuration found. Please add and enable a Doubao image generation profile first.');
  }

  return await getDecryptedProfile(result.rows[0].id, userId);
}

function ensureEnabledProfile(profile) {
  if (!profile || !profile.enabled) {
    throw new ValidationError('Selected model profile is not enabled');
  }
}

export function isImageGenerationProfile(profile) {
  return Boolean(
    profile?.provider === 'doubaoImage' ||
      profile?.endpoint?.includes('/images/generations') ||
      /seedream/i.test(profile?.model || '')
  );
}

function ensureSemanticProfile(profile) {
  if (isImageGenerationProfile(profile)) {
    throw new ValidationError('Selected profile is an image generation model. Please choose a semantic/chat model for instruction planning.');
  }
}

export const chat = asyncHandler(async (req, res) => {
  const { profileId, messages, temperature } = req.body;

  const profile = await resolveModelProfile(profileId, req.user.id);
  ensureEnabledProfile(profile);
  ensureSemanticProfile(profile);

  // Make request to AI model
  try {
    const response = await fetch(profile.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify({
        model: profile.model,
        messages,
        temperature: temperature || 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI model error:', errorText);
      throw new Error(`AI model request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract response based on common OpenAI-compatible format
    const aiResponse = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    res.json(successResponse({
      response: aiResponse,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    }));
  } catch (error) {
    console.error('AI model proxy error:', error);
    throw new Error(`Failed to communicate with AI model: ${error.message}`);
  }
});

function buildImagePayload(profile, body) {
  const payload = {
    model: profile.model,
    prompt: body.prompt,
    response_format: body.responseFormat || 'b64_json',
    size: body.size || '1024x1024',
  };

  if (body.canvasImage && body.referenceMode === 'reference') {
    payload.image = body.canvasImage;
    payload.images = [body.canvasImage];
  }
  if (body.guidanceScale) payload.guidance_scale = body.guidanceScale;
  if (body.seed) payload.seed = body.seed;
  if (body.watermark !== undefined) payload.watermark = body.watermark;

  return payload;
}

function extractGeneratedImage(data) {
  const first = data?.data?.[0] || data?.images?.[0] || data?.result?.data?.[0] || data?.result?.images?.[0];
  const b64 = first?.b64_json || first?.b64 || first?.base64 || data?.b64_json || data?.image_base64;
  const url = first?.url || first?.image_url || data?.url || data?.image_url;

  if (b64) {
    const cleaned = String(b64).startsWith('data:image/') ? String(b64) : `data:image/png;base64,${b64}`;
    return { imageDataUrl: cleaned };
  }
  if (url) return { imageUrl: url };
  return null;
}

export const refineImage = asyncHandler(async (req, res) => {
  const profile = await resolveImageProfile(req.body.profileId, req.user.id);
  ensureEnabledProfile(profile);

  try {
    console.log('[AI refine] calling image model', {
      userId: req.user.id,
      provider: profile.provider,
      model: profile.model,
      size: req.body.size || '1024x1024',
      referenceMode: req.body.referenceMode || 'redraw',
      endpoint: profile.endpoint,
    });
    const response = await fetch(profile.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify(buildImagePayload(profile, req.body)),
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error('Image model returned non-JSON response. Please check the image generation endpoint.');
    }

    if (!response.ok) {
      console.error('AI image model error:', responseText);
      const message = data?.error?.message || data?.message || response.statusText;
      console.error('[AI refine] image model failed', {
        status: response.status,
        statusText: response.statusText,
        provider: profile.provider,
        model: profile.model,
      });
      throw new Error(`AI image request failed: ${response.status} ${message}`);
    }

    const image = extractGeneratedImage(data);
    if (!image) {
      throw new Error('Image model response did not include b64_json or url image data.');
    }

    console.log('[AI refine] image model success', {
      provider: profile.provider,
      model: profile.model,
    });
    res.json(successResponse({
      ...image,
      provider: profile.provider,
      model: profile.model,
    }));
  } catch (error) {
    console.error('AI image proxy error:', error);
    throw new Error(`Failed to generate refined image: ${error.message}`);
  }
});
