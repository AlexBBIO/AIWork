# Astra comparison version

Published route: `/astra`. The root homepage, its assets, and its assessment data are preserved. This version builds on repository commit `1fc936f1c7166da1cf988a58daa7530932c975ce`, including the other audit work merged after the initial cloud checkout.

## Model changes

- Compute forecasts from explicit, unrounded gap-closure rates and conditional caps. Do not infer a permanent asymptote from two rounded forecasts. The cap can change independently of the current score.
- Anchor the current point at the October 27 assessment cutoff and use consistent six-month dates. Label history retrospective; retain its scalar scores pending an evidence-qualified re-scoring rather than inventing corrected historical values.
- Show finite forecasts and an optional extension through 2030. A plateau or an annual-gain convention is not a permanent human share.
- Classify physical execution, regulation/accountability, and human preference separately. These are qualitative tags. The dataset does not yet identify their separate, overlapping numerical contributions; the numeric cap remains an explicit joint scenario assumption.
- Preserve current scores and task allocations where the evidence does not support precise replacements. Surface their limitations locally and allow readers to adjust both capability assumptions and occupation time mixes. Current default index: 47.9200% pay-weighted / 50.4439% worker-weighted. Astra twelve-month baseline: 59.3295% / 61.6202%.
- Archive the issued baseline in `astra/forecast-2026-10-27.json`. Never overwrite it on rebuild. The record includes the input commit, dates, task parameters, index values and occupation forecasts for both weightings.
- Validate finite ranges, shares, override targets, dates, task/source references, taxonomy identity and model configuration. A slowdown threshold not reached within the horizon is explicitly null.

## Evidence and data

All 98 employment/wage rows were reconciled against the official BLS May 2025 workbook, including combined SOC groups and rounded mean wages. `astra/bls-verification.json` retains the component codes and finer source figures; database architects, statisticians and residual engineers are now searchable by component code.

Direct source checks confirmed GDPval's Opus 4.1 win/tie figure, Anthropic's Opus 5.5 GDPval-AA figure, the Scale RLI leaderboard, and the scope and conclusions of the METR Opus 5.5 evaluation. METR explicitly says its GPT-5.6 Sol horizon estimate is not a robust measurement. These checks are recorded as specific claims, rather than treating retrieval as validation of all downstream interpretations. Other inherited evidence, especially the inaccessible ESADE paper and secondary references, remains identified as unverified in this pass.

The Method view explains the benchmark-to-task-time calibration gap, task-share provenance, coverage, review costs, different weightings, source-date discipline, and the fixed current-work basket. Its comparison table computes the actual published occupation mixes. It does not repeat the manuscript's different illustrative mixes as validation of the live site.

## UX changes

- A current estimate, a dated forecast and constraints have distinct meanings and presentation.
- Early occupation search, globally ranked results, sector filtering, aliases, constituent SOC search and stable deep links.
- Task details with local evidence, source links, constraints, and a scenario editor that previews whole-index impact before applying.
- Editable occupation time mixes with an exact 100% check.
- Independent Astra scenario storage, URL-shareable edits/mixes/weighting, baseline reset, CSV export and inspectable input JSON.
- Consistent color meaning; future remainder is beyond the forecast, not permanently human.
- Responsive chart geometry, focusable points with a textual readout, a data table, native weighting controls, and a skip link that preserves the view. No floating tooltip requiring dismissal or rebinding after resize.
- Light/dark layouts and explicit mobile controls. Evidence-quality detail lives in Method and task pages rather than dominating the overview.

## Development and publication

`node scripts/build.mjs` validates both versions, generates `dist/astra/bundle.json`, and preserves the original build output. `vercel.json` maps `/astra` to the comparison document; assets use `/astra/` as their base. `dist/astra/version.json` records the deployed Git revision for post-deployment verification.

Run `node --test` and the build. `scripts/smoke.mjs` now exercises both versions, including Astra routes, constituent SOC search, applying a scenario, restoring it in a new browser context and resetting it. It accepts `CHROMIUM_PATH` for an installed browser. It keeps application/local asset errors fatal while treating unavailable optional Google Fonts separately.

When publishing a new assessment, update the Astra configuration and dates deliberately, review the per-task rates/constraints/evidence, and create a new immutable forecast vintage. The build rejects a configuration pointing at a different assessment or inconsistent six-month target dates. Shared scenario URLs also carry an assessment identifier; edits from a different assessment are not silently applied.
