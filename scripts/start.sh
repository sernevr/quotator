#!/bin/bash
cd "$(dirname "$0")/.."
docker compose up -d
echo "Quotator started at http://localhost:3847"
