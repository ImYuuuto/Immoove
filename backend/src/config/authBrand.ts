/**
 * Name of cookie used to stroe the current access token.
 */
export const ACCESS_COOKIE_NAME = 'immoove_access';

/**
 * Identifier of the app that issues the JWT
 * 
 * stored inside the JWT and checcked when verifying the 
 * source of the token
 */
export const JWT_ISSUER = 'immoove-api';

/**
 * Identifies the intended recipients of the JWT.
 *
 * During token verification, the API can check that the token was issued
 * for the expected web application.
 */
export const JWT_AUDIENCE = 'immoove-web';
