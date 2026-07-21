# BUILD-ui Context

Build Mappable as a lightweight static prototype.

Project source of truth:
- Use `../../PROJECT_CHARTER.md` for the shared prototype model, architecture rules, data contract, and agent workflow.

Core build rules:
- Use plain HTML and CSS.
- Use vanilla JavaScript only when interaction or data rendering requires it.
- Use local `.json` files as the data source and respect their corresponding `.schema.json` contracts.
- Keep prototypes runnable directly from `file://`.
- Do not add a framework, build step, server, router, package manager, dependency, or external library.
- Do not rely on HTTP requests from the prototype.
- Keep each prototype focused on demonstrating the product idea, not building production infrastructure.

Design guidance:
- Use `DESIGN_GUIDE.md` in this directory as the source of truth for visual direction, styling tokens, product layout patterns, and verification checks.
