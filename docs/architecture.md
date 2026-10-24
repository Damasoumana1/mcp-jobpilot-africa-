# Architecture

## Overview

The MVP is a local MCP server that exposes tools for job discovery and application tracking. It uses SQLite as the local data layer, with service modules for the business logic and tools for the MCP interface.

## Layers

1. MCP tools layer
   - Exposes the operations available to the AI agent
2. Service layer
   - Contains job search, matching logic, application logic and interview preparation logic
3. Database layer
   - Manages local SQLite access and schema initialization
4. Data files
   - Stores demo data for local validation

## Main flows

- Search jobs
- Read one job
- Match candidate and job
- Create/update application status
- Generate interview questions
- Create preparation checklist
