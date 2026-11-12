import {
  FAVORITES_PAGE,
  FAVORITES_SECTION_VIEW,
  SEARCH_PAGE,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_SECTION,
  SEARCH_SECTION_VIEW,
} from "../config/constants";

export type PageKind = "list" | "post" | "favorites" | "other";

export function detectPageKind(search: string): PageKind {
  const params = new URLSearchParams(search);
  const page = params.get(SEARCH_PARAM_PAGE);
  const section = params.get(SEARCH_PARAM_SECTION);

  if (page === SEARCH_PAGE && section === SEARCH_SECTION) {
    return "list";
  }
  if (page === SEARCH_PAGE && section === SEARCH_SECTION_VIEW) {
    return "post";
  }
  if (page === FAVORITES_PAGE && section === FAVORITES_SECTION_VIEW) {
    return "favorites";
  }
  return "other";
}

export function readPostIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const page = params.get(SEARCH_PARAM_PAGE);
  const section = params.get(SEARCH_PARAM_SECTION);
  const id = params.get(SEARCH_PARAM_ID);
  if (page !== SEARCH_PAGE || section !== SEARCH_SECTION_VIEW) {
    return null;
  }
  if (id === null || id.trim().length === 0) {
    return null;
  }
  if (!/^\d+$/.test(id)) {
    return null;
  }
  return id;
}
