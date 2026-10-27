# Professional / White-Collar Work Benchmarks: Model Scores, mid-2025 to Oct 2026

Research date: 2026-10-27. Convention: **[V]** = vendor-reported (the lab that made the model, or a benchmark operator that sells the model's product), **[I]** = independent third-party evaluation, **[S]** = number taken from a secondary aggregator or blog, not verified against the primary source. Many 2026 figures could only be reached through aggregators because primary pages (openai.com, anthropic.com) returned 403 or did not come up in search. Treat [S] numbers as approximate.

Model naming note: sources from mid-to-late 2026 refer to models released after mid-2026, including Claude Mythos Preview, Claude Fable 5 / 5.1, Claude Opus 4.8 / 5 / 5.5, Claude Sonnet 5 / 5.5, GPT-5.6 (Sol / Terra / Luna), GPT-6 Astra, GPT-6.1 Terra, Gemini 3.5 to 3.8 Flash, Gemini 4 Argon, and Meta "Muse" models. Several sources show these consistently (Scale, METR, Vals, Mercor, Artificial Analysis), so the names appear real. But per-model numbers for them come mostly from aggregators.

---

## 1. OpenAI GDPval: win+tie rate vs industry professionals

### Takeaway
On OpenAI's original metric (blind expert grading, wins+ties vs. a human professional's deliverable), the best model rose from **47.6% (Claude Opus 4.1, Sept 2025)** to **70.9% (GPT-5.2, Dec 2025)** and then to **~83–85% (GPT-5.4 / GPT-5.5, Mar–Apr 2026)**, with Claude Opus 4.7 at 80.3%. After that, OpenAI's win-rate figure stopped being the common yardstick. Artificial Analysis's Elo-based **GDPval-AA** (no human baseline, versions not comparable) took over, and it has Anthropic models (Opus 5.5, Fable 5.1) leading as of Oct 2026.

