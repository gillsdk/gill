# Contributing

## Bug fixes

If you've found a bug in gill that you'd like to fix, please [open an issue](https://github.com/gillsdk/gill/issues/new)
before working on specific code changes to ensure it is within scope and desire for this library. Once approved,
[submit a pull request](https://github.com/gillsdk/gill/pulls) with your changes. Include a helpful description of the
problem and how your changes address it, and provide tests so we can verify the fix works as expected.

## New features

If there's a new feature you'd like to see added to gill, please
[open an issue](https://github.com/gillsdk/gill/issues/new) before working on specific code changes to ensure it is
within scope and desire for this library.

Contributions are welcome and loved, but it's best to discuss major changes before investing time in implementation.

## System requirements

Before getting started, ensure your system has access to the following tools:

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

## Getting started

Clone and prepare the repo locally:

```sh
git clone https://github.com/gillsdk/gill.git
cd gill
pnpm install
```

Build all the packages in parallel (via Turborepo):

```sh
pnpm build
```

> Note: You must run the build command the first time manually before running the test commands detailed below.

To build a specific package, use the `--filter` flag:

```sh
pnpm build --filter=gill
pnpm build --filter=@gillsdk/react
# or multiple specific packages
pnpm build --filter=gill --filter=@gillsdk/react
```

## Running tests

All unit tests can be run at the same time (including rebuilding):

```sh
pnpm test
```

> Note: You must run the build command the first time manually before running the `test` command.

Please ensure that all tests are passing when submitting a pull request. If you're adding new features to the gill sdk,
always include tests.

## Pull request process

When submitting a pull request:

- Ensure the pull request title and description explain the changes you made and why you made them.
- Include a test plan section that outlines how you tested your contributions. We do not accept contributions without
  tests.
- Ensure all tests pass.

When a pull request is created, gill maintainers will be notified automatically.

## Communication

- **GitHub issues**: For bug reports and feature requests
- **GitHub pull requests**: For code contributions
