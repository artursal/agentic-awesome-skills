# Local web CI pilot

This opt-in experiment measures the catalog web test/build tasks with Turborepo
2.11.7 and a local cache. It does not enable Vercel CI, connect a project, send
cache data to Vercel, deploy the site, or modify required GitHub checks. No cloud
compute is started. Vercel CI itself is metered; this is preparation and a local
cache experiment, not evidence of its hosted performance or free availability.

## Run locally

Use a disposable clean checkout with Node supported by `apps/web-app/package.json`.
Install root and app dependencies from their lockfiles:

```sh
npm ci --ignore-scripts
npm --prefix apps/web-app ci --ignore-scripts
npm run app:ci:pilot -- --dry-run
npm run app:ci:pilot
npm run app:ci:pilot
```

The first real run executes the unchanged `app:test` and `app:build` commands.
The next identical run should restore both results locally. `app:setup` always
runs first to recreate ignored public assets from the pinned catalog already in
the checkout. This pilot does not regenerate source catalog indexes or validate
new skill content; use the existing contribution/maintenance preflight for that.

Use `npm run app:ci:pilot -- --force` to execute both tasks even on a cache hit.
Inspect `.turbo/runs/*.json` for task status, hashes and cache outcomes. Delete
`.turbo/cache` to repeat a cold run. Do not treat replayed test logs as newly
executed tests. Timings printed by the wrapper include setup and task execution
separately; compare repeated samples on the same checkout and machine.

## Boundaries and invalidation

The wrapper forces `--cache=local:rw`, removes inherited `TURBO_*` configuration,
disables Turbo telemetry, rejects cloud/CI execution, and accepts only the two
options above. Tasks have no `ci` tags. Do not run `vercel ci enable`, log Turbo
into a remote cache, or add this command to a workflow under this experiment.
Cloud adoption needs separate proof that it meets the no-cost constraint.

Inputs conservatively include all normal repository files, including canonical
skills, data, docs, tooling, app sources and lockfiles. Generated sitemap and
backup index are excluded from inputs to avoid self-invalidating build output;
build outputs include those files and `dist`. Public skill data is recreated
before every cache lookup. Environment variables used by the build, local env
files, Node version, operating system/architecture, and HEAD commit participate
in cache identity. Keeping HEAD in the hash protects Git-derived Docs metadata;
it also prevents reuse across different commits, even when content is identical.
This is deliberately conservative and does not establish selective task skipping.

Required CI, semantic review, source validation, CodeQL, release and Pages
publication remain independent and unchanged. Cached local results never satisfy
an exact-head merge or release gate. The cache is trusted local development data,
not authenticated evidence or a deployable release artifact.

## Evaluation

Record cold/warm wall time, task hits/misses, correctness of restored output and
misses after source or environment changes. A successful warm repeat demonstrates
local reuse only. Hosted queue time, fork PR support, billing and end-to-end PR
improvement remain untested. Keep the pilot optional until those are evaluated.

References: [Vercel CI pricing](https://vercel.com/docs/ci/pricing),
[Turborepo run options](https://turborepo.dev/docs/reference/run).
