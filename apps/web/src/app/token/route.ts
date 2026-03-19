// Root-level proxy for /oauth/token
// Claude.ai constructs OAuth paths relative to the server root, ignoring
// the token_endpoint from OAuth metadata. This proxies to the real handler.
export { POST, OPTIONS } from "@/app/oauth/token/route";
