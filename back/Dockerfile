FROM python:3.14.3-slim-trixie

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ARG APP_PATH=/megacte-back

ARG APP_UID=10001
ARG APP_GID=10001

RUN groupadd --gid ${APP_GID} megacte \
  && useradd --uid ${APP_UID} --gid ${APP_GID} --create-home --shell /bin/bash megacte

WORKDIR $APP_PATH

COPY app/ ./app/
COPY pyproject.toml uv.lock ./
COPY alembic.ini .
COPY migrations ./migrations
COPY config ./config
COPY --chmod=+x docker-backend-start.sh .

RUN  uv sync --frozen --no-dev \
  && chown -R ${APP_UID}:${APP_GID} ${APP_PATH}

ENV PATH="${APP_PATH}/.venv/bin:$PATH"

USER megacte

CMD ["./docker-backend-start.sh"]
