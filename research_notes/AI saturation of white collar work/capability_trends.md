# Frontier AI Capability Growth: Trends and Forecasts for the Next 1-3 Model Generations (as of 2026-10-27)

Scope note: Many October 2026 model-level numbers (Claude Opus 5.5, Claude Fable 5.1, GPT-6 Astra, GPT-6.1 / GPT-5.6 Sol, Gemini 4 Argon) were found only through aggregators and secondary blogs, not on primary lab pages. Those figures are flagged "(secondary)". Measured trends (METR, Epoch) are kept apart from opinions and forecasts (AI Futures Project, LEAP, Metaculus, lab CEOs).

## 1. METR time-horizon trend: doubling time, latest frontier horizon, projections, critiques

### Takeaway
METR's measured 50% time horizon has doubled faster since 2023-2024 than its long-run ~7-month rate: about 131 days (~4.3 months) on the Time Horizon 1.1 suite. An early Claude Mythos Preview, evaluated in March 2026 and published May 8, 2026, measured at least 16 hours at 50% reliability but only about 3 hours at 80%. That is a reliability gap of more than 5x. It also means the frontier has now outrun METR's task suite, so newer models (Opus 5, Opus 5.5, GPT-6) have no comparable METR number.

### Cited Findings
- **Original trend (measured):** METR's March 2025 study found the 50% time horizon of frontier agents on software tasks doubled about every 7 months over 2019-2025, faster in 2024-25. — [METR TH1.1 blog, 2026-01-29](https://metr.org/blog/2026-01-29-time-horizon-1-1/); [Peter Wildeford commentary](https://blog.peterwildeford.com/p/forecaster-reacts-metrs-bombshell)
- **Generalization:** METR said it analyzed 9 other benchmarks (scientific reasoning, math, robotics, computer use, self-driving) and saw "generally similar rates of improvement." — [METR on X, July 2025](https://x.com/METR_Evals/status/1944817692294439179)
- **Time Horizon 1.1 (Jan 2026, measured):** "The post-2023 doubling-time is 131 days under TH1.1, compared to 165 days under TH1, meaning progress is estimated to be 20% more rapid under TH1.1." METR also noted that the trend is "somewhat sensitive to task composition." — [METR, 2026-01-29](https://metr.org/blog/2026-01-29-time-horizon-1-1/)
- **Post-2024 fit (secondary, not verified on METR's site):** a 105-day doubling time (R² = 0.98) for frontier models released after 2024-01-01. — [AI 2027 Tracker](https://ai2027-tracker.com/predictions/metr-doubling/)
- **Claude Opus 4.6 (Feb 2026):** about 718 minutes (~12 h) at p50, 95% CI [319, 3949] minutes (secondary). — [Medium analysis](https://medium.com/@AIchats/are-ai-time-horizons-still-doubling-every-7-months-6262ed2bcc6a)
- **Claude Mythos Preview, early version (measured March 2026, posted 2026-05-08):** 50% horizon of at least 16 h (95% CI 8.5-55 h); the TH1.1 data file reportedly lists 17.4 h. 80% horizon about 3 h 6 min (95% CI ~1h37m-6h39m). — [The Decoder](https://the-decoder.com/metr-says-it-can-barely-measure-claude-mythos-palo-alto-networks-warns-of-autonomous-ai-attackers/); [OfficeChai](https://officechai.com/ai/claude-mythos-shows-50-time-horizon-of-16-hours-on-metr-benchmark/); 80% figure also in [LEAP Wave 8, 2026-06-01](https://leap.forecastingresearch.org/reports/wave8)
- **Measurement ceiling:** METR's page says "Measurements above 16 hrs are unreliable with our current task suite" (added 2026-05-08). The suite has only 5 of 228 tasks estimated at 16 h or longer. METR does not consider these measurements reliable for exact comparisons or extrapolation. — [METR time-horizons page](https://metr.org/time-horizons/); [The Decoder](https://the-decoder.com/metr-says-it-can-barely-measure-claude-mythos-palo-alto-networks-warns-of-autonomous-ai-attackers/)
- **Page status:** METR's time-horizons page "is no longer actively updated." The last listed additions are Mythos Preview (2026-05-08), Gemini 3.1 Pro (04-15), GPT-5.4 (04-10), and Opus 4.6 / GPT-5.3-Codex (02-20). METR "corrected a regularization mistake" on 2026-03-03. — [METR time-horizons page](https://metr.org/time-horizons/)
- **Reference point:** GPT-5 (Aug 2025) had a 50% horizon of "around 2 hours and 17 minutes." — [METR time-horizons page](https://metr.org/time-horizons/)
- **Outlier:** one outlet reported 6.25 h (50%) and 31 min (80%) for Mythos. This conflicts with METR's published numbers and is likely wrong. — [METR Mythos search roundup](https://agitracker.io/blog/metr-time-horizons-2026/)
- **Opinion (AI Futures Project, April 2026):** "The METR coding time horizon trend has its flaws," but it remains "the best individual piece of evidence for forecasting coding automation." — [AI Futures Q1 2026 update](https://blog.aifutures.org/p/q1-2026-timelines-update)

### Inferences
- GPT-5 (Aug 2025) at about 2.3 h and Mythos Preview (Mar 2026 eval) at about 16-17 h is roughly a 7x gain in about 7 months. That implies a doubling time of about 2.5 months, faster even than the 131-day fit. With CIs this wide (8.5-55 h), the point estimate cannot separate "4-month doubling" from "faster."
- The 80% horizon is about one fifth of the 50% horizon (3 h vs 16 h). For white-collar work that needs high reliability, the useful horizon is roughly half a working day, not two days.
- If the 4-month doubling held for the 80% horizon: Frontier+1 (~6 months on) would reach about 8 h at 80%, and Frontier+2 (~12 months on) about 16-24 h at 80%. That is about one to three full working days of autonomous software work at 80% reliability. This is an extrapolation, not a measurement.
- METR has no measurements past May 2026, so the trend for Opus 5 / 5.5 and GPT-6 is not observed.

### Gaps
- No METR measurement found for Claude Opus 5 / 5.5, Fable 5.1, GPT-5.5 / GPT-6, or Gemini 4. No replacement suite (a "TH2") was found.
- I could not find METR's own statement of the post-2024 doubling time on a primary page; 105 days is secondary.
- No direct METR "messiness" critique with new 2026 numbers was found. The original paper's finding that horizons are shorter on "messier" tasks was not re-sourced this session.

## 2. Epoch AI Capabilities Index (ECI), benchmark saturation, and compute/algorithmic forecasts

### Takeaway
On Epoch's ECI, the frontier has risen about 14 points per year since reasoning models arrived, versus about 6 points per year before. That is roughly a 2.3x acceleration that is still holding. As of late October 2026, the top ECI is 169 (Claude Opus 5.5 and GPT-6 Astra). Training compute is growing about 4-5x per year, and algorithmic efficiency is halving the compute needed for a fixed capability every ~8 months. Epoch flags a possible slowdown in compute growth after ~2027 as training-run length hits a practical limit.

### Cited Findings
- **ECI rate (measured):** "The Epoch Capabilities Index (ECI) frontier has advanced by 14 points/year since reasoning models were introduced. That compares to six points/year in the non-reasoning era." — [Epoch AI on X](https://x.com/EpochAIResearch/status/2094922644428898737); [Epoch benchmarks hub](https://epoch.ai/benchmarks)
- A May 2026 update reportedly shows ~15.5 points/yr vs ~8 before 2024 (secondary, unverified). — [TechJack Solutions](https://techjacksolutions.com/ai-brief/epoch-ai-may-2026-data-frontier-ai-capability-pace-reportedl/)
- **Leaderboard, Epoch Brief of 2026-10-23:**
  - Claude Opus 5.5: 169
  - GPT-6 Astra: 169
  - GPT-6.1 Sol: 168
  - Claude Fable 5.1: 166
  - Gemini 4 Argon: 166 (public release 2026-10-13; partners 09-30)
  - Gemini 3.8 Flash: 157 (early Sep 2026)
  - Gemini 4 Argon is 8th on the math index and 6th on the software-engineering index.
  - Source: [The Epoch Brief, 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026). Note: an earlier Epoch topic page had GPT-6 Astra at 166 and Fable 5.1 at 164, so scores get revised. — [Epoch capabilities topic](https://epoch.ai/topics/capabilities)
- **Cyber ECI, same brief:**
  - GPT-5.4: 157 (March)
  - GPT-5.5: 162 (April)
  - Claude Mythos Preview: 165 (April)
  - Claude Opus 5.5 and GPT-6 Astra: 171 each
  - Source: [Epoch Brief, 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
- **Open vs closed:** since January 2026, the best open-weight models have lagged closed frontier models by an average of 4 months on ECI. On cyber ECI the lag is about 6-7 months. — [Epoch data insight](https://epoch.ai/data-insights/open-closed-eci-gap); [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
- **Epoch work-automation test (Oct 2026):** six models attempted 11 of Epoch's own internal tasks, one attempt each. Fable 5.1 and GPT-6 Astra roughly tied for the lead. Epoch concluded models "cannot yet replace workers, at least not at Epoch." — [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
- **Game benchmark saturation, illustrative of speed:** on Slay the Spire, top models went to winning >90% of base-difficulty runs within about 6 months (GPT-6 Astra 98%). At the hardest difficulty, GPT-6.1 Sol wins 20% vs about 85% for humans. — [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
- **ECI-to-revenue mapping (opinion/model, AI Futures Project):** "Revenue has grown about 10x for every 15 ECI points so far." The current annualized revenue growth rate used is "5-7x/yr." — [AI Futures Q2.5 update, 2026-08-16](https://blog.aifutures.org/p/q25-2026-timelines-update-uplift)
- **Training compute:** frontier training compute has grown about 4-5x/yr (4.2x/yr since 2018; 4.4x/yr since 2010, per secondary summaries of Epoch). Drivers:
  - hardware quantity: ~1.7x/yr
  - training duration: ~1.5x/yr
  - per-chip performance: ~1.4x/yr
  - Source: [Epoch scaling topic](https://epoch.ai/topics/scaling); [Longterm Wiki summary](https://www.longtermwiki.com/wiki/ai-compute-scaling-metrics)
- **Training duration limit (Epoch, measured trend plus projection):** training duration has grown about 1.4x/yr since 2020. Frontier systems will hit a ~9-month limit "by around 2027 (90% CI: 2025 to 2029)," which could slow overall compute growth after 2027. — [Epoch data insight: longest training run](https://epoch.ai/data-insights/longest-training-run)
- **Algorithmic progress:** compute needed for a fixed performance level halves about every 8 months, per Epoch research cited by MIT Technology Review. Other summaries give 6-12 months, and one claims about 3x/yr. — [MIT Technology Review, 2026-04-08](https://www.technologyreview.com/2026/04/08/1135398/mustafa-suleyman-ai-future/amp/); [Longterm Wiki](https://www.longtermwiki.com/wiki/E907)
- **Feasibility projection:** Epoch projects 2x10^29 FLOP training runs will likely be feasible by end of 2030 (secondary summary). — [Longterm Wiki on Epoch](https://www.longtermwiki.com/knowledge-base/organizations/safety-orgs/epoch-ai)

### Inferences
- At 14 ECI points/yr, Frontier+1 (~6 months on) would be about 176 and Frontier+2 (~12 months on) about 183. Using AI Futures' "10x revenue per 15 ECI points" heuristic, that would mean roughly another 10x in AI revenue over the next year. This is a model-based extrapolation, not a measured forecast.
- Compute growth looks secure through 2027. A post-2027 slowdown (training-duration ceiling) would mostly affect Frontier+3 and later, not the next two generations.

### Gaps
- I found no Epoch-published year-by-year compute forecast for 2026, 2027 and 2028 on a primary page.
- ECI release dates for Opus 5.5, GPT-6 Astra and Fable 5.1 are not in the Epoch Brief. Dates are taken from secondary sources (Section 3).

## 3. Model release cadence (Anthropic Opus, OpenAI, Google), 2025-2026

### Takeaway
Anthropic has shipped a new frontier Opus-class model about every 2-3.5 months (mean ~2.7 months, May 2025 to Sep 2026). It has also added a higher tier (Mythos Preview, then Fable/Mythos 5.1) above Opus. OpenAI and Google ship at a similar 2-4-month cadence of point releases. So "Frontier+1" and "Frontier+2", if read as meaningful capability steps, likely means 2-4 point releases each, or about 6 months apart.

### Cited Findings
- **Anthropic Opus timeline:**
  - Claude Opus 4: 2025-05-22 — [Anthropic, Introducing Claude 4](https://www.anthropic.com/news/claude-4) (from prior knowledge; URL not re-fetched this session)
  - Opus 4.1: 2025-08-05 — [Anthropic](https://www.anthropic.com/news/claude-opus-4-1) (prior knowledge; not re-fetched)
  - Opus 4.5: 2025-11-24 — [Anthropic](https://www.anthropic.com/news/claude-opus-4-5) (prior knowledge; not re-fetched)
  - Opus 4.6: 2026-02-05 — [Google Vertex AI docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/opus-4-6?hl=en)
  - Opus 4.7: 2026-04-16, same $5/$25 per M token pricing as 4.6 — [Let's Data Science](https://letsdatascience.com/news/anthropic-releases-claude-opus-47-with-vision-and-agentic-ga-b0cf4752); [Claude Market Blog](https://claudemarket.ai/blog/claude-opus-4-7-what-changed-pricing-api-name/)
  - Claude Mythos Preview: April 2026 (cyber ECI 165) — [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
  - Opus 4.8: 2026-05-28 (single secondary source, unconfirmed) — [search roundup](https://www.cometapi.com/tag/claude-opus-4-7/)
  - Claude Opus 5: 2026-07-24 — [Kingy AI (secondary)](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
  - Claude Fable 5.1 and Mythos 5.1: 2026-09-01 — [Kingy AI (secondary)](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
  - Claude Opus 5.5: 2026-09-22 — [Kingy AI (secondary)](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
  - Sonnet 5.5: 2026-09-28 — [Kingy AI (secondary)](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
  - Haiku 5.5: 2026-10-07 — [Kingy AI (secondary)](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **OpenAI:**
  - GPT-5: Aug 2025 — [METR page](https://metr.org/time-horizons/) (GPT-5 measurement)
  - GPT-5.2: about Dec 2025, GDPval 70.9% — [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/)
  - GPT-5.3-Codex: measured by METR 2026-02-20 — [METR](https://metr.org/time-horizons/)
  - GPT-5.4: March 2026 — [Epoch Brief](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
  - GPT-5.5: April 2026, GDPval table dated 2026-04-23 — [benchmarklist](https://benchmarklist.com/benchmarks/openai_gdpval/)
  - GPT-5.6 Sol, GPT-6 Astra, GPT-6.1 Sol: mid/late 2026; exact dates not found — [Epoch Brief](https://epochai.substack.com/p/the-epoch-brief-october-23-2026); [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **Google:**
  - Gemini 3.1 Pro: Feb 2026
  - Gemini 3.8 Flash: early Sep 2026
  - Gemini 4 Argon: partners 2026-09-30, public 2026-10-13
  - Source for all three: [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)

### Inferences
- Opus intervals, computed from the dates above:

  | Step | Gap |
  |---|---|
  | 4 → 4.1 | ~2.5 months |
  | 4.1 → 4.5 | ~3.6 months |
  | 4.5 → 4.6 | ~2.4 months |
  | 4.6 → 4.7 | ~2.3 months |
  | 4.7 → 5 | ~3.3 months |
  | 5 → 5.5 | ~2.0 months |

  The mean is about 2.7 months; the major-version step from Opus 4 to Opus 5 took about 14 months. Counting Opus 4.8 (unconfirmed) would bring the mean to about 2.3 months.
- On METR, a ~4-month doubling at a ~2.7-month release cadence means each Opus point release adds about 1.6x to the time horizon. A 6-12-month "generation" adds about 3-8x.
- Release cadence has not slowed in 2026; if anything it has sped up (Opus 5 → 5.5 in 2 months). Three labs (Anthropic, OpenAI, Google) now ship within weeks of each other at roughly the same ECI (166-169).

### Gaps
- Primary Anthropic launch posts for Opus 5 / 5.5 and Fable 5.1, and OpenAI posts for GPT-6 Astra / GPT-6.1 Sol, were not fetched, so those dates are secondary.
- Opus 4.8 is unconfirmed.

## 4. Benchmark saturation: which are near ceiling, which are far, and gap-closure rates per generation

### Takeaway
Knowledge and reasoning QA (MMLU, GPQA Diamond ~96%) and older agentic coding (SWE-bench Verified, now retired in Anthropic launch tables) are saturated. ARC-AGI-2 is vendor-reported at 95% for GPT-6 Astra.

Benchmarks closest to real white-collar work still have room:
- strict OSWorld 2.0: 48.7%
- AutomationBench: ~40%
- Terminal-Bench 4.0: ~66%
- HLE with tools: ~68%
- Epoch's own internal work tasks: "cannot yet replace workers"

On OpenAI's GDPval, the expert win-or-tie rate went 40.6% (GPT-5, Sep 2025) → 70.9% (GPT-5.2, Dec 2025) → 83.0% (GPT-5.4, Mar 2026) → 84.9% (GPT-5.5, Apr 2026). That is a decelerating fraction of the remaining gap closed per release (about 51% → 42% → 11%). GDPval-AA Elo, however, kept rising fast through Opus 5.5 (+138 Elo over Opus 5 in 2 months).

### Cited Findings
- **GDPval, OpenAI expert-graded win-or-tie rate vs industry experts:**
  - GPT-5.2: 70.9% — [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/); [Medium](https://medium.com/@btl101/gdpval-and-the-70-9-threshold-a1e499395f1a)
  - GPT-5.4: 83.0%; Claude Opus 4.7: 80.3%; GPT-5.5: 84.9% (table dated 2026-04-23) — [benchlist.com](https://benchmarklist.com/benchmarks/openai_gdpval/)
  - Ties count toward the model. With 220 gold tasks, results within about ±6.6 points of 50% are statistically indistinguishable. — [testmuai](https://www.testmuai.com/learning-hub/gdpval/)
  - The GPT-5 / Claude Opus 4.1 launch figures (about 40.6% and 47.6%, OpenAI GDPval paper, Sep 2025) are from prior knowledge and were not re-fetched this session: [OpenAI GDPval](https://openai.com/index/gdpval/)
- **GDPval-AA, Artificial Analysis, LLM-judged Elo, v2.1:**
  - Claude Opus 5.5: 1846
  - Fable 5.1: 1735
  - Opus 5: 1708
  - GPT-5.6 Sol: 1588
  - GPT-6 Astra: 1542
  - v2.1 scores run about 100-120 Elo below v2.
  - Sources: [Kingy AI (Anthropic launch table)](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/); [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/). Other aggregators disagree: [BenchLM](https://benchlm.ai/benchmarks/gdpvalaa) lists Opus 5 at 1862 as of 2026-10-20; [LLM Stats](https://llm-stats.com/benchmarks/gdpval-aa) lists Fable 5.1 at 1853; [BenchLM normalized](https://benchlm.ai/benchmarks/gdpvalaanormalized) has Opus 5.5 at 68.3% (2026-10-14).
- **Anthropic Opus 5.5 launch table, vendor-reported (secondary relay):**

  | Benchmark | Opus 5 | Opus 5.5 | GPT-6 Astra |
  |---|---|---|---|
  | Terminal-Bench 4.0 | 52.3% | 66.4% | 57.9% |
  | AutomationBench | 26.9% | 40.0% | 41.4% |
  | OSWorld 2.0 (partial credit) | 74.0% | 81.8% | — |
  | Humanity's Last Exam (with tools) | 63.6% | 67.7% | 57.2% |
  | Terminal-Bench-Science | 29.0% | 58.7% | 64.6% |
  | FrontierCode | 48.0% | 54.4% | — |

  Source: [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **OSWorld strict vs partial:** Opus 5.5 has 81.8% partial credit but a 48.7% strict success rate on OSWorld 2.0. GPT-6 Astra reports 72.6% under a different harness, not comparable. — [NeuralTrust](https://neuraltrust.ai/blog/claude-opus-5-5-vs-gpt-6-sol-benchmark); [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **Independent check (Artificial Analysis):** Intelligence Index for Opus 5.5 is 58; GPT-6 Astra and Fable 5.1 are 53; Opus 5 is 51; GPT-5.6 Sol is 47. Opus 5.5 scores 61.4% on HLE and 59.6% on Terminal-Bench 4.0. — [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **SWE-bench:** Anthropic did not publish SWE-bench Verified for Opus 5.5. That benchmark "has been replaced by SWE-bench Pro, Multilingual and Multimodal." Opus 5.5 is reported at 89.9% on SWE-bench Pro (aggregator). — [BenchLM SWE-bench Pro](https://benchlm.ai/benchmarks/swe-bench-pro); [Morph](https://www.morphllm.com/swe-bench-pro)
- **GPQA Diamond / ARC-AGI-2:** GPT-6 Astra is OpenAI-reported at 96.0% on GPQA Diamond and 95.0% on ARC-AGI-2. — [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **Epoch benchmark audits (Oct 2026):** of 4 benchmarks reviewed, 1 was "Verified" and 3 "Flawed." — [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)

### Inferences
- **Gap-closure ratios** (computed from the cited figures; GDPval treats 100% win-or-tie as the "ceiling"):

  | Step | Remaining gap | Share of gap closed |
  |---|---|---|
  | GPT-5 → 5.2 | 59.4 → 29.1 pts | 51% (~4 months) |
  | 5.2 → 5.4 | 29.1 → 17.0 | 42% (~3 months) |
  | 5.4 → 5.5 | 17.0 → 15.1 | 11% (~1 month) |

  This looks like saturation on GDPval's win-rate metric. A plausible cause is grader preference and tie noise near the top (a ceiling below 100%), not a halt in capability. The Elo-based GDPval-AA has no ceiling and kept climbing (+138 Elo from Opus 5 to 5.5).
- **Opus 5 → Opus 5.5** (about 2 months), share of remaining gap closed:

  | Benchmark | Share closed |
  |---|---|
  | Terminal-Bench 4.0 | ~30% |
  | OSWorld 2.0 partial | ~30% |
  | AutomationBench | ~18% |
  | HLE | ~11% |

  If each ~6-month generation closes 30-50% of the remaining gap on agentic/professional suites, then:
  - Frontier+1: AutomationBench ~55-70%, strict OSWorld ~65-75%
  - Frontier+2: AutomationBench ~70-85%, strict OSWorld ~75-85%

  These are illustrative extrapolations only.
- **Overall pattern:** static-knowledge and short-task benchmarks are saturated or saturating. Long-horizon, computer-use, strict end-to-end automation and real-employer tasks are still far from ceiling and moving fast. So the evidence points to steady-to-accelerating gains on hard professional tasks, with saturation only on narrower metrics.

### Gaps
- No current tau-bench (tau²-bench) or MMLU numbers were found this session. MMLU is widely regarded as saturated (>90%) since 2024, but that was not re-sourced.
- No independent (non-vendor) strict OSWorld or GDPval expert-graded results were found for Opus 5.5 or GPT-6.
- No primary OpenAI GDPval update after April 2026 was found. Aggregator numbers for GDPval-AA conflict.

## 5. Expert and forecaster predictions on when AI can do most remote / white-collar work

### Takeaway
Forecasts split sharply by community.
- **AI Futures Project:** an Automated Coder around Nov 2027 (Kokotajlo) to Jan 2030 (Lifland), with TED-AI about 2028-2032.
- **Metaculus community:** 25% AGI by 2029, 50% by 2033 (Feb 2026), but only about a 0.8% employment reduction by 2030.
- **LEAP experts and superforecasters (May 2026):** a median AGI year (90th-percentile human on 90% of non-physical tasks at ≤5x cost) of 2050 and 2047. They also expect an 80% METR horizon of only about 3.4 h by end of 2026, already roughly met by Mythos Preview's 3.1 h in May.
- **Lab leaders:** Amodei says "powerful AI" in "much less than 5 years" (Jan 2026) but has softened his job-loss rhetoric (May 2026).

### Cited Findings
- **AI Futures Project, Q2.5 2026 update (2026-08-16), opinion/model:**

  | Forecaster | AC (all-things-considered) | TED-AI | ASI |
  |---|---|---|---|
  | Kokotajlo | Nov 2027 (model Dec 2027) | Nov 2028 | Mar 2029 |
  | Lifland | Jan 2030 (model Mar 2029) | Jul 2032 | Jul 2033 |
  | Halstead | Jan 2029 | Apr 2031 | — |

  "All 3 methods [METR horizons, coding uplift, revenue] predict quite similar AC arrival dates." Current coding uplift (Kokotajlo median) is 2x, with (uplift-1) doubling every 5 months; AC corresponds to 20x uplift. METR's study found 1.04-1.2x, and an April 2026 Anthropic survey had a geometric mean of 4x. — [AI Futures Q2.5](https://blog.aifutures.org/p/q25-2026-timelines-update-uplift)
- **AI Futures direction of change:** the Q1 2026 update (April) moved Kokotajlo's AC median from late 2029 to mid-2028 and Lifland's from early 2032 to mid-2030. The Dec 2025 update had lengthened timelines by 3-5 years vs AI 2027. Kokotajlo reportedly now treats a 1-year (not 3-year) time horizon as sufficient for AC, citing Opus 4.6. — [AI Futures Q1 2026](https://blog.aifutures.org/p/q1-2026-timelines-update); [AI 2027 Tracker changelog](https://ai2027-tracker.com/changelog/); [Clarifying post](https://blog.aifutures.org/p/clarifying-how-our-ai-timelines-forecasts)
- **LEAP Wave 8** (FRI; surveyed 2026-04-20 to 05-11, published 2026-06-01; 205 experts, 52 superforecasters, 601 public). AGI here means a system beating the 90th-percentile employee on ≥90% of non-physical tasks at ≤5x human cost. Medians:

  | Measure | Experts | Superforecasters | Public |
  |---|---|---|---|
  | AGI year: 25th / 50th / 75th percentile | 2039 / 2050 / 2065 | 2036 / 2047 / — | 2042 / 2055 / — |
  | Year AI achieves 80% success on 8+ h tasks | 2030 (p25 2028) | 2028 (p25 2027) | 2037 |
  | Longest 80% horizon by Dec 31, 2026 | 3.4 h | 3.5 h | 3 h |

  The baseline at survey launch was 1.5 h. Mythos Preview's 3 h 6 min was posted on May 8, during the survey window. — [LEAP Wave 8](https://leap.forecastingresearch.org/reports/wave8)
- **LEAP earlier waves:** experts forecast 18% of US work hours assisted by generative AI by 2030 (public: 10%), and the labor share at 58% in 2026 and 56% in 2030 (2024: 58.3%). — [FRI LEAP working paper](https://forecastingresearch.org/research/longitudinal-expert-ai-panel-leap-working-paper); [FRI economic effects](https://forecastingresearch.org/research/economic-effects-of-ai)
- **Metaculus:**
  - The Labor Automation Forecasting Hub (launched April 2026 with Renaissance Philanthropy) has a community forecast of US employment −0.8% by 2030 and −3.6% by 2035 vs 2025, attributed to AI displacement (an earlier snapshot was −0.6% / −2.9%). It tracks 15 occupations at 2027, 2030 and 2035. — [Metaculus Labor Hub](https://www.metaculus.com/labor-hub/); [Yahoo Finance](https://finance.yahoo.com/sectors/technology/articles/renaissance-philanthropy-launches-forecasting-hub-140000706.html)
  - 27 forecasters estimated that end-to-end-capable AI would replace 22.3% of today's workers by 2030 (interval about 13.3-30.9%) (secondary). — [AIMultiple](https://aimultiple.com/ai-job-loss)
  - AGI question, Feb 2026: 25% by 2029, 50% by 2033. — [AIMultiple / Metaculus notebook](https://www.metaculus.com/notebooks/43363/ai-forecasting-in-2026/)
- **Dario Amodei (opinion):**
  - January 2026 essay: AI could displace up to half of entry-level white-collar jobs within 1-5 years, and "powerful AI" able to do most or all jobs could arrive in "much less than 5 years." — [The Adolescence of Technology](https://darioamodei.com/essay/the-adolescence-of-technology)
  - By May 2026 he was emphasizing job expansion: "If you automate 90% of the job, then everyone does the 10% of the job." — [Fortune, 2026-05-26](https://fortune.com/2026/05/26/sam-altman-dario-amodei-walking-back-ai-jobs-apocalypse-prophecies-ipo/)
- **Davos CEOs (Jan 2026):** said AI is not coming for jobs as fast as Amodei thinks. — [Fortune, 2026-01-27](https://fortune.com/2026/01/27/at-davos-ceos-said-ai-isnt-coming-for-jobs-as-fast-as-anthropic-ceo-dario-amodei-thinks/)

### Inferences
- Forecasts of capability (AC by 2027-2030 from AI Futures; METR 80% horizon of 8 h by 2028 from superforecasters) are much nearer than forecasts of labor impact (Metaculus −0.8% employment by 2030; LEAP labor share barely moving). The forecaster community itself expects a large diffusion lag.
- LEAP's experts set a 3.4 h median for the end-2026 80% horizon, and Mythos Preview roughly hit it in May. That suggests the expert panel underestimated near-term progress, as did the slow AGI medians of 2047-2050.

### Gaps
- No Metaculus question found that gives a date for "AI can do most remote jobs," or its current community median.
- No 2026 AI Impacts survey (ESPAI) results found. The latest known is the 2023 survey (HLMI 50% by 2047), which was not re-sourced this session.
- No up-to-date (H2 2026) stated timelines found from Sam Altman or Demis Hassabis.
- LEAP Wave 6 (economic effects, March 2026) figures were not retrieved.

## 6. Evidence on limits: reliability, error rates, hallucinations, cost vs human, adoption lags

### Takeaway
Reliability is the binding constraint:
- The 80% horizon is about one fifth of the 50% horizon.
- Strict OSWorld success is about 49% vs 82% partial credit.
- Expert humans still beat frontier models on specialist financial-modeling tasks (77.2% vs 70.9% for GPT-5.4).
- Hallucinations on hard benchmarks remain high (22-94% across models on Stanford's hardest new test).

Cost and speed favor models strongly: about 1 hour per task vs 18 hours for experts, at $4-$50 per M tokens. Measured employment effects remain small so far.

### Cited Findings
- **Financial modeling benchmark (arXiv, 2026):** human experts averaged 77.2% vs GPT-5.4 at 70.9% and Opus 4.6 at 61.8%. Agents took 0.97 h and 0.71 h per task vs 18.3 h for humans. — [FrontierFinance, arXiv 2604.05912](https://arxiv.org/pdf/2604.05912)
- **Financial analysis:** GPT-5 scored 67.4% with tools vs an 80% junior-analyst baseline. — [arXiv 2510.00332](https://arxiv.org/pdf/2510.00332)
- **Hallucination:**
  - Stanford HAI 2026 AI Index: rates across 26 top models ranged from 22% to 94% on its hardest new benchmark (secondary relay). — [talkory.ai](https://www.talkory.ai/blog/ai-hallucination-rate-2026)
  - Package-hallucination study: 2026 frontier models range from 4.62% to 6.10%, and "no 2026 frontier model has surpassed the best 2024 model" on this task. — [arXiv 2605.17062](https://arxiv.org/pdf/2605.17062)
  - Grounded summarization: rates near 1% for top models (blog, lower reliability). — [bestaiweb.ai](https://www.bestaiweb.ai/from-courtroom-fabrications-to-finix-s1-s-1-8-error-rate-hallucination-failures-and-fixes-in-2026/)
- **Other reliability evidence:**
  - Strict vs partial OSWorld: 48.7% vs 81.8% (Opus 5.5). — [NeuralTrust](https://neuraltrust.ai/blog/claude-opus-5-5-vs-gpt-6-sol-benchmark)
  - METR 80% vs 50% horizon for Mythos Preview: 3 h vs ≥16 h. — [The Decoder](https://the-decoder.com/metr-says-it-can-barely-measure-claude-mythos-palo-alto-networks-warns-of-autonomous-ai-attackers/)
  - Opus 5.5 system card regressions on pasted-text prompt injection and authorization claims (secondary). — [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
  - Workplace-agent benchmarks revisited after two years. — [WorkBench Revisited, arXiv 2606.13715](https://arxiv.org/pdf/2606.13715)
  - Long-horizon terminal tasks cost about $3.6-$26 per task for agents. — [arXiv 2607.08964](https://arxiv.org/pdf/2607.08964)
- **Pricing (USD per M input/output tokens, secondary relay of list prices):**
  - Claude Opus 5.5: $4/$20, down from Opus 5's $5/$25; batch $2/$10
  - Fable 5.1: $10/$50
  - GPT-6 Astra: $10/$50
  - GPT-5.6 Sol: $4/$20
  - Haiku 5.5: $0.10/$0.50
  - Gemini 3.8 Flash: $0.75/$3.75
  - Source: [Kingy AI](https://kingy.ai/blog/claude-opus-5-5-specs-benchmarks-pricing-comparison/)
- **Adoption and labor effects so far:**
  - A Stanford payroll (ADP) analysis found total jobs grew about 6% from Nov 2022 to Jun 2026, and the most AI-exposed jobs grew about 4% (secondhand). — [Vishal Bagla Substack](https://vishalbagla.substack.com/p/people-were-supposed-to-lose-their)
  - Epoch's internal test: models "cannot yet replace workers, at least not at Epoch" (Oct 2026). — [Epoch Brief 2026-10-23](https://epochai.substack.com/p/the-epoch-brief-october-23-2026)
  - Coding uplift: measured 1.04-1.2x (METR study) vs self-reported 4x (Anthropic survey, April 2026). — [AI Futures Q2.5](https://blog.aifutures.org/p/q25-2026-timelines-update-uplift)

### Inferences
- The gap between "can do it sometimes" and "can do it reliably enough to replace a worker" is a 3-5x factor in task length (METR) and about 30 points on strict computer-use success. Closing the reliability gap, not raw capability, is what matters for white-collar substitution in the next two generations.
- Hallucination is improving on grounded tasks but plateauing on some (package hallucination flat since 2024). Error rates on hard, open-ended professional tasks are still material, which supports human-in-the-loop use rather than full replacement through Frontier+2.
- Cost per task already appears far below human cost on measured professional tasks (under 1 agent-hour plus dollars of tokens vs 18 expert hours). Cost is not the constraint; reliability and diffusion are.

### Gaps
- I found no rigorous source comparing cost per task with fully loaded human cost on the same tasks, and no recent primary data on hallucination-rate trends across successive frontier generations from a single consistent benchmark.
- The Stanford AI Index 2026 hallucination figure was not verified on the primary source.
