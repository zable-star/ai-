import pool from '../config/database.js';
import { getDecryptedProfile } from './modelController.js';
import { ValidationError } from '../utils/errors.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

export const chat = asyncHandler(async (req, res) => {
  const { profileId, messages, temperature } = req.body;

  // Get active profile
  let profile;
  if (profileId) {
    profile = await getDecryptedProfile(profileId, req.user.id);
    if (!profile) {
      throw new ValidationError('Model profile not found');
    }
  } else {
    // Get first enabled profile
    const result = await pool.query(
      `SELECT id FROM model_profiles
       WHERE user_id = $1 AND enabled = true
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('No active model configuration found. Please configure a model first.');
    }

    profile = await getDecryptedProfile(result.rows[0].id, req.user.id);
  }

  if (!profile || !profile.enabled) {
    throw new ValidationError('Selected model profile is not enabled');
  }

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
