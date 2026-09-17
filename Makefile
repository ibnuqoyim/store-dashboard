.PHONY: all lint typecheck test test-e2e verify build

all: verify

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

test:
	npm run test:coverage
	npm run test:scripts

test-e2e:
	npm run test:e2e

build:
	NEXT_PUBLIC_SUPABASE_URL=$${NEXT_PUBLIC_SUPABASE_URL:-http://127.0.0.1:54321} NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-test-anon-key} npm run build

verify: lint typecheck test build
	@echo "=== All quality gate checks passed successfully! ==="
