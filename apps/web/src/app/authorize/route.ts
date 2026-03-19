// Root-level proxy for /oauth/authorize
// Claude.ai constructs OAuth paths relative to the server root, ignoring
// the authorization_endpoint from OAuth metadata. This proxies to the real handler.
export { GET, POST } from "@/app/oauth/authorize/route";
