# syntax=docker/dockerfile:1.7
FROM arm64v8/node:trixie

ENV DEBIAN_FRONTEND=noninteractive


RUN apt-get update && apt-get install -y \
      git curl openssl ca-certificates bash tzdata \
      build-essential python3 pkg-config unzip \
 && update-ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
# Bun を /usr/local/bin にインストール
ENV BUN_INSTALL=/usr/local
RUN curl -fsSL https://bun.sh/install | bash && /usr/local/bin/bun --version
# 念のため PATH を明示
ENV PATH="/usr/local/bin:${PATH}"

# 作業ディレクトリ
WORKDIR /app

# 依存関係のキャッシュを効かせる
COPY package.json bun.lockb* ./
RUN bun install --no-progress
RUN bun i -g @openai/codex || true
# アプリ本体
COPY . .

# デフォルトコマンド（docker compose 側で上書き可）
CMD ["bun", "run", "dev"]
