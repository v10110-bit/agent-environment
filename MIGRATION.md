# Extraction record

## Before

Source: workspace `.opencode/`, seven physical files:

- `opencode.json`: five agent entries; native V2 ordered permissions.
- `agents/{discovery,plan,build,review}.md`: core role prompts.
- `agents/english-learning-curator.md`: optional learning workflow.
- `README.md`: installation, permissions, and approval documentation.

All roles were manually selected primary agents with no delegation.
Models: discovery/review/English high, plan medium, build low, all
`opencode/gpt-6.1-sol`. Core roles allowed workspace external access, asked
outside it, and asked for sensitive environment files. Discovery allowed only
scratch edits automatically; plan allowed requested plan documents with approval;
review denied edits. Build allowed edits and its explicit local command list,
with later approval exceptions. English allowed only canonical dataset writes
with approval and one exporter command. Prompts contained machine-specific paths.

The destination did not exist. The application repository was clean at inventory.
No source plugins, skills, package manifests, or other hidden files were present.

## After

- `opencode.json` → `config/opencode.json` (core entries), plus
  `optional/english-learning/opencode.json` (English entry).
- Four core prompts → `config/agents/`, with applicable-instruction references.
- English prompt → `optional/english-learning/agents/`, project-relative.
- README → repository `README.md`, rewritten for installation and ownership.
- Added this inventory and dependency-free permission regression tests.

Workspace-root, scratch, and absolute-plan patterns are machine-local complete
patterns loaded by native file substitution. This preserves the installed core
permission resources while failing closed when settings are missing.
Core shell rules and models are unchanged. English is opt-in and its project
files/export command are now Location-relative, not machine-specific.

The old physical directory is replaced only after staging validation. Its seven
superseded files are removed after link/discovery validation; the installation
path remains solely a symlink to `agent-environment/config`. Workspace `AGENTS.md`
remains workspace-owned and documents that ownership. No application, deployment,
global OpenCode/provider configuration, or English project data is moved.

## Actual validation (OpenCode v2.4.0)

- Six Node regression tests passed.
- Staged symlink installation loaded all four core roles. Their effective
  permission arrays and model objects exactly matched the original installation.
- Native OpenCode loading with nonexistent scope files produced empty permission
  resources, not `/*` grants. The optional English prompt/model loaded separately.
- After switching and reloading, API checks at the workspace root and each of
  `platform/apps/{backend,frontend,mcp}` found four visible primary core agents,
  original effective permissions/models, portable prompts, and no English agent.
- Installation: workspace `.opencode` → `agent-environment/config` (relative link).
- All seven original physical files listed above were removed after validation.
- `platform` remained clean. The new repository has no commits or remotes.

Limitations: permission tests evaluate rule matching, not arbitrary shell
execution or an OS sandbox. No model calls, application builds, Docker actions,
or interactive approval trials were needed or run. Initial agent API requests
can return an empty list while a new location initializes; settled subsequent
requests were used for assertions. Existing sessions retain their agent/model.
