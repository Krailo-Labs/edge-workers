#!/usr/bin/env bash
set -euo pipefail

PROJECT="krailo-brain"

[ -d "krailo-vault" ] || { echo "❌ Запусти з edge-workers/"; exit 1; }
[ -e "$PROJECT" ] && { echo "❌ $PROJECT вже існує"; exit 1; }

mkdir -p "$PROJECT"/{docs,personality}
mkdir -p "$PROJECT"/memory/{facts,decisions,events,instructions,tasks,retrieval}
mkdir -p "$PROJECT"/runtime/{agent,sessions,state,execution,routing,prompt}
mkdir -p "$PROJECT"/projects/{liquidation-bot,eth-node,edge-workers}
mkdir -p "$PROJECT"/tools/{github,cloudflare,terminal,filesystem,web}
mkdir -p "$PROJECT"/integrations/{github,cloudflare,llm}
mkdir -p "$PROJECT"/config/{environments,schemas}
mkdir -p "$PROJECT"/src/{agent,memory,runtime,projects,tools,integrations}
mkdir -p "$PROJECT"/tests/{memory,runtime,tools,integration}

touch \
  "$PROJECT/README.md" \
  "$PROJECT/.gitignore" \
  "$PROJECT/.editorconfig" \
  "$PROJECT/.env.example" \
  "$PROJECT/LICENSE"

touch \
  "$PROJECT/docs/VISION.md" \
  "$PROJECT/docs/ARCHITECTURE.md" \
  "$PROJECT/docs/MEMORY.md" \
  "$PROJECT/docs/RUNTIME.md" \
  "$PROJECT/docs/PERSONALITY.md" \
  "$PROJECT/docs/PROJECTS.md" \
  "$PROJECT/docs/TOOLS.md" \
  "$PROJECT/docs/SECURITY.md" \
  "$PROJECT/docs/ROADMAP.md"

touch \
  "$PROJECT/personality/SOUL.md" \
  "$PROJECT/personality/USER.md" \
  "$PROJECT/personality/PRINCIPLES.md" \
  "$PROJECT/personality/BEHAVIOR.md"

touch "$PROJECT/memory/README.md"
touch "$PROJECT/runtime/README.md"
touch "$PROJECT/projects/README.md"
touch "$PROJECT/tools/README.md"
touch "$PROJECT/integrations/README.md"
touch "$PROJECT/config/README.md"
touch "$PROJECT/tests/README.md"

find "$PROJECT/memory" \
     "$PROJECT/runtime" \
     "$PROJECT/tools" \
     "$PROJECT/integrations" \
     "$PROJECT/config" \
     "$PROJECT/src" \
     "$PROJECT/tests" \
     -type d -empty -exec touch {}/.gitkeep \;

for p in liquidation-bot eth-node edge-workers; do
  touch \
    "$PROJECT/projects/$p/PROJECT.md" \
    "$PROJECT/projects/$p/CURRENT_STATE.md" \
    "$PROJECT/projects/$p/ARCHITECTURE.md" \
    "$PROJECT/projects/$p/DECISIONS.md"
done

cat > "$PROJECT/.gitignore" <<'EOF'
node_modules/
dist/
build/
.wrangler/
.env
.env.*
!.env.example
.dev.vars
coverage/
*.log
.DS_Store
EOF

cat > "$PROJECT/.editorconfig" <<'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
EOF

cat > "$PROJECT/.env.example" <<'EOF'
# krailo-brain environment
EOF

cat > "$PROJECT/README.md" <<'EOF'
# krailo-brain

Personal AI Runtime / Personal AI OS.

## Structure

- `personality/` — identity and behavior
- `memory/` — long-term memory
- `runtime/` — agent runtime
- `projects/` — persistent project state
- `tools/` — agent capabilities
- `integrations/` — external services
- `config/` — configuration
- `src/` — implementation
- `tests/` — tests
- `docs/` — architecture and design
EOF

echo "✅ krailo-brain structure created."
tree "$PROJECT"
