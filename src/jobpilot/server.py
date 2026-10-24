from __future__ import annotations

import argparse
import os

from jobpilot.database.connection import init_db
from jobpilot.database.seed import seed_demo_data
from jobpilot.mcp_app import mcp

# Import tools so they register on the shared mcp instance
import jobpilot.tools.application_tools  # noqa: F401
import jobpilot.tools.candidate_tools  # noqa: F401
import jobpilot.tools.interview_tools  # noqa: F401
import jobpilot.tools.job_tools  # noqa: F401


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
    args = parser.parse_args()

    startup()

    if args.transport == "stdio":
        mcp.run(transport="stdio")
    elif args.transport in ("sse", "http"):
        mcp.run(transport=args.transport, host=args.host, port=args.port)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
