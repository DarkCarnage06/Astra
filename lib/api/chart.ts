/**
 * lib/api/chart.ts
 *
 * Typed API client for the ASTRA FastAPI backend.
 * All communication with the backend goes through this file.
 * Never call fetch() directly in UI components.
 */

import { trackApiLatency, trackChartGenerated } from '../analytics';
import type { ChartRequest, ChartResponse, ApiErrorResponse } from '../types/chart';

// ---------------------------------------------------------------------------
// API base URL — configured via environment variable
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ChartApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly detail?: string;

  constructor(statusCode: number, errorCode: string, message: string, detail?: string) {
    super(message);
    this.name = 'ChartApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// POST /api/chart
// ---------------------------------------------------------------------------

/**
 * Generate a Vedic birth chart from the given birth details.
 * Calls the FastAPI backend at POST /api/chart.
 *
 * @throws ChartApiError on API error responses
 * @throws Error on network failure or timeout
 */
export async function generateChart(request: ChartRequest): Promise<ChartResponse> {
  const startTime = Date.now();
  const endpoint = '/api/chart';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startTime;
    trackApiLatency(endpoint, latencyMs);

    if (!response.ok) {
      let errorBody: ApiErrorResponse;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {
          error: 'unknown_error',
          message: `API returned ${response.status} ${response.statusText}`,
        };
      }
      throw new ChartApiError(
        response.status,
        errorBody.error,
        errorBody.message,
        errorBody.detail,
      );
    }

    const chart: ChartResponse = await response.json();
    trackChartGenerated(chart.metadata.calculationTimeMs);
    return chart;
  } catch (err) {
    if (err instanceof ChartApiError) throw err;

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ChartApiError(408, 'timeout', 'Chart generation timed out. Please try again.');
    }

    throw new ChartApiError(
      0,
      'network_error',
      'Unable to reach the ASTRA server. Please check your connection.',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// GET /health — ping the backend
// ---------------------------------------------------------------------------

export async function pingBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
