import { Page } from '@playwright/test';
import {
  ACTIVE_SUBMISSIONS_RESPONSE,
  ARCHIVED_SUBMISSIONS_RESPONSE,
  ALL_SUBMISSIONS_RESPONSE,
  CREATE_RESPONSE,
  UPDATE_RESPONSE,
  DELETE_RESPONSE,
  RESTORE_RESPONSE,
  HISTORY_RESPONSE_ACTIVE,
  HISTORY_RESPONSE_ARCHIVED,
} from './mock-data';

interface MockOverrides {
  listActive?: object;
  listArchived?: object;
  listAll?: object;
  create?: object;
  update?: object;
  delete?: object;
  restore?: object;
  history?: object;
}

const API_HOST = 'localhost:9999';

function isApiCall(url: URL): boolean {
  return url.host === API_HOST;
}

/**
 * Set up page.route() interceptors for all API endpoints.
 * Responds with canned JSON -- no real backend calls.
 *
 * Every matcher checks isApiCall() first so we never intercept
 * page navigations (e.g. localhost:8081/submissions).
 */
export async function setupApiMocks(page: Page, overrides: MockOverrides = {}) {
  // POST /submissions/*/restore (must be registered BEFORE general /submissions/* handlers)
  await page.route(
    (url) => isApiCall(url) && /\/submissions\/[^/]+\/restore$/.test(url.pathname),
    (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(overrides.restore ?? RESTORE_RESPONSE),
        });
      }
      return route.fallback();
    },
  );

  // GET /submissions/*/history
  await page.route(
    (url) => isApiCall(url) && /\/submissions\/[^/]+\/history$/.test(url.pathname),
    (route) => {
      const url = route.request().url();
      if (url.includes('sub-003')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(overrides.history ?? HISTORY_RESPONSE_ARCHIVED),
        });
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(overrides.history ?? HISTORY_RESPONSE_ACTIVE),
      });
    },
  );

  // GET /submissions/all (dashboard)
  await page.route(
    (url) => isApiCall(url) && url.pathname.endsWith('/submissions/all'),
    (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(overrides.listAll ?? ALL_SUBMISSIONS_RESPONSE),
      });
    },
  );

  // GET /submissions?status=active | GET /submissions?status=archived | POST /submissions
  await page.route(
    (url) =>
      isApiCall(url) &&
      url.pathname.endsWith('/submissions') &&
      !url.pathname.endsWith('/all'),
    (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(overrides.create ?? CREATE_RESPONSE),
        });
      }
      // GET -- check status param
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      if (status === 'archived') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(overrides.listArchived ?? ARCHIVED_SUBMISSIONS_RESPONSE),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(overrides.listActive ?? ACTIVE_SUBMISSIONS_RESPONSE),
      });
    },
  );

  // PUT /submissions/:id | DELETE /submissions/:id
  await page.route(
    (url) => isApiCall(url) && /\/submissions\/[^/]+$/.test(url.pathname),
    (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(overrides.update ?? UPDATE_RESPONSE),
        });
      }
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(overrides.delete ?? DELETE_RESPONSE),
        });
      }
      return route.fallback();
    },
  );
}

/**
 * Clear localStorage to prevent draft recovery dialogs
 * and inter-test state leakage.
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}
