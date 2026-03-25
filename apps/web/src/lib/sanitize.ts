import sanitize from "sanitize-html";

/**
 * Sanitize user-generated text content to prevent XSS.
 * Strips all HTML tags — use for plain text fields like posts, comments, chat messages.
 */
export function sanitizeText(input: string): string {
  return sanitize(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

/**
 * Sanitize user-generated rich HTML content.
 * Allows safe formatting tags but strips scripts, event handlers, etc.
 */
export function sanitizeHtml(input: string): string {
  return sanitize(input, {
    allowedTags: [
      "b", "i", "em", "strong", "u", "s", "p", "br", "ul", "ol", "li",
      "a", "blockquote", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
  });
}
