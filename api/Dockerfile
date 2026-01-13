FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app

COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true
RUN rm -rf src

COPY src ./src
RUN cargo build --release

FROM alpine:3.19

RUN apk add --no-cache libgcc

WORKDIR /app

COPY --from=builder /app/target/release/quotator-api .

RUN mkdir -p /app/data

ENV RUST_LOG=info

EXPOSE 3848

CMD ["./quotator-api"]
