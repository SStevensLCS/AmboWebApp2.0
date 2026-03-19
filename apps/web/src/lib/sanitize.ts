import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-generated text content to prevent XSS.
 * Strips all HTML tags — use for plain text fields like posts, comments, chat messages.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Sanitize user-generated rich HTML content.
 * Allows safe formatting tags but strips scripts, event handlers, etc.
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "u", "s", "p", "br", "ul", "ol", "li",
      "a", "blockquote", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}
