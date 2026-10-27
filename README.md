# Headroom

A regularly updated model of how much U.S. white-collar work AI models can do, and how far that is from a saturation point.

**Structure:** occupation → tasks (% of working time) → task type → saturation score for three model tiers.

| Tier | Meaning |
|---|---|
| Frontier | Best models publicly available on the assessment date |
| Frontier+1 | Next model generation (~1 release cycle out) |
| Frontier+2 | Two generations out |

Each task type also has a **ceiling**: the most of that task AI could take even with unlimited intelligence, given physical presence, legal sign-off and human preference. Past Frontier+2 the model extends each task type's trend toward the lower of its ceiling and the point where its own trend flattens. The **saturation point** is the first generation that adds less than one point to the overall index.

Occupations are weighted by **wage bill** (employment × mean wage) or by **jobs**.

## Files

```
data/occupations.json          88 occupations, BLS OEWS employment & wages, task breakdowns
data/taxonomy.json             29 task types
data/assessments/index.json    list of dated assessments; "latest" is shown by default
data/assessments/YYYY-MM.json  scores per task type for f0 / f1 / f2 + ceiling, optional overrides
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

1. Copy the latest file in `data/assessments/` to a new dated id (e.g. `2027-01.json`) and update `id`, `date`, `frontier`.
2. Re-score `f0`, `f1`, `f2` and `ceiling` for each task type. Keep `f0 ≤ f1 ≤ f2 ≤ ceiling`.
3. For an occupation where a task type behaves differently, add an override: `"overrides": {"lawyer:draft": {"f0": 60, "f1": 78, "f2": 88, "ceiling": 95}}`.
4. Add the id to `index.json` and set `latest`.
5. Run `node scripts/validate.mjs`.

The history panel compares assessments, so you can check whether the models that arrive match what the previous Frontier+1 score predicted.

## Caveats

- The baseline scores are judgment estimates, not measurements. They are meant to be argued with and replaced by benchmark- or eval-based scores over time.
- Employment and wages are rounded approximations of BLS OEWS May 2024; some rows combine SOC codes. Coverage is about 56M jobs, not all white-collar work.
- Saturation measures technical capability, not adoption or job loss.

## Deploying

`.github/workflows/pages.yml` validates the data and publishes the site to GitHub Pages on pushes to `main`. Enable Pages (Source: GitHub Actions) in the repo settings.
