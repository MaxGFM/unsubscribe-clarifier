# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Unsubscribe Clarifier, please report it privately.
Do not open a public GitHub issue for security reports.

You can expect:
- Acknowledgment of your report within some time.
- An initial assessment within even more time.
- A fix released within the most amount of time allowable for confirmed vulnerabilities, or a clear explanation if longer is needed.

Please include:
- A description of the issue and its potential impact.
- Steps to reproduce.
- Any proof-of-concept code.
- Your name and contact info if you'd like credit in the release notes.

## Scope

In scope:
- The extension code itself (content.js, background.js, lexicons.js).
- The manifest and its permission claims.
- The build and release process.

Out of scope:
- Vulnerabilities in Firefox itself (report to Mozilla).
- Vulnerabilities in websites the extension runs on.
- Social engineering of the maintainer.

## Supported Versions

Only the latest published version receives security updates. Users should keep auto-updates enabled.

## Verification

Each release's SHA-256 hash is published in the GitHub release notes.
You can verify a downloaded .xpi against the source with `./verify.sh path/to/downloaded.xpi`.