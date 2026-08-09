---
name: executable_tool_use
description: Provide precise, copy-pasteable CLI commands and bash scripts to automate environment setup. Make sure to use this skill whenever the user asks how to install something, setup a project, deploy, or configure environments.
---

# Executable Tool-Use & Automated Environment Infrastructure

## Core Philosophy & Critical Understanding

In modern software development, instructions that rely on manual user intervention, interactive wizards, or vague step-by-step prose introduce friction, human error, and environment divergence. The primary objective of executable tool-use is to transform environment setup from a high-cognitive-load, error-prone manual procedure into a single, deterministic, copy-pasteable execution block.

When providing commands, adopt the mindset of an automated systems infrastructure architect. Assume the execution environment may be a headless CI/CD runner, a remote SSH terminal, a local developer workspace, or an automated script container. Every command block must adhere to the **Zero-Prompt Principle**: no command should stall waiting for interactive TTY input (`[Y/n]`, selection menus, license agreements, or text input prompts).

Key principles governing this skill:
- **Determinism**: Given the same operating system and shell environment, the command sequence must produce the exact same outcome every time.
- **Idempotency**: Executing the script multiple times consecutively should not corrupt configurations, duplicate entries, or crash due to pre-existing directories or files.
- **Fail-Fast Safety**: Commands must be chained logically (`&&`) so that if a prerequisite step fails (e.g., package installation), downstream configuration commands halt immediately rather than operating on a broken state.
- **Explicit Visibility**: Avoid hidden magic. Commands should explicitly state non-interactive flags, environment overrides, and file modifications through readable inline syntax or heredocs.

---

## Execution Strategy (The "How")

Achieving flawless automated command generation requires a structured five-stage engineering strategy:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Environment & Context Discovery                     │
│    (OS, Shell Target, Package Managers, Privileges)     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 2. Dependency Sequencing & DAG Formulation             │
│    (Pre-checks ➔ Install ➔ Scaffold ➔ Patch ➔ Test)     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 3. Non-Interactive Hardening & Prompt Elimination      │
│    (Inject -y, --yes, heredocs, env suppressions)       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 4. Idempotency Guard Ingestion                         │
│    (mkdir -p, [ -f ] guards, atomic file writes)        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ 5. Verification & Health Check Architecture            │
│    (Smoke testing, status checks, clean exit codes)     │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Environment & Context Discovery
Before writing a single command line, analyze the user's explicit or implicit runtime context:
- **Operating System**: Linux (Debian/Ubuntu, RHEL/Fedora, Alpine), macOS, or Windows (PowerShell, CMD, WSL2).
- **Shell Runtime**: Bash, Zsh, or PowerShell. Adjust syntax for environment variables (`export KEY=VAL` vs `$env:KEY="VAL"`), path separators, and string escaping.
- **Privilege Boundaries**: Identify whether commands require elevated privileges (`sudo`, root) and structure scripts to minimize unnecessary `sudo` usage.

### Step 2: Dependency Sequencing & DAG Formulation
Structure the command block as a Directed Acyclic Graph (DAG) of logical operations:
1. **Pre-flight Checks**: Verify core runtimes (Node.js, Python, Docker, Rust) exist or install them first.
2. **Package & Binary Installation**: Fetch required packages using system or language package managers.
3. **Project Scaffolding**: Create directories and initialize projects using CLI flags rather than interactive generators.
4. **Configuration Injection**: Write config files (`.env`, `tsconfig.json`, `docker-compose.yml`, settings files) using non-destructive inline tools (Heredocs `cat << 'EOF'`).
5. **Post-Installation & Build**: Run dependency locks, database migrations, or initial build steps.

### Step 3: Non-Interactive Hardening & Prompt Elimination
Actively purge interactive prompts across all toolchains by supplying standard non-interactive flags:
- **APT / Linux**: `DEBIAN_FRONTEND=noninteractive apt-get install -yq <package>`
- **NPM / NPX**: `npm init -y`, `npx --yes <package>`, `npm install --no-audit --no-fund`
- **Create Next App**: `npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git`
- **Homebrew**: `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL ...)"`
- **PIP / Python**: `pip install --no-input --quiet <package>`
- **Docker / Compose**: `docker compose up -d --wait`
- **Git**: `git init -b main`, `git config --global init.defaultBranch main`

When a CLI tool lacks non-interactive flags, pipe inputs cleanly:
```bash
echo -e "input1\ninput2\n" | interactive-tool-command
```

### Step 4: Idempotency Guard Ingestion
Ensure the command block can be executed repeatedly without failing:
- Use `mkdir -p path/to/dir` to avoid errors if directories already exist.
- Use `[ -f .env ] || cp .env.example .env` to prevent overwriting existing environment configs.
- Use `grep -qxF 'line' file || echo 'line' >> file` to append configuration lines without duplicates.

### Step 5: Verification & Diagnostics
Every command block must conclude with explicit verification commands that prove the setup succeeded (e.g., printing versions, testing network bindings, or running a light test execution).

---

## Output Architecture

When implementing this skill, structure your response using the following standardized Markdown format:

