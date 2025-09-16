# Maintainers

In this document, you can find various pieces of information about the gill sdk and its associated packages. From
architecture and build steps to foot-guns and gotchas.

This should be a living document to describe in detail anything the maintainers of this repository feel the need should
be specifically elaborated on.

# Publishing and versioning

This monorepo contains many the many packages that constitute the "gill sdk". Including `gill` and those scoped within
`@gillsdk` (e.g. `@gillsdk/react`).

## Versioning

This repo uses [changesets](https://github.com/changesets/changesets) to aid in versioning and auto generating the
various package changelog documents.

On each PR that requires a version bump (major, minor, or patch), simply run the `pnpm changeset` command. This will
automatically detect which packages had code files changed and requiring a version bump.

The `changeset` command will create a markdown file in the [.changeset](./.changeset/) directory which will be auto
detected by the Changeset bot when PRs are pushed to github.

## Publishing new versions

All package versions are published by the [publish-packages](./.github/workflows/publish-packages.yml) action.

When a PR is merged to the `master` branch, this github action will do one of two things:

1. Read all the available changeset files and create/update a "Version Packages" PR that details all the changes since
   the last version bump, generate changelog entries for them, and perform appropriate version bumps.
   ([See example here](https://github.com/gillsdk/gill/pull/218)).
2. If the last merge to the `master` branch was a "Version Packages" PR, the actions will publish all the changed
   packages.

This repo has an NPM token stored in it for the [`gill-maintainers`](https://www.npmjs.com/~gill-maintainers) NPM user
which is the CI bot account for publishing. This account should be the only authorized user to publish these packages,
helping to mitigate various supply chain attacks that have become so common :/

# Multiple import paths

The core `gill` library is constructed in such a way to have multiple "import paths" to access different functionality.
Including:

```ts
import { ... } from "gill";
import { ... } from "gill/programs";
import { ... } from "gill/node";
```

To achieve this, the `gill` package includes the following configurations:

- "exports" fields in the [`package.json`](./packages/gill/package.json) for each of these paths
- TSUP entries for each desired paths ([see here](./packages/gill/tsup.config.package.ts))
- tsconfig settings for each path ([see here](./packages/gill/tsconfig.declarations.json))

Altering (or removing these) configuration settings will break these "import paths" for consumers of the `gill` package
in different ways.

For example, altering the tsconfig declarations from:

```json
{
    ...
    "include": ["src/programs/token/index.ts", "src/programs/index.ts", "src/node/index.ts", "src/index.ts", "src/types"]
}
```

to

```json
{
    ...
    "include": ["src"]
}
```

will break developer experience by removing all the types from the different paths.

# Token Metadata program client

The included Token Metadata program client was generated using [Codama](https://github.com/codama-idl/codama).

## Minimal functionality

Given the IDL, Codama will generate a LOT of code that we simply do not need to or want to ship within the gill sdk. So
we (manually) removed it. Gill intentionally only ships a minimal amount of Token Metadata functionality to get most
users by with core uses (namely attaching metadata to legacy SPL tokens)

Care should be taken when regenerating this program client. Especially to prevent the `gill` package size from
ballooning (and therefore developer applications from ballooning.)

## Naming collisions

There is a naming collision between the Token Metadata program and the SPL Token/Token22 program clients for the
`MintArgs` type.

Since gill ships a generated client for Token Metadata, and reexports the Token22 client from its source package, the
Token Metadata's `MintArgs` were renamed to `MetadataMintArgs`.

See
[token-metadata/generated/types/mintArgs.ts](./packages/gill/src/programs/token-metadata/generated/types/mintArgs.ts)
