SESSION_NAME := $(shell basename $(CURDIR))

vibe: vibe-clean
	zellij --layout vibe attach $(SESSION_NAME) --create

vibe-clean:
	zellij kill-session $(SESSION_NAME) 2>/dev/null || true
	zellij delete-session $(SESSION_NAME) --force 2>/dev/null || true
