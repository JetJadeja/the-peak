import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } from '../config';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a username for multiplayer game
 * @param username - The username to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateUsername(username: unknown): ValidationResult {
  // Check if username exists
  if (!username) {
    return {
      isValid: false,
      error: 'Username is required',
    };
  }

  // Check if username is a string
  if (typeof username !== 'string') {
    return {
      isValid: false,
      error: 'Username must be a string',
    };
  }

  // Trim whitespace
  const trimmedUsername = username.trim();

  // Check if empty after trimming
  if (trimmedUsername.length === 0) {
    return {
      isValid: false,
      error: 'Username cannot be empty',
    };
  }

  // Check minimum length
  if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${MIN_USERNAME_LENGTH} characters`,
    };
  }

  // Check maximum length
  if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at most ${MAX_USERNAME_LENGTH} characters`,
    };
  }

  // Check for valid characters (alphanumeric, spaces, underscores, hyphens)
  const validUsernameRegex = /^[a-zA-Z0-9 _-]+$/;
  if (!validUsernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, spaces, underscores, and hyphens',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Sanitizes a username by trimming whitespace
 * Should only be called after validation passes
 * @param username - The username to sanitize
 * @returns Sanitized username
 */
export function sanitizeUsername(username: string): string {
  return username.trim();
}

/**
 * Validates a color hex string
 * @param color - The color hex string to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateColor(color: unknown): ValidationResult {
  // Check if color exists
  if (!color) {
    return {
      isValid: false,
      error: 'Color is required',
    };
  }

  // Check if color is a string
  if (typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a string',
    };
  }

  // Check if valid hex color format (#RRGGBB)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorRegex.test(color)) {
    return {
      isValid: false,
      error: 'Color must be a valid hex color (e.g., #FF0000)',
    };
  }

  return {
    isValid: true,
  };
}
