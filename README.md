# Shared agent environment

Canonical OpenCode configuration, without application knowledge, generated config,
plugins, or dependencies. Select `discovery`, `plan`, `build`, or `review` manually.
No role switches agents or delegates. Model choices are unchanged:
`opencode/gpt-6.1-sol` with high / medium / low / high variants respectively.

## Install (OpenCode V2)

Choose a workspace root and a checkout location. Keep workspace/project `AGENTS.md`
files in their existing locations; they own project architecture and conventions.
The checkout owns only shared roles and permissions.

Configure the workspace-root boundary using OpenCode's supported
`{file:...}` configuration substitution. These machine-local files are plain text,
**complete permission patterns**, not JSON, and must have **no trailing newline**:

```sh
workspace="$HOME/projects"                 # absolute, canonical path; not /
checkout="$workspace/agent-environment"    # wherever this repository is checked out
mkdir -p "$HOME/.config/agent-environment"
printf '%s/*' "$workspace" > "$HOME/.config/agent-environment/workspace-scope"
printf '%s/tmp/discovery/*' "$workspace" > "$HOME/.config/agent-environment/discovery-scope"
printf '%s/*/docs/plans/*' "$workspace" > "$HOME/.config/agent-environment/plans-scope"
```

Use the canonical root (resolve symlinks first), without a trailing slash or glob
characters. `workspace-scope` is the workspace-root setting; `/*` is included
because OpenCode matches complete permission resources. Do not use `*` or `/*`
as a scope. The scratch and plan patterns must remain inside that root.
The fixed `~/.config/agent-environment` location is independent of OpenCode's
global config directory and works through native home expansion.

After inspecting any existing `.opencode`, prepare and validate before switching:

```sh
ln -s "$checkout/config" "$workspace/.opencode"  # only when destination is absent
cd "$workspace"
opencode debug agents
```

When replacing an existing environment, retain its original files until validation
succeeds, then replace the directory with the link and remove only superseded
originals. Do not overwrite unrelated agents, skills, plugins, or configuration.
Run OpenCode from the workspace or its descendants. Configuration reloads
automatically; `/reload` forces reload. Existing sessions retain agent/model
selection. Verify discovery from each intended repository too.

No prompt editing is required on another machine. Missing/empty scope files
substitute to empty resources: outside access still asks, scratch edits ask,
and absolute plan paths are denied. There is no `ROOT` + `/*` concatenation that
could turn a missing setting into a filesystem-wide grant. Invalid nonempty
settings are not automatically validated: review them before reload.
Do not set `OPENCODE_CONFIG_DIR`, replace global configuration, or change provider
credentials/default models. Scope files contain no secrets and are not committed.

## Role boundaries

| Role | Edits | Shell |
| --- | --- | --- |
| Discovery | Own named scratch experiments allowed; elsewhere asks | Asks |
| Plan | Denied except requested `docs/plans` documents, which ask | Asks; non-destructive inspection only |
| Build | Allowed; external-directory boundary still asks outside workspace | Existing routine Git/pnpm/Node/Bun and listed local Compose/diagnostic allows |
| Review | Denied | Asks; non-destructive validation only |

The JSON is authoritative for exact command patterns. Build's existing allowlist
and later approval exceptions are preserved. Commits/pushes, global/toolchain
installs, external repositories/downloaded scripts, publishing/deployment/cloud,
secret inspection, and destructive cleanup require explicit authorization.
Project pnpm installs and approved local dev/build/test/typecheck work need no
redundant approval. Inspect scripts; verify Docker endpoints are local, operate
only on the task stack, and preserve volumes and unrelated containers.

Environment-file reads ask except `.env.example`. Unknown tools, MCP tools,
Code Mode, and delegation are denied. Permissions are not OS isolation: allowed
interpreters, scripts, Git, and Docker retain host authority. Never use them to
bypass approval. Read/glob/grep permissions are not comprehensive secret filters.
Workspace instructions and approvals remain necessary.

## Optional English-learning curator

`optional/english-learning/` retains the original learning workflow and high model,
outside the universal installation. It is not enabled by the core link.
To opt in, link its directory as `<english-project>/.opencode` (only if absent),
and start OpenCode **in that project's root**. Do not install it on the workspace
root: its dataset rules are Location-relative.

It reads the local README and two datasets; dataset writes ask. Only the fixed
`node export-anki.mjs` command is allowed, from that project's root. Other tools
and delegation remain denied. Workspace-external access remains denied, as before.
Unlisted workspace reads ask; nested paths do not inherit automatic dataset
access. The exporter itself is project-owned, not part of this repository.
No English datasets, exporter, or project documentation are moved.

## Validation

```sh
node --test tests/permissions.test.mjs
```

These dependency-free regression tests cover configured permissions, missing
settings, models, prompts, and optional-component separation. Also verify actual
OpenCode loading after installation (`opencode debug agents` or `/api/agent`);
the tests are not a substitute for OpenCode's own loader or shell scanner.
See `MIGRATION.md` for the source inventory and move record.
