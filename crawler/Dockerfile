FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum* ./

COPY . .
RUN go mod tidy && CGO_ENABLED=1 go build -o crawler .

FROM alpine:3.19

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder /app/crawler .

RUN mkdir -p /app/data

EXPOSE 3849

CMD ["./crawler"]
