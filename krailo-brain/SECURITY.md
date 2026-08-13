# Security Policy

## Scope

`krailo-brain` is an evolving AI runtime and agent operating environment.

Security issues affecting the runtime, tools, integrations, authentication,
authorization, secrets, persistent state, or execution layer should be
reported responsibly.

## Reporting

For security vulnerabilities, please avoid opening a public issue with
sensitive technical details.

Contact the repository maintainer privately through GitHub.

## Secrets

Secrets must never be committed to the repository.

Use environment variables, Cloudflare secrets, or another dedicated secret
management mechanism for credentials.

Examples include:

* API keys
* access tokens
* private keys
* passwords
* Cloudflare credentials
* GitHub credentials
* database credentials

## Supported State

This project is currently under active architecture and implementation.

Security guarantees may change as the runtime evolves.

## Responsible Disclosure

Please provide:

* a description of the issue;
* affected component;
* reproduction steps where safe;
* potential impact;
* suggested mitigation if known.

I will investigate security reports and address confirmed issues as
appropriate.
