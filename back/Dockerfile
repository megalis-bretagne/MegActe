FROM python:3.13-slim-trixie

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ARG APP_PATH=/megacte-back

WORKDIR $APP_PATH

COPY app/ ./app/
COPY pyproject.toml uv.lock ./
COPY alembic.ini .
COPY migrations ./migrations
COPY config ./config
COPY --chmod=+x docker-backend-start.sh .

RUN  uv sync --frozen

ENV PATH="${APP_PATH}/.venv/bin:$PATH"

EXPOSE 8080

CMD ["./docker-backend-start.sh"]
