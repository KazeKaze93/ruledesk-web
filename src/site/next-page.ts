import {
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
} from "../config/constants";
import { SITE_SELECTORS } from "./selectors";

const IMAGE_LIST_SELECTOR = SITE_SELECTORS.imageList;
const THUMB_SELECTOR = SITE_SELECTORS.thumb;
const PAGINATION_SELECTOR = "div.pagination";
const NEXT_LINK_SELECTOR = 'a[alt="next"]';

export type NextPageResult = {
  thumbs: Element[];
  nextUrl: string | null;
};

function resolveSameOriginUrl(url: string): string {
  const absolute = new URL(url, window.location.href);
  if (absolute.origin !== window.location.origin) {
    throw new Error(`Cross-origin next page URL rejected: ${absolute.origin}`);
  }
  return absolute.href;
}

function readNextUrl(doc: Document): string | null {
  const pagination = doc.querySelector(PAGINATION_SELECTOR);
  if (pagination === null) {
    return null;
  }
  const nextLink = pagination.querySelector(NEXT_LINK_SELECTOR);
  if (!(nextLink instanceof HTMLAnchorElement)) {
    return null;
  }
  const href = nextLink.getAttribute("href");
  if (href === null || href.length === 0 || href === "#") {
    return null;
  }
  try {
    return resolveSameOriginUrl(href);
  } catch {
    return null;
  }
}

function collectThumbs(doc: Document): Element[] {
  const imageList = doc.querySelector(IMAGE_LIST_SELECTOR);
  if (imageList === null) {
    return [];
  }
  return Array.from(imageList.querySelectorAll(THUMB_SELECTOR));
}

/**
 * Fetches a list page HTML document and extracts thumbs + the next-page URL.
 * Throws on network failure or non-OK HTTP status.
 */
export async function fetchNextPage(url: string): Promise<NextPageResult> {
  const requestUrl = resolveSameOriginUrl(url);
  const response = await fetch(requestUrl, {
    method: FETCH_METHOD_GET,
    credentials: FETCH_CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    thumbs: collectThumbs(doc),
    nextUrl: readNextUrl(doc),
  };
}
