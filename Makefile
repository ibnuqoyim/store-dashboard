.PHONY: all lint typecheck verify build

all: verify

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

build:
	npm run build

verify: lint typecheck build
	@echo "=== All quality gate checks passed successfully! ==="
