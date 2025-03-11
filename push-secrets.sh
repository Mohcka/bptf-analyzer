#!/bin/bash

# Try to find GitHub CLI
if command -v gh &>/dev/null; then
    # Use native Linux gh if available
    GH_CMD="gh"
    echo "Using native Linux GitHub CLI"
elif [ -f "/mnt/c/Users/miked/scoop/shims/gh.exe" ]; then
    # Fall back to Windows executable through WSL
    GH_CMD="/mnt/c/Users/miked/scoop/shims/gh.exe"
    echo "Using Windows GitHub CLI through WSL"
else
    echo "Error: GitHub CLI (gh) not found. Please install it on Linux or Windows."
    echo "Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "Windows: https://cli.github.com/"
    exit 1
fi

# Ensure gh CLI is accessible
if ! "$GH_CMD" --version &>/dev/null; then
    echo "Error: GitHub CLI (gh) found but not working properly at $GH_CMD"
    exit 1
fi

# Load GitHub configuration from .env.github
GITHUB_ENV_FILE=".env.github"

if [ ! -f "$GITHUB_ENV_FILE" ]; then
    echo "Error: Could not find .env.github file at $GITHUB_ENV_FILE"
    exit 1
fi

# Load variables from .env.github
export $(grep -v '^#' "$GITHUB_ENV_FILE" | xargs)

# Check required variables
if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
    echo "Error: OWNER and REPO must be set in .env.github"
    exit 1
fi

# Check if .env file exists
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Could not find .env file at $ENV_FILE"
    exit 1
fi

# Authenticate with GitHub if not already authenticated
if ! "$GH_CMD" auth status &>/dev/null; then
    echo "You need to authenticate with GitHub CLI."
    "$GH_CMD" auth login
fi

# Read .env file and process secrets
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
        continue
    fi

    # Extract key and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        SECRET_NAME="${BASH_REMATCH[1]}"
        SECRET_VALUE="${BASH_REMATCH[2]}"

        # Remove possible surrounding quotes from the value
        SECRET_VALUE=$(echo "$SECRET_VALUE" | sed -e 's/^"//' -e 's/"$//')

        echo "Processing secret: $SECRET_NAME"

        # Set the secret using gh secret set
        echo -n "$SECRET_VALUE" | "$GH_CMD" secret set "$SECRET_NAME" --repo "$OWNER/$REPO" -b -

        if [ $? -eq 0 ]; then
            echo "Secret '$SECRET_NAME' created/updated successfully."
        else
            echo "Error: Failed to create/update secret '$SECRET_NAME'."
        fi
    fi
done <"$ENV_FILE"