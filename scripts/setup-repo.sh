#!/bin/bash

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Project structure setup"

# Instructions for GitHub setup
echo "To complete GitHub setup:"
echo "1. Create a new private repository on GitHub"
echo "2. Run the following commands:"
echo "   git remote add origin YOUR_GITHUB_REPO_URL"
echo "   git push -u origin main"
