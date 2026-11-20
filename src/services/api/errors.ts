/**
 * Standardized error classes and classifications for the CredLock API client.
 */

export type ApiClientErrorType =
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PARSE_ERROR'
  | 'UNEXPECTED_RESPONSE';

export class ApiClientError extends Error {
  public readonly type: ApiClientErrorType;
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly url?: string;
  public override readonly cause?: unknown;

  constructor(options: {
    type: ApiClientErrorType;
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    url?: string;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'ApiClientError';
    this.type = options.type;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.url = options.url;
    this.cause = options.cause;

    // Restore prototype chain
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }

  static httpError(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
    url?: string
  ): ApiClientError {
    return new ApiClientError({
      type: 'HTTP_ERROR',
      status,
      message,
      code,
      details,
      url,
    });
  }

  static networkError(message = 'Network connection failed', cause?: unknown, url?: string): ApiClientError {
    return new ApiClientError({
      type: 'NETWORK_ERROR',
      message,
      code: 'NETWORK_ERROR',
      cause,
      url,
    });
  }

  static timeoutError(timeoutMs: number, url?: string): ApiClientError {
    return new ApiClientError({
      type: 'TIMEOUT_ERROR',
      message: `Request timed out after ${timeoutMs}ms`,
      code: 'TIMEOUT',
      url,
    });
  }

  static parseError(message = 'Failed to parse server response as JSON', cause?: unknown, url?: string): ApiClientError {
    return new ApiClientError({
      type: 'PARSE_ERROR',
      message,
      code: 'PARSE_ERROR',
      cause,
      url,
    });
  }

  static unexpectedResponse(message: string, url?: string): ApiClientError {
    return new ApiClientError({
      type: 'UNEXPECTED_RESPONSE',
      message,
      code: 'UNEXPECTED_RESPONSE',
      url,
    });
  }

  /**
   * Returns a friendly, safe user-readable message suitable for display in UI.
   */
  public getUserFriendlyMessage(): string {
    switch (this.type) {
      case 'TIMEOUT_ERROR':
        return 'The request took too long to respond. Please check your internet connection and try again.';
      case 'NETWORK_ERROR':
        return 'Unable to reach the CredLock security service. You may be offline or experiencing network issues.';
      case 'PARSE_ERROR':
        return 'Received an invalid response from the server.';
      case 'HTTP_ERROR':
        if (this.status === 404) {
          return this.message || 'The requested cybersecurity data was not found.';
        }
        if (this.status === 400) {
          return this.message || 'Invalid request parameters provided.';
        }
        if (this.status === 429) {
          return 'Rate limit exceeded. Please wait a few moments before trying again.';
        }
        if (this.status && this.status >= 500) {
          return 'The security intelligence service encountered a server error. Please try again later.';
        }
        return this.message || 'An error occurred while communicating with the service.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }

  public isNotFound(): boolean {
    return this.status === 404;
  }

  public isTimeout(): boolean {
    return this.type === 'TIMEOUT_ERROR';
  }

  public isNetworkError(): boolean {
    return this.type === 'NETWORK_ERROR';
  }

  public isValidationError(): boolean {
    return this.status === 400 || this.code === 'VALIDATION_ERROR';
  }

  public isServerError(): boolean {
    return (this.status !== undefined && this.status >= 500) || this.code === 'INTERNAL_SERVER_ERROR';
  }
}
