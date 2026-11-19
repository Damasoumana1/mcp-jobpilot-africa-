from __future__ import annotations

import argparse
import os
import hmac

from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from jobpilot.database.connection import init_db
from jobpilot.database.seed import seed_demo_data
from jobpilot.mcp_app import mcp

# Import tools so they register on the shared mcp instance
import jobpilot.tools.application_tools  # noqa: F401
import jobpilot.tools.candidate_tools  # noqa: F401
import jobpilot.tools.interview_tools  # noqa: F401
import jobpilot.tools.job_tools  # noqa: F401


class BearerTokenMiddleware:
    """Require a bearer token only when the HTTP server is configured with one."""

    def __init__(self, app, token: str):
        self.app = app
        self.token = token

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        authorization = dict(scope.get("headers", [])).get(b"authorization", b"")
        scheme, _, credential = authorization.decode("latin-1").partition(" ")
        if scheme.lower() != "bearer" or not hmac.compare_digest(
            credential.strip(), self.token
        ):
            response = JSONResponse(
                {"error": "Unauthorized: a valid bearer token is required"},
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)


def startup() -> None:
    """Initialize database tables and populate seed data if missing."""
    init_db()
    seed_demo_data()


# Ensure database and seed data are initialized when imported by FastMCP or external runners
startup()


def main() -> None:
    """Entrypoint to run the JobPilot Africa MCP server."""
    parser = argparse.ArgumentParser(description="JobPilot Africa MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse", "http"],
        default=os.getenv("MCP_TRANSPORT", "stdio"),
        help="Transport protocol to use (default: stdio)",
    )
    parser.add_argument(
        "--host",
        default=os.getenv("MCP_HOST", "127.0.0.1"),
        help="Host for network transports",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("MCP_PORT", "8000")),
        help="Port for network transports",
    )
    parser.add_argument(
        "--cors-origin",
        action="append",
        default=[
            origin.strip()
            for origin in os.getenv("MCP_CORS_ORIGINS", "").split(",")
            if origin.strip()
        ],
        help="Trusted browser origin; may be repeated",
    )
    parser.add_argument(
        "--bearer-token",
        default=os.getenv("MCP_BEARER_TOKEN"),
        help="Optional bearer token required by HTTP transports",
    )
    parser.add_argument(
        "--web",
        action="store_true",
        help="Launch the interactive Web Dashboard on http://localhost:8000",
    )
    args = parser.parse_args()

    startup()

    if args.web:
        from jobpilot.web import run_web_server
        run_web_server(host=args.host, port=args.port)
        return

    if args.transport == "stdio":
        mcp.run(transport="stdio")
    elif args.transport in ("sse", "http"):
        middleware = []
        if args.cors_origin:
            middleware.append(
                Middleware(
                    CORSMiddleware,
                    allow_origins=args.cors_origin,
                    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
                    allow_headers=["Authorization", "Content-Type", "Accept"],
                )
            )
        if args.bearer_token:
            middleware.append(
                Middleware(BearerTokenMiddleware, token=args.bearer_token)
            )
        mcp.run(
            transport=args.transport,
            host=args.host,
            port=args.port,
            middleware=middleware or None,
        )
    else:
        mcp.run()


if __name__ == "__main__":
    main()
