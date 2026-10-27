# Headroom

A regularly updated model of how much U.S. white-collar work AI models can do, and how far that is from a saturation point.

**Structure:** occupation → tasks (% of working time) → task type → saturation score for three model tiers.

| Tier | Meaning |
|---|---|
| Frontier | Best models publicly available on the assessment date |
| Frontier+1 | Next model generation (~1 release cycle out) |
| Frontier+2 | Two generations out |

Each task type also has a **ceiling**: the most of that task AI could take even with unlimited intelligence, given physical presence, legal sign-off and human preference. Past Frontier+2 the model extends each task type's trend toward the lower of its ceiling and the point where its own trend flattens. The **saturation point** is the first generation that adds less than one point to the overall index.

Occupations are weighted by **pay** (employment × mean wage) or by **jobs**.

**History:** each Claude Opus release since Opus 4.1 (Aug 2025) is a dated snapshot. Earlier snapshots are *backfilled*: scored after the fact from benchmark results, for the frontier only. The live snapshot also forecasts Frontier+1 and Frontier+2, about six months apart. The research behind the scores is in `reports/` and `research_notes/`.

## Files

```
data/occupations.json          98 occupations, BLS OEWS May 2025 employment & wages, task breakdowns
data/taxonomy.json             29 task types
data/assessments/index.json    list of dated assessments; "latest" is shown by default
data/assessments/YYYY-MM.json  one snapshot: anchor model, scores per task type, evidence and sources
                               (kind "backfill" scores f0 only; kind "live" adds f1 / f2 / ceiling)
reports/, research_notes/      research behind the scores
assets/model.js                the model (shared by site and validator)
assets/app.js, style.css       the site
scripts/validate.mjs           checks data and prints the headline numbers
```

## Running locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
node scripts/validate.mjs     # validate data and print the index
```

## Adding a new assessment

1. Copy the latest file in `data/assessments/` to a new dated id (e.g. `2027-01.json`) and update `id`, `date`, `anchor`, `peers`, `highlights`. Change the previous live file's `kind` to `backfill` if you want it to stop showing forecasts.
2. Re-score `f0`, `f1`, `f2` and `ceiling` for each task type. Keep `f0 ≤ f1 ≤ f2 ≤ ceiling`.
3. For an occupation where a task type behaves differently, add an override: `"overrides": {"lawyer:draft": {"f0": 60, "f1": 78, "f2": 88, "ceiling": 95}}`.
4. Add the id to `index.json` and set `latest`.
5. Run `node scripts/validate.mjs`.

The snapshots list compares assessments, so you can check whether the models that arrive match what the previous Frontier+1 score predicted.

## Caveats

- Scores are judgments calibrated to benchmarks (GDPval, METR time horizons, Remote Labor Index, OSWorld, domain evals) and labor studies, not direct measurements. Many 2026 benchmark figures are vendor-reported or come from aggregators.
- Employment and wages are BLS OEWS May 2025, rounded; some rows combine SOC codes. OEWS excludes the self-employed. Coverage is about 60M jobs, not all white-collar work (registered nurses and retail sales are left out).
- Saturation measures technical capability, not adoption or job loss.

## Deploying

The site is static and deploys on Vercel. `vercel.json` runs `node scripts/build.mjs`, which validates the data (a bad data file fails the deploy) and copies `index.html`, `assets/` and `data/` into `dist/`. Research notes and reports are not deployed.

To set it up, import the GitHub repo at https://vercel.com/new, keep the settings from `vercel.json`, and deploy. Every push to the production branch then redeploys; other branches get preview URLs.

`.github/workflows/validate.yml` runs the same build on every push as a check.