```markdown
# Environment Setup: [System / Technology Stack Name]

## Prerequisites Verification
[Commands to check OS, runtime versions, package managers, and permissions]

## Automated Execution Commands
```bash
# Single pasteable block of resilient, non-interactive shell commands
```

## Command Breakdown & Mechanism
[Detailed explanation of flags, sequencing, idempotency guards, and heredoc configurations]

## Verification & Troubleshooting
[Sanity checks to validate installation success and resolutions for common failure modes]
```

---

## Critical Guidelines & Constraints

- **Purge Interactive Wizards**: Never output commands that stall waiting for terminal keypresses or prompt inputs. Always search for or synthesize non-interactive flags.
- **Single Copy-Paste Block**: Place the core installation sequence into a single unified code block so the user can paste it once into their terminal.
- **Quote & Escape Heredocs**: When writing inline configuration files with `cat << 'EOF'`, always quote `'EOF'` to prevent premature shell variable expansion inside the block.
- **Fail-Fast Chaining**: Use `&&` between dependent steps so execution stops immediately if a command returns a non-zero exit code.
- **Avoid Platform Ambiguity**: If Windows support is requested, provide pure PowerShell commands or explicitly target WSL2 Bash. Do not mix Bash syntax (`export`, `touch`) into PowerShell snippets.
- **Sanitizing Credentials**: Use placeholder environment variables (`DATABASE_URL="postgresql://user:password@localhost:5432/dbname"`) and advise the user where to supply secret keys.

---

## Rich Case Studies & Detailed Scenarios

### Scenario 1: Production-Ready Next.js, Tailwind CSS, and Prisma Stack Scaffolding

**User Request**: "Set up a full Next.js 14 project with TypeScript, Tailwind CSS, App Router, and Prisma ORM with PostgreSQL non-interactively."

**Executed Response Structure**:

# Environment Setup: Next.js + Tailwind CSS + Prisma Stack

## Prerequisites Verification
Ensure Node.js (v18.17+) and npm are available in your shell environment:

```bash
node -v && npm -v
```

## Automated Execution Commands

```bash
# 1. Non-interactive Next.js scaffolding with TypeScript and Tailwind CSS
npx create-next-app@latest next-prisma-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-git \
  && cd next-prisma-app \
  && git init -b main \

# 2. Install Prisma ORM and Prisma Client dependencies
  && npm install @prisma/client \
  && npm install -D prisma \

# 3. Non-interactive Prisma initialization
  && npx prisma init --datasource-provider postgresql \

# 4. Inject base Prisma schema definition via quoted heredoc
  && cat << 'EOF' > prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
EOF

# 5. Seed default environment configuration idempotently
  && [ -f .env ] || cat << 'EOF' > .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

echo "✓ Environment successfully scaffolded."
```

## Command Breakdown & Mechanism
- `create-next-app@latest`: The explicit CLI flags (`--typescript`, `--tailwind`, `--eslint`, `--app`, `--src-dir`, `--import-alias`, `--use-npm`, `--no-git`) bypass all interactive prompt questions that `create-next-app` normally presents.
- `cat << 'EOF'`: The single-quoted `'EOF'` delimiter guarantees that Prisma tokens like `@id` and `@default` are written verbatim into `schema.prisma` without premature shell substitution.
- `[ -f .env ] || ...`: Ensures pre-existing environment files are preserved if this setup script is executed inside an existing folder.

## Verification & Troubleshooting
Verify schema validation and format code non-interactively:

```bash
npx prisma validate && npx prisma format
```

---

### Scenario 2: Headless Python Data Science & PyTorch Environment with `uv`

**User Request**: "Configure a isolated Python 3.11 virtual environment with `uv`, PyTorch with CUDA 12.1 support, and Jupyter Core without interactive prompts."

**Executed Response Structure**:

# Environment Setup: Headless Python 3.11 + PyTorch CUDA Stack

## Prerequisites Verification
Check for Python 3.11 availability and curl utility:

```bash
python3.11 --version || echo "Python 3.11 is required."
```

## Automated Execution Commands

```bash
# 1. Install ultra-fast 'uv' package manager non-interactively
curl -LsSf https://astral.sh/uv/install.sh | sh \
  && export PATH="$HOME/.local/bin:$PATH" \

# 2. Create virtual environment pinned to Python 3.11
  && uv venv .venv --python 3.11 \
  && source .venv/bin/activate \

# 3. Install PyTorch with explicit CUDA 12.1 index URL non-interactively
  && uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \

# 4. Install data processing and Jupyter dependencies
  && uv pip install numpy pandas scikit-learn jupyterlab ipykernel \

# 5. Register virtual environment as Jupyter kernel non-interactively
  && python -m ipykernel install --user --name=ml-venv --display-name "Python 3.11 (ML Stack)" \

# 6. Generate explicit pyproject.toml configuration file
  && cat << 'EOF' > pyproject.toml
[project]
name = "ml-workspace"
version = "0.1.0"
description = "Automated PyTorch & Data Science Workspace"
requires-python = ">=3.11"
dependencies = [
    "torch",
    "torchvision",
    "torchaudio",
    "numpy",
    "pandas",
    "scikit-learn",
    "jupyterlab",
]
EOF

echo "✓ Python ML environment activated and kernel registered."
```

