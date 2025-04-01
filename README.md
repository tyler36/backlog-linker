# Backlog-linker

[![testing](https://github.com/tyler36/backlog-linker/actions/workflows/testing.yml/badge.svg)](https://github.com/tyler36/backlog-linker/actions/workflows/testing.yml)

## Overview

This GitHub action replaces Backlog issue references with links when posted onto GitHub.
Given the following comment:

`This fixes #issue-123.` becomes `This fixes [#issue-123](https://example.com/view/issue-123).`

## Usage

Add a workflow to `.github/workflows` similar to the below example:

```yml
on:
  issue_comment:
    types: [created, edited]

jobs:
  comment-notes:
    runs-on: ubuntu-latest
    name: 'backlog-linker'
    permissions:
      contents: write
      issues: write
    steps:
      # To use this repository's private action,
      # you must check out the repository
      - name: Checkout
        uses: actions/checkout@v4
      - name: Commit notes
        uses: tyler36/backlog-linker
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          backlog-url: ${{ secrets.BACKLOG_URL }}
          backlog-project-id: ${{ secrets.BACKLOG_PROJECT_ID }}
```

### Configuration

This action requires configuration before usage.
It is recommended to add these as GitHub secrets to prevent their display in other actions or logs.

| Name                 | Required | Description                      |
| -------------------- | :------: | -------------------------------- |
| `backlog-url`        |    ✅    | URL to Backlog workspace         |
| `backlog-project-id` |    ✅    | Project ID keyword to search for |

### backlog-url

This value should contain the URL to your Backlog workspace.
It will form the beginning of convert links and should include the protocol.

For example:

- <https://example.backlog.com>
- <https://example.backlog.jp>
- <https://my-instance.backlog.com>

### backlog-project-id

This is the project ID used by backlog.
This action will search for link hints such as `#ISSUE-123` where:

- Backlog Project ID is prefixed with a `#`, suffix with a `-` and followed by numbers.
- The above is not already surrounded by `[]`.
- Project ID is case insensitive.
- Multiple IDs may be entered, seperated by `,`.