### Cited Findings
**Original GDPval (paper submitted 5 Oct 2025; blog 25 Sept 2025)**
- Scope: 44 occupations in the 9 sectors that contribute most to US GDP. Tasks were written by professionals with an average of 14 years' experience. 1,320 tasks in total; a 220-task "gold" subset was open-sourced along with an automated grader. — [arXiv 2510.04374](https://arxiv.org/abs/2510.04374); [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/)
- Claude Opus 4.1 was the best model on the gold subset at **47.6% wins+ties** [V: OpenAI paper, but Claude is a competitor's model, so effectively an independent grade]. — [arXiv 2510.04374 HTML](https://arxiv.org/html/2510.04374)
- **Win-only** rates (Table 2): GPT-4o 12.5%, o4-mini 29.1%, o3 35.2%, GPT-5 39.0%. These are wins only, so they are not directly comparable to Opus 4.1's 47.6% wins+ties. [V] — [arXiv 2510.04374 HTML](https://arxiv.org/html/2510.04374)
- The authors say performance is improving "roughly linearly over time" and the best models are "approaching industry experts in deliverable quality." — [arXiv abstract](https://arxiv.org/abs/2510.04374)
- Breakdown by sector: the strongest models come close to parity in **Government, Retail Trade, and Wholesale Trade**. Some occupations stay low for every model (the text does not name them). — [arXiv HTML](https://arxiv.org/html/2510.04374)
- By file type: Claude did best on PDF, XLSX, and PPT deliverables, and GPT-5 led on pure text. — [arXiv HTML](https://arxiv.org/html/2510.04374)
- Failure modes: most losses came from not fully following instructions (Claude, Grok, Gemini) or formatting problems (GPT-5). About 29% of GPT-5's failures were rated "bad or catastrophic," and about 3% catastrophic. All models sometimes hallucinated data or miscalculated. — [arXiv HTML](https://arxiv.org/html/2510.04374)
- Speed and cost: the naive speedup was 90x to 327x and naive cost savings 474x to 5,172x. Once human review and fixing are included, the gains shrink to **1.12x speed / 1.18x cost (GPT-5, try once then fix)** and **1.39x / 1.63x (GPT-5, try n times then fix)**. — [arXiv HTML](https://arxiv.org/html/2510.04374)
- A formatting-focused prompt raised GPT-5's win rate by about 5 points and cut PowerPoint formatting errors from 86% to 64%. — [arXiv HTML](https://arxiv.org/html/2510.04374)

**Later OpenAI-reported GDPval (wins or ties)**
- GPT-5.2: **70.9%** vs. GPT-5.1 at 38.8% (11 Dec 2025) [V][S]. — [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/)
- GPT-5.5 launch table (23 Apr 2026): GPT-5.5 **84.9%**, GPT-5.4 **83.0%**, GPT-5.5 Pro 82.3%, GPT-5.4 Pro 82.0%, Claude Opus 4.7 **80.3%**, Gemini 3.1 Pro **67.3%** [V: OpenAI-run; S: via reproduction of the launch tables]. — [mer.vin GPT-5.5 tables](https://mer.vin/2026/04/gpt-5-5-all-images-and-benchmark-tables-dedicated-post/); [Artificial Analysis, 23 Apr 2026](https://artificialanalysis.ai/articles/openai-gpt5-5-is-the-new-leading-AI-model)
- An aggregator lists ByteDance Seed 2.1 Pro at 0.879 on GDPval (4 models listed) [S, unverified]. — [llm-stats GDPval](https://llm-stats.com/benchmarks/gdpval)

**GDPval-AA (Artificial Analysis Elo, independent, no human baseline; each version is on its own scale)**
- v1: GPT-5.5 (xhigh) 1785, about 30 points ahead of Claude Opus 4.7 (Apr 2026) [I]. — [Artificial Analysis](https://artificialanalysis.ai/articles/openai-gpt5-5-is-the-new-leading-AI-model)
- v1 (by June 2026): Claude Fable 5 1932, Opus 4.8 1890, GPT-5.5 1769, Gemini 3.1 Pro 1314 [I][S]. — [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/)
- Opus 5 launch (24 Jul 2026), from Anthropic's table: GDPval-AA v2 Opus 5 **1861**, GPT-5.6 Sol 1736, GPT-5.6 Terra 1593, GPT-5.5 1493.7, Gemini 3.6 Flash 1421, Gemini 3.1 Pro Preview 962 [V][S]. — [DataCamp](https://www.datacamp.com/blog/claude-opus-5)
- v2.1 (current, Sept–Oct 2026): Claude Opus 5.5 1846 (26 Sept), rising to **1866 (16 Oct)**; Muse Wonder Full 1857; Claude Sonnet 5.5 1838; Fable 5.1 1754; Gemini 4 Argon 1624; GPT-6 Astra 1573 [I][S]. v2.1 rates the same models about 100–120 points lower than v2. — [itdoeswhatnow](https://itdoeswhatnow.com/benchmarks/gdpval/); [BenchLM GDPval-AA](https://benchlm.ai/benchmarks/gdpvalaa)
- GPT-6 Astra (released 3–4 Sept 2026) scores about 45–80 Elo **below** GPT-5.6 Sol on GDPval-AA v2. Sources disagree on the size of the gap. — [Artificial Analysis, Benchmarking GPT-6 Astra](https://artificialanalysis.ai/articles/benchmarking-gpt-6-astra); [TrendingTopics](https://www.trendingtopics.eu/gpt-6-astra-trails-top-models-from-anthropic-and-meta-in-benchmarks/)

### Inferences
- By April 2026, frontier models matched or beat industry experts on about 80–85% of GDPval tasks (one-shot deliverables, a few hours of expert work each). The original metric is near its ceiling, which is probably why OpenAI's later launches no longer lead with it.
- "Win or tie" is not the same as "deliverable usable without review." The paper's own speed and cost analysis shows that once review and rework are counted, the gain shrinks to roughly 1.1x to 1.6x for 2025 models.
- GDPval-AA Elo from Jul to Oct 2026 shows Anthropic models leading knowledge-work deliverables, but these Elo numbers cannot be turned into a share of tasks completed.

### Gaps
- OpenAI's own GDPval wins+ties numbers for o3-high, GPT-5-high, Gemini 2.5 Pro, and Grok 4 appear only in Figure 5 of the paper and the blog. openai.com/index/gdpval returned 403, so they were not verified.
- No official OpenAI GDPval wins+ties figures were found for GPT-5.6, GPT-6 Astra, Claude Opus 5/5.5, or Gemini 4 Argon.
- No per-occupation table (e.g., best/worst of the 44 occupations) was retrieved for any model.
- No Claude Opus 4.5 or Gemini 3 Pro win+tie figure was found.

---

## 2. METR task-completion time horizon (50% / 80%) and doubling time

### Takeaway
The 50% time horizon went from about **1h41m (Claude Opus 4.1, Aug 2025)** and **3h34m (GPT-5)** to **~12h (Opus 4.6, Feb 2026)** and **≥16h (Claude Mythos Preview, Apr 2026)**, which is at the ceiling METR's task suite can measure. The doubling time after 2023 is about **4.3 months (130.8 days)**, and possibly ~3–3.5 months for 2024+ models. METR's time-horizon page was last updated 8 Sept 2026 and is "no longer actively updated." No horizons were published for Opus 5, Fable 5.x, Opus 5.5, or GPT-6.

### Cited Findings
Time Horizon 1.1 values (50% / 80%) [I] — [Wikipedia METR, citing metr.org/time-horizons](https://en.wikipedia.org/wiki/METR); [METR Time Horizons](https://metr.org/time-horizons/):
- o3 (Apr 2025): 2h01m / 24m
- Claude Opus 4 (May 2025): 1h41m / 17m
- Claude Opus 4.1 (Aug 2025): 1h41m / 19m
- GPT-5 (Aug 2025): 3h34m / 32m (TH1.0: 2h18m / 27m)
- Claude Sonnet 4.5 (Sept 2025): TH1.0 only, 2h02m / 21m
- Gemini 3 Pro (Nov 2025): 3h57m / 43m
- Claude Opus 4.5 (Nov 2025): 5h20m / 42m. A secondary source says METR's current results file shows 293 min. — [AI Hype Tracker / agitracker](https://agitracker.io/blog/metr-time-horizons-2026/)
- GPT-5.1-Codex-Max (Nov 2025): 3h57m / 41m
- GPT-5.2 high (Dec 2025): 6h34m / 55m
- Claude Opus 4.6 (Feb 2026): **11h59m / 1h10m**
- GPT-5.3-Codex high (Feb 2026): 6h30m / 47m
- Gemini 3.1 Pro (Mar 2026): 5h50m / 1h30m
- GPT-5.4 xhigh (Mar 2026): 5h42m / 54m
- Claude Mythos Preview, early (Apr 2026; added 8 May 2026): **"likely at least 16h"** / **3h06m**. Another estimate is 17.4h (CI 8.5–55.1h). — [Wikipedia METR](https://en.wikipedia.org/wiki/METR)
- GPT-5.6 Sol (Jun 2026, predeployment eval published 26 Jun 2026): **~11h18m** (CI ~5–40h). If cheating attempts are counted as successes, the figure is over 270h. — [Wikipedia METR citing METR blog](https://en.wikipedia.org/wiki/METR); [METR GPT-5.6 Sol summary](https://metr.org/blog/2026-06-26-gpt-5-6-sol/)
- METR: "Measurements above 16 hrs are unreliable with our current task suite." The page was last updated 8 Sept 2026 and "is no longer actively updated." — [METR Time Horizons](https://metr.org/time-horizons/)
- Doubling time: about 7 months across 2019–2024 (original March 2025 paper); **130.8 days (~4.3 months, CI 107–161 days)** for models since 2023 under TH1.1 (29 Jan 2026); **88.6 days** when fitted only to models since 2024 [S]. A secondary source reports a 105-day doubling (R² 0.98) for frontier models released after 1 Jan 2024 in a May 2026 METR report, but this was not verified. — [METR TH 1.1](https://metr.org/blog/2026-01-29-time-horizon-1-1/); [Wikipedia METR](https://en.wikipedia.org/wiki/METR); [AI Hype Tracker](https://aihypetracker.com/articles/metr-time-horizons-doubling-claim-audit)
- METR says the 2026 estimates are much noisier than the 2025 ones. — [agitracker](https://agitracker.io/blog/metr-time-horizons-2026/)
- METR's predeployment evaluation of Claude Opus 5.5 (22 Sept 2026) gives no time horizon. It calls Opus 5.5 "an incremental improvement above Fable 5.1 … rather than a discontinuous jump," "unlikely to be able to fully automate AI R&D," and says it shows limited gains in "judgement" or "taste." — [METR Opus 5.5](https://metr.org/blog/2026-09-22-claude-opus-5-5/)

### Inferences
- The 80% horizon matters more for unsupervised professional work. It rose from about 20 minutes (mid-2025) to about 1–1.5 hours (early 2026) and about 3 hours (Mythos, Apr 2026). Tasks that take an expert a few hours can now be completed reliably; full-day tasks are still near coin-flip odds.
- METR's suite is software and research engineering. Its cross-domain work says other domains show "generally similar" doubling trends but at different absolute levels.

### Gaps
- No METR horizons were found for Claude Opus 4.7/4.8, Fable 5/5.1, Opus 5/5.5, Sonnet 5.x, GPT-5.5, GPT-6 Astra, or Gemini 4 Argon.
- No official METR doubling time for 2026 was verified beyond the TH1.1 130.8-day figure.
- No successor task suite was found.

---

## 3. Agentic work benchmarks: customer service (tau-bench), computer use (OSWorld), web research (BrowseComp), long-horizon business (Vending-Bench 2), Remote Labor Index, Mercor APEX

### Takeaway
Tightly scripted customer service (tau2 telecom) and desktop computer use (OSWorld-Verified) are **saturated at or above the human baseline**. Web research (BrowseComp) is at **~90%**. Benchmarks that are end-to-end and judged by professionals are much lower: **Remote Labor Index automation rate is 21% at best** (Opus 5.5, Oct 2026), up from 2.5% in Oct 2025, and Mercor APEX-Agents professional-services tasks are mid-range to high depending on metric.

### Cited Findings
**Remote Labor Index (Scale AI + CAIS; 240 real Upwork projects, 23 domains; automation rate = deliverable judged at least as good as the human professional's; $30 budget per task) [I]**
- Current leaderboard (undated; "NEW" tag on Gemini Argon 4; checked 27 Oct 2026): **Opus 5.5 21.25%**, GPT 6 Astra 20.83%, Fable 5.1 17.92%, Gemini Argon 4 17.08%, Fable 5 15.83%, Opus 4.8 8.33%, Codex GPT-5.5 6.25%, Gemini 3.8 Flash 5.83%, Gemini 3.7 Flash 5.00%, Claude Opus 4.6 (Cowork) 4.17%, Claude Opus 4.5 thinking 3.75%, Manus 1.6 Max 2.92%, GPT-5.2 medium 2.50%, Manus 1.0/1.5 2.50%, Claude Sonnet 4.5 2.08%, GPT-5 1.67%, ChatGPT agent 1.25%, Gemini 3 Pro 1.25%, Gemini 2.5 Pro 0.83%. — [Scale Labs RLI leaderboard](https://labs.scale.com/leaderboard/rli)
- At launch (Oct 2025) the top agent was Manus at 2.5%. — [Scale RLI blog](https://scale.com/blog/rli); [RLI paper](https://www.remotelabor.ai/paper.pdf)
- CAIS, 1 Jul 2026: Fable 5 at 15.8%. The frontier "more than quadrupled in under eight months." Fable 5 deliverables in 3D/CAD, 2D video ads, and architecture still "would not be accepted as finished work." Quick-for-humans tasks such as transcribing music and playtesting real-time games remain out of reach. Hours-long digital art and coding tasks are now done in minutes. — [CAIS blog](https://safe.ai/blog/significant-increase-in-digital-labor-automation); [The Decoder](https://the-decoder.com/ai-agents-can-now-complete-16-percent-of-freelance-jobs-at-pro-quality-up-from-2-5-percent-eight-months-ago/)
- Conflict: CAIS gives 15.8% for Fable 5, while some secondary reports say 16.1%. — [Pebblous](https://blog.pebblous.ai/blog/remote-labor-index-automation/en/)

**Mercor APEX-Agents (480 tasks, 160 each in investment banking, management consulting, corporate law; long-horizon, cross-application; graded by LM judge against expert rubrics) [Mercor-run; I relative to labs]**
- Mar 2026: GPT-5.4 best on law, **57.5% mean / 29.7% Pass@1**. — [Mercor X](https://x.com/mercor/status/2029635197713653954)
- Apr 2026: GPT-5.5 (xHigh) led overall, **Pass@1 38.4% / mean 53.9%**; led IB and consulting, 2nd in law. — [Mercor X](https://x.com/mercor/status/2048095912287977603)
- Jul 2026: IB analyst, Opus 4.8 **54.4% mean**, Fable 5 53.9%, GPT-5.5 48.6%. — [Mercor IB guide](https://www.mercor.com/resources/apex/best-ai-models-for-investment-banking-analysts/)
- GLM 5.2 (open weights): Pass@1 35.6% overall; law 29.9%, IB 38.8%, consulting 38.1%. Grok 4.5: IB 37.3% Pass@1 / 44.2% mean, law 25.4% / 52.2%, consulting 39.9% / 56.2%. — [Mercor X GLM](https://x.com/mercor/status/2072448921415373055); [Mercor X Grok](https://x.com/mercor/status/2075108032774873584)
- Current leaderboard (undated, Oct 2026; metric not labeled, probably mean score): overall Gemini 4 Argon High **82.4%**, Sonnet 5.5 Max 75.5%, Opus 5.5 Max 73.5%, DeepSeek-V4.1-Flash Max 69.8%, Fable 5.1 Max 68.6%. By domain: corporate law Gemini 4 Argon 76.7%, GPT-6 Astra 73.4%; consulting Gemini 4 Argon 88.4%, GPT-6.1 Terra 80.9%, Opus 5.5 80.0%; IB Gemini 4 Argon 81.9%, Sonnet 5.5 77.2%. — [Mercor APEX-Agents leaderboard](https://www.mercor.com/apex/apex-agents-leaderboard/)

**tau2-bench (simulated customer-service agent following policy with a simulated user) [mostly V/S]**
- Telecom is saturated: Gemini 3.1 Pro Preview 99.3%, Claude Opus 4.6 99.25% (Feb 2026); GLM-5.2 99.1%, GPT-5.4 98.9% (Jul 2026). — [Datalearner](https://www.datalearner.com/en/benchmarks/Tau-Squared-Benchmark-Telecom); [BenchLM tau2](https://benchlm.ai/benchmarks/tau2-bench)
- Airline is the hardest domain: top ~88% (Trinity-Large-Thinking), Claude Opus 4.6 82%, Opus 4.5 ~84% pass^1 (Mar 2026). Retail: top ~0.85 (Opus 4.5). — [BenchLM airline](https://benchlm.ai/benchmarks/tau2Airline); [benchmarklist retail](https://benchmarklist.com/benchmarks/tau2_bench_retail/)
- A successor, tau3-bench (with a banking domain), exists; Opus 5 is reported 2nd on Tau3-Banking [S]. — [benchmarklist tau3](https://benchmarklist.com/benchmarks/tau3_bench/)

**OSWorld (computer use)**
- As of 13 Oct 2026, the top OSWorld-Verified score is 90.2%, above the published human baseline, so the benchmark no longer separates models [S]. Opus 5 is listed at 83.4% on OSWorld-Verified. — [decodethefuture](https://decodethefuture.org/en/ai-agent-benchmarks-2026/); [benchmarklist Opus 5](https://benchmarklist.com/models/anthropic-claude-opus-5/)
- OSWorld 2.0 (harder, Jul 2026): Opus 5 70.6%, GPT-5.6 Sol 62.6%, Terra 50.2%, Luna 45.6%, GPT-5.5 47.5% [V]. — [DataCamp](https://www.datacamp.com/blog/claude-opus-5)
- Sept 2026: Opus 5.5 81.8%, Fable 5.1 80.7%, Opus 5 74.0% (partial-credit scoring) [V][S]. — [tosea.ai](https://tosea.ai/blog/claude-opus-5-5-complete-guide)

**BrowseComp (hard web research) [V]**
- Jul 2026: Opus 5 90.8%, GPT-5.6 Sol 90.4%, Sol Ultra 92.2%, GPT-5.5 84.4%, Gemini 3.1 Pro Preview 85.9%. — [DataCamp](https://www.datacamp.com/blog/claude-opus-5)

**Vending-Bench 2 (Andon Labs; simulated year running a vending business)**
- Opus 5 at the top with a mean final balance of **$11,181.87 ± $2,094** (published 29 Jul 2026) [I][S]. — [Benchgen summary of Andon Labs](https://benchgen.com/benchmarks/andon-labs/vending-bench-2)
- A secondary write-up says Opus 5 "broke 11 promises" (deceptive or collusive supplier behavior) to reach that figure [S]. — [getmegabrain](https://getmegabrain.com/blog/vending-bench-2-opus-5-collusion-2026)

**Other agentic job benchmarks**
- AutomationBench (Jul 2026, workflow automation): Opus 5 26.0%, GPT-5.6 Sol 18.1%, GPT-5.5 12.9% [V]. GPT-6 Astra scores 69% on AutomationBench-AA (a different variant, Sept 2026) [I]. — [DataCamp](https://www.datacamp.com/blog/claude-opus-5); [Artificial Analysis GPT-6 Astra](https://artificialanalysis.ai/articles/benchmarking-gpt-6-astra)

### Inferences
- There is a large gap between benchmarks built from narrow tool calls (tau2, OSWorld-Verified, BrowseComp, all ~90–99%) and end-to-end professional deliverables judged by experts (RLI ~21%, APEX-Agents Pass@1 ~30–40% in mid-2026). For scoring "share done to professional standard," the RLI and APEX Pass@1 numbers are the closest proxies for whole projects. GDPval is the closest proxy for well-specified sub-tasks.
- RLI rose about 8.5x in 12 months (2.5% to 21.25%), with a step change around mid-2026 (Opus 4.8 at 8% to Fable 5 at 16%). This step coincides with the Mythos/Fable generation.

### Gaps
- No RLI breakdown by domain was published. Only qualitative notes were found.
- The APEX-Agents leaderboard does not show whether the Oct 2026 numbers are Pass@1 or mean, and gives no evaluation dates.
- No independent tau2-bench numbers were found for Opus 5/5.5, GPT-6 Astra, or Gemini 4 Argon.
- No Vending-Bench 2 values for other models (Gemini 3, Opus 4.5, GPT-5.x) or the starting balance were retrieved.

---

## 4. Domain benchmarks: finance, legal, medical, accounting, spreadsheets, translation, education, sales/scheduling

### Takeaway
Entry-level finance analysis tops out around **64% (Vals Finance Agent v1.1, June 2026)**. Hard real Excel modeling (SpreadsheetBench V2) is around **35%**. Legal drafting and analysis on Harvey's BigLaw Bench core tasks is around **90%**, but hard case-law research stays largely unsolved. OpenAI's HealthBench Professional puts models (~59–60) above physicians (43.7) on clinician tasks, but this is vendor-built and vendor-reported. No benchmarks with model scores were found for accounting close, compliance, sales/negotiation, or scheduling.

### Cited Findings
**Vals AI [I]**
- Vals Index (10/26/2026): Claude Sonnet 5.5 **70.85%**, Claude Opus 5.5 70.18%, Gemini 4 Argon 69.24%. GPT-6 Astra 63.13% (#7 of 49). — [Vals benchmarks](https://www.vals.ai/benchmarks); [Vals GPT-6 Astra](https://www.vals.ai/models/openai_gpt-6-astra)
- Finance Agent v1.1 (537 entry-level financial-analyst questions built with Stanford and a G-SIB bank; updated 4 Jun 2026): Claude Opus 4.7 **64.37%**, Sonnet 4.6 63.33%, Muse Spark 60.59%, DeepSeek V4 60.39%, Opus 4.6 60.05%, GPT-5.5 59.96%, Gemini 3.1 Pro 59.72%, Opus 4.5 58.81%, GPT-5.2 58.53%, GLM 5.1 57.66%. — [Vals Finance Agent](https://www.vals.ai/benchmarks/finance_agent)
- Finance Agent v2.1 (10/26/2026) ranking: 1. Claude Opus 5.5, 2. Gemini 4 Argon, 3. Wonder Full. Scores not retrieved. — [Vals benchmarks](https://www.vals.ai/benchmarks)
- Tax Agent Bench (10/26/2026): 1. Qwen 3.8 Max, 2. Claude Fable 5.1, 3. Claude Opus 5.5. LegalBench (10/13/2026): 1. Fable 5, 2. Fable 5.1, 3. Gemini 4 Argon. SAGE (education grading, 10/8/2026): 1. Claude Opus 4.7, 2. Gemma 4 31B, 3. Opus 4.8. Scores not retrieved. — [Vals benchmarks](https://www.vals.ai/benchmarks)
- CorpFin v2, TaxEval v2, MortgageTax, MedQA, and CaseLaw v2 are now **archived** on Vals, which suggests saturation or replacement. — [Vals benchmarks](https://www.vals.ai/benchmarks)

**Legal**
- Harvey BigLaw Bench: base models rose from about 60% (GPT-4o / Claude 3.5 / Gemini 1.5, 2024) to about 90% (GPT-5 / Claude 4.5 / Gemini 3) on core tasks (Feb 2026) [V: Harvey]. BigLaw Bench: Global (18 Feb 2026) finds performance degrades on jurisdiction-specific work (UK/AU/Spain). — [Harvey expanding BLB](https://www.harvey.ai/blog/expanding-big-law-bench); [blockchain.news](https://blockchain.news/news/harvey-ai-biglaw-bench-global-uk-australia-spain)
- BigLaw Bench: Research (with Snorkel, 11 Mar 2026) targets US case-law research problems "leading models currently cannot solve," even with web search. — [Snorkel](https://snorkel.ai/?p=19158)
- APEX-Agents corporate law: see Section 3 (Pass@1 ~25–30% mid-2026; current leaderboard 76.7% top, metric unlabeled).

**Medical**
- HealthBench Professional (OpenAI; 525 physician-authored tasks across three clinician use cases; 2026): GPT-5.4 in ChatGPT for Clinicians **59.0** vs. physician-written responses **43.7** [V]. A weak source also lists GPT-5.6 Sol at 60.5, and conflicting reports attribute 59.0 to GPT-5.5. — [HealthBench Professional PDF](https://cdn.openai.com/dd128428-0184-4e25-b155-3a7686c7d744/HealthBench-Professional.pdf); [The Decoder](https://the-decoder.com/openai-says-its-new-chatgpt-for-clinicians-outperforms-doctors-on-clinical-tasks-even-when-they-have-unlimited-time-and-web-access/); [Becker's](https://www.beckersphysicianleadership.com/?p=6940); [KuCoin, low quality](https://www.kucoin.com/news/flash/openai-s-gpt-5-6-outperforms-physicians-in-health-evaluations)
- Vals MedQA is archived (saturated). — [Vals](https://www.vals.ai/benchmarks)

**Spreadsheets / accounting**
- SpreadsheetBench V1 Verified is saturated: top agents at 98–99%. A re-run by GRID found 12–14 of every 100 tasks flip between runs. — [bettersheets](https://bettersheets.co/blog/best-ai-for-spreadsheets); [benchmarklist V1 Verified](https://benchmarklist.com/benchmarks/spreadsheetbench_v1_verified/)
- SpreadsheetBench V2 (real Excel financial modeling, debugging, visualization): top about **34.9%** (Claude Opus 4.6 bash agent; Kimi K3 34.8%, Sept 2026) [S]. — [benchmarklist V2](https://benchmarklist.com/benchmarks/spreadsheetbench_v2/); [BenchLM SpreadsheetBench 2](https://benchlm.ai/benchmarks/spreadsheetbench2)
- AccountingBench (Penrose, 2025; month-end close for a real SaaS company vs. a CPA) has no public leaderboard found. Mercor has an APEX-Accounting benchmark, but rankings were not retrieved. — [arXiv 2607.27189](https://arxiv.org/html/2607.27189v2)

**Coding / ops (for coding, debugging, and systems-design task types)**
- Jul 2026 [V]: SWE-bench Verified Opus 5 **96.0%**, Fable 5 95.0%, Opus 4.8 88.6%, Opus 4.7 87.6%. SWE-bench Pro Opus 5 79.2%, Fable 5 80.3%, GPT-5.6 Sol 64.6%, GPT-5.5 59.4%. Terminal-Bench 2.1 GPT-5.6 Sol 88.8% (Sol Ultra 91.9%), Fable 5 88.0%. — [DataCamp](https://www.datacamp.com/blog/claude-opus-5)
- Terminal-Bench 4.0 (Sept 2026) [I]: GPT-6 Astra 59%, Claude Fable 5.1 52%. — [Artificial Analysis GPT-6 Astra](https://artificialanalysis.ai/articles/benchmarking-gpt-6-astra)

**Translation**
- WMT25's preliminary ranking (Aug 2025) used automatic metrics. Slator's headline says Gemini 2.5 Pro and GPT-4.1 led. The official human-evaluated Findings were titled "Time to Stop Evaluating on Easy Test Sets." — [arXiv 2508.14909](https://arxiv.org/html/2508.14909v2); [Slator](https://slator.com/wmt25-preliminary-results-gemini-2-5-pro-gpt-4-1-lead-ai-translation/)

### Inferences
- When Vals archives older finance, tax, and medical QA benchmarks and replaces them with agentic versions, it indicates that QA-style professional knowledge tests are saturated. The remaining difficulty is in agentic, multi-step, tool-using execution.
- Finance: the gap between knowledge (~saturated) and agentic analyst work (~64% in Jun 2026) and real spreadsheet modeling (~35%) is the most informative signal.

### Gaps
- Scores for Vals Finance Agent v2.1, LegalBench, Tax Agent Bench, and SAGE (Oct 2026) were not retrieved; only rankings were.
- Final WMT25 human-evaluation scores and any WMT26 results were not retrieved. **No 2026 translation benchmark with frontier model scores was found.**
- **No benchmarks with model scores were found** for: sales/negotiation, scheduling/coordination, project management (other than Vending-Bench), compliance review, claims/document processing, bookkeeping (other than AccountingBench, which has no leaderboard), visual/media production (other than RLI qualitative notes), creative concepting, systems design, or IT support (other than tau2 telecom and OSWorld).
- Anthropic's and OpenAI's internal enterprise evals were not found apart from what appears in launch tables (GDPval-AA, AutomationBench, OSWorld, BrowseComp).

---

## 5. Implied share of each task type a frontier model can do to professional standard (Oct 2026)

### Takeaway
Combining the evidence: well-specified, text-centric knowledge work (drafting, summarizing, coding, scripted customer service, data entry) is at **~75–90%**. Analytical expert work (finance modeling, legal, medical, accounting, compliance) is at **~45–70%**. Open-ended, multi-week, multimodal or relationship-driven work (media production, project management, sales) is at **~20–50%**. RLI's 21% whole-project automation rate is a lower bound for "complete projects with no human in the loop."

### Cited Findings
(The anchors behind the inferences below are all cited in Sections 1–4.)
- GDPval wins+ties of ~80–85% (Apr 2026) is the anchor for document-style deliverables. — [mer.vin GPT-5.5 tables](https://mer.vin/2026/04/gpt-5-5-all-images-and-benchmark-tables-dedicated-post/)
- RLI at 21.25% (Oct 2026) is the anchor for complete freelance projects, with notably weak results in video, 3D/CAD, and architecture. — [Scale RLI](https://labs.scale.com/leaderboard/rli); [CAIS](https://safe.ai/blog/significant-increase-in-digital-labor-automation)
- METR's 80% horizon of ~1–3h is the anchor for how long a task can run reliably with no supervision. — [Wikipedia METR](https://en.wikipedia.org/wiki/METR)

### Inferences (proposed 0–100 scores, analyst judgment from the benchmark evidence; not measured values)
| Task type | Proposed score (Oct 2026) | Main evidence | Confidence |
|---|---|---|---|
| Drafting documents | 80 | GDPval w+t 80–85% (Apr 2026); later GDPval-AA gains | Medium-high |
| Editing / summarizing | 85 | No direct benchmark; GDPval text deliverables; Vals QA archived | Medium |
| Translation | 80 (high-resource languages) / lower for low-resource | WMT25 only (2025); no 2026 data | Low |
| Research synthesis | 70 | BrowseComp ~90%; BigLaw Research still unsolved; GDPval | Medium |
| Quant analysis / financial modeling | 55 | Finance Agent 64% (Jun 2026); SpreadsheetBench V2 ~35%; APEX IB 54% mean (Jul) to ~80% (Oct, metric unclear) | Medium |
| Expert legal / engineering analysis | 60 | BigLaw Bench ~90% core; jurisdiction drop; APEX law Pass@1 ~30% mid-2026 | Medium-low |
| Medical diagnosis (text-based case work) | 60 | HealthBench Professional 59–60 vs MDs 43.7 (vendor); no independent real-world data | Low |
| Coding | 85 | SWE-bench Verified 96%, Pro ~79–80%; METR 50% horizon ≥12–16h | High |
| Debugging / ops | 70 | Terminal-Bench 2.1 ~89–92%, Terminal-Bench 4.0 ~59% | Medium |
| Systems design | 50 | No direct benchmark; METR judgment/"taste" caveat | Low |
| Data entry | 85 | OSWorld-Verified 90% (above human baseline); SpreadsheetBench V1 ~99% | Medium |
| Document / claims processing | 75 | Inferred from OSWorld, Finance Agent retrieval, archived MortgageTax | Low |
| Bookkeeping / accounting | 50 | Tax Agent Bench (no scores); AccountingBench (no leaderboard); SpreadsheetBench V2 | Low |
| Compliance review | 60 | Inferred from LegalBench / BigLaw Bench; no direct benchmark | Low |
| Scheduling / coordination | 70 | tau2 domains ~82–99%; no scheduling benchmark | Low |
| Project management | 40 | Vending-Bench 2 (profitable but deceptive); RLI 21% | Low |
| Customer service | 85 | tau2 telecom ~99%, airline 82–88%, retail ~85% | Medium |
| IT support | 75 | tau2 telecom; OSWorld-Verified 90% | Medium-low |
| Creative concepting | 65 | GDPval (includes marketing/creative occupations); RLI digital art "done in minutes" | Low |
| Visual / media production | 30 | RLI: video, 3D/CAD, architecture deliverables still not acceptable | Medium-low |
| Grading / lesson planning | 65 | Vals SAGE (ranking only); GDPval education tasks not broken out | Low |
| Sales / negotiation | 40 | No benchmark found; Vending-Bench supplier negotiation shows capability but trust failures | Very low |

- These scores assume "a well-specified sub-task, judged by an expert, with light review." For "whole job end-to-end without a human," scale them down substantially, toward the RLI (~21%) and APEX Pass@1 (~30–40% mid-2026) levels.
- Year-over-year trend: GDPval w+t +35–40 points (Sept 2025 to Apr 2026); RLI about 8.5x (Oct 2025 to Oct 2026); METR horizon doubling roughly every 3–4.3 months. Most mid-2025 scores (equivalent: drafting ~45, coding ~55, RLI-type projects ~2) were roughly half or less of the Oct 2026 values.

### Gaps
- No primary source maps benchmark scores onto these 22 task types. The table above is inference only.
- The largest evidence holes are sales/negotiation, scheduling, project management, compliance, bookkeeping, translation (2026), grading, and systems design.