## Command Breakdown & Mechanism
- `uv venv .venv`: Creates an isolated, lightweight Python environment faster than standard `virtualenv`.
- `--index-url`: Directly targets the PyTorch CUDA 12.1 wheel repository, preventing pip from downloading CPU-only fallback binaries.
- `ipykernel install --user`: Bypasses root permission prompts by installing the Jupyter kernel definition directly within the user's home directory.

## Verification & Troubleshooting
Validate CUDA acceleration and PyTorch GPU availability:

```bash
python -c "import torch; print(f'PyTorch Version: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
```

---

### Scenario 3: Cross-Platform Docker Engine & Microservice Stack on Ubuntu Server

**User Request**: "Install Docker Engine, Docker Compose, and launch a Redis + PostgreSQL stack on a fresh Ubuntu 22.04 LTS server headlessly."

**Executed Response Structure**:

# Environment Setup: Docker Engine & Containerized Infrastructure

## Prerequisites Verification
Verify running system is Debian/Ubuntu Linux with sudo privileges:

```bash
lsb_release -a && sudo -v
```

## Automated Execution Commands

```bash
# 1. Non-interactive APT package index update and prerequisite setup
export DEBIAN_FRONTEND=noninteractive
sudo -E apt-get update -yq \
  && sudo -E apt-get install -yq ca-certificates curl gnupg lsb-release \

# 2. Add Docker official GPG key idempotently
  && sudo install -m 0755 -d /etc/apt/keyrings \
  && [ -f /etc/apt/keyrings/docker.gpg ] || curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
  && sudo chmod a+r /etc/apt/keyrings/docker.gpg \

# 3. Set up Docker repository non-interactively
  && echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null \

# 4. Install Docker Engine and Docker Compose Plugin
  && sudo -E apt-get update -yq \
  && sudo -E apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin \

# 5. Configure non-root docker group access idempotently
  && sudo groupadd -f docker \
  && sudo usermod -aG docker $USER \

# 6. Create microservices directory and generate docker-compose.yml
  && mkdir -p app-infrastructure && cd app-infrastructure \
  && cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: dev_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_password
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user -d app_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: dev_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
EOF

# 7. Start container services in detached mode and await health readiness
  && sudo docker compose up -d \

echo "✓ Docker stack deployed and services starting in background."
```

## Command Breakdown & Mechanism
- `export DEBIAN_FRONTEND=noninteractive`: Prevents `apt-get` from displaying interactive tzdata or service restart prompt dialogs during server updates.
- `sudo -E`: Preserves the `DEBIAN_FRONTEND` environment variable when invoking `apt-get` via `sudo`.
- `docker compose up -d`: Boots PostgreSQL and Redis containers headlessly without binding the terminal session.

## Verification & Troubleshooting
Check running container health status:

```bash
sudo docker compose ps
```

---

### Scenario 4: Automated Rust & WebAssembly Toolchain Scaffolding

**User Request**: "Install Rust toolchain, add the `wasm32-unknown-unknown` target, install `wasm-pack`, and scaffold a WebAssembly library project non-interactively."

**Executed Response Structure**:

# Environment Setup: Rust & WebAssembly Development Stack

## Prerequisites Verification
Check for build utilities and curl availability:

```bash
curl --version && gcc --version
```

## Automated Execution Commands

```bash
# 1. Install Rustup toolchain non-interactively (-y flag disables installation prompts)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable \
  && source "$HOME/.cargo/env" \

# 2. Add WebAssembly compilation target
  && rustup target add wasm32-unknown-unknown \

# 3. Install binary tools non-interactively
  && cargo install wasm-pack --quiet \
  && cargo install cargo-generate --quiet \

# 4. Scaffolding Rust WASM crate directory idempotently
  && mkdir -p wasm-lib && cd wasm-lib \
  && cat << 'EOF' > Cargo.toml
[package]
name = "wasm-lib"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"

[profile.release]
opt-level = "s"
lto = true
EOF

# 5. Inject lib.rs source file
  && mkdir -p src \
  && cat << 'EOF' > src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to WebAssembly.", name)
}
EOF

# 6. Execute initial WebAssembly compilation build test
  && wasm-pack build --target web \

echo "✓ Rust WASM toolchain initialized and initial build compiled."
```

## Command Breakdown & Mechanism
- `sh -s -- -y`: Passes `-y` to the Rustup shell installer script to automatically accept default installation paths without pausing for user input.
- `crate-type = ["cdylib", "rlib"]`: Configures Cargo to output dynamic WebAssembly C-compatible libraries required by `wasm-bindgen`.
- `wasm-pack build --target web`: Builds web-ready `.wasm` binaries and generated JS wrapper bindings in a single execution step.

## Verification & Troubleshooting
Verify generated WASM output pkg directory:

```bash
ls -la pkg/
```
