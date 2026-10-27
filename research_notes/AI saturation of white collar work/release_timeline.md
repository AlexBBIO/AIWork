# Frontier AI Model Release Timeline, Sept 2025 – Oct 2026 (anchored on Claude Opus), with Headline Benchmarks

Research date: 2026-10-27. Conventions: **[V]** = vendor-reported (launch post / system card, often relayed by secondary sites); **[I]** = independently measured (METR, Artificial Analysis, Vals AI, ARC Prize, Arena). Where a number came only from a secondary aggregator that cites the vendor, it is tagged [V, via secondary]. Several Anthropic and OpenAI launch pages publish their benchmark tables as images, so many numbers below could only be verified through secondary write-ups. Treat those as lower confidence than numbers read directly from a primary page.

**Structural note for the model-builder:** By mid-2026 Anthropic's lineup had four tiers: **Mythos** (gated, the top tier), **Fable** (public, Mythos-class with safeguards), **Opus**, and **Sonnet**. From June 9, 2026 on, **Opus was no longer Anthropic's most capable model.** Opus 5 (July 2026) was explicitly positioned as "near-frontier", below Fable 5. Opus 5.5 (Sept 22, 2026) then reached roughly Fable 5.1 level at lower cost. OpenAI likewise moved to tiered families: GPT-5.6 Luna/Terra/Sol, then GPT-6 Astra/Sol/Luna. Anchoring "the frontier" on Opus alone therefore understates the frontier for Q2–Q3 2026.

**Benchmark drift note:** SWE-bench Verified was close to saturated by about April 2026 (Opus 4.7 87.6%, Mythos Preview 93.9%). Vendors moved to SWE-bench Pro, Terminal-Bench 2.1, then 4.0, OSWorld-Verified, then OSWorld 2.0/2.1, GDPval-AA, AutomationBench and ARC-AGI-3. Scores on different benchmark versions (TB 2.0, 2.1 and 4.0; OSWorld-Verified, 2.0 and 2.1) **are not comparable**.

---

## Q1. Exact release dates of each Claude Opus model (and peers) Sept 2025 – Oct 2026; which model was the frontier at each quarter end?

### Takeaway
Between Sept 2025 and Oct 2026 Anthropic shipped **seven Opus releases**: Opus 4.5 (Nov 24, 2025), 4.6 (Feb 5, 2026), 4.7 (Apr 16, 2026), 4.8 (May 28, 2026), 5 (Jul 24, 2026) and 5.5 (Sep 22, 2026), with Opus 4.1 (Aug 5, 2025) as the starting point. Above Opus it added Mythos Preview (Apr 7, 2026, gated), Mythos 5 and Fable 5 (Jun 9, 2026), and Fable 5.1 and Mythos 5.1 (Sep 1, 2026). Quarter-end frontier, best estimate: Q4 2025 was contested between Opus 4.5, GPT-5.2 and Gemini 3 Pro. Q1 2026 was contested between Opus 4.6, GPT-5.4 and Gemini 3.1 Pro. At Q2 2026 Anthropic's Fable 5 led publicly (Mythos 5 gated), with GPT-5.6 Sol (Jul 9) close behind. At Q3 2026 Opus 5.5 led and GPT-6 Astra was its main rival. In late Oct 2026, Opus 5.5 is #1 on Artificial Analysis, with Gemini 4 Argon (GA Oct 13) and GPT-6 Astra contesting.

### Cited Findings

**Master dated release table (Anthropic)** — all dates from [Wikipedia: Claude (language model)](https://en.wikipedia.org/wiki/Claude_(language_model)) (accessed 2026-10-27) unless another source is given:

| Date | Model | Tier / access | Date corroboration |
|---|---|---|---|
| 2025-08-05 | Claude Opus 4.1 | Opus, public | [Bloomberg 2025-08-05](https://www.bloomberg.com/news/articles/2025-08-05/anthropic-unveils-more-powerful-model-ahead-of-gpt-5-release) |
| 2025-09-29 | Claude Sonnet 4.5 | Sonnet, public | [Decrypt](https://decrypt.co/es/342254/review-anthropic-lanza-claude-sonnet-4-5-con-77-2-en-swe-bench-y-30-horas-de-programacion?amp=1) |
| 2025-10-15 | Claude Haiku 4.5 | Haiku | Wikipedia only |
| 2025-11-24 | **Claude Opus 4.5** | Opus, public, $5/$25 per Mtok | [Anthropic news](https://www.anthropic.com/news/claude-opus-4-5); [TechCrunch 2025-11-24](https://techcrunch.com/2025/11/24/anthropic-releases-opus-4-5-with-new-chrome-and-excel-integrations/embed/) |
| 2026-02-05 | **Claude Opus 4.6** | Opus, public; agent teams, 1M context (beta) | [Anthropic news](https://www.anthropic.com/news/claude-opus-4-6) |
| 2026-02-17 | Claude Sonnet 4.6 | Sonnet | Wikipedia only |
| 2026-04-07 | Claude Mythos Preview | Gated, Project Glasswing (11 orgs) | Wikipedia; [claudefa.st](https://claudefa.st/blog/models/claude-mythos) |
| 2026-04-16 | **Claude Opus 4.7** | Opus, public | [computingforgeeks](https://computingforgeeks.com/claude-opus-4-7-released-features-benchmarks/) |
| 2026-05-28 | **Claude Opus 4.8** | Opus, public, $5/$25 | [LLM Stats](https://llm-stats.com/blog/research/claude-opus-4-8-launch); [TechCrunch on Opus 5](https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/) also cites "May 28" |
| 2026-06-09 | Claude Mythos 5 (gated) + **Claude Fable 5** (public, $10/$50) | Mythos / Fable | Wikipedia; [LetsDataScience](https://www.letsdatascience.com/news/anthropic-releases-claude-fable-5-for-broad-use-db880a41). **Conflict:** one aggregator cites a 2026-07-09 launch post ([benchlm](https://benchlm.ai/models/claude-mythos-5)), probably a confusion with GPT-5.6's July 9 date. |
| 2026-06-30 | Claude Sonnet 5 | Sonnet | [Gigazine 2026-07-01](https://gigazine.net/gsc_news/en/20260701-claude-sonnet-5) |
| 2026-07-24 | **Claude Opus 5** | Opus, "near-frontier", $5/$25 | [Anthropic news](https://www.anthropic.com/news/claude-opus-5); [TechCrunch](https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/); [Axios](https://www.axios.com/2026/07/24/anthropic-releases-new-model-opus-5) |
| 2026-09-01 | Claude Fable 5.1 (public) + Mythos 5.1 (gated) | Fable / Mythos | [MarkTechPost 2026-09-01](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/); [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) |
| 2026-09-22 | **Claude Opus 5.5** | Opus, $4/$20 (20% below Opus 5) | [Anthropic](https://www.anthropic.com/claude-opus-5-5); [TechCrunch 2026-09-22](https://techcrunch.com/2026/09/22/anthropic-releases-opus-5-5-with-lower-prices-and-fable-level-performance/) |
| 2026-09-28 | Claude Sonnet 5.5 | Sonnet | Wikipedia; [AndroidHeadlines](https://www.androidheadlines.com/2026/09/claude-sonnet-5-5-release-anthropic.html) |
| 2026-10-07 | Claude Haiku 5.5 | Haiku | Wikipedia only |

**Anthropic positioning claims**
- Opus 5: "much of the capability of Claude Fable 5 at half the cost". Anthropic did not call it its smartest model, yet it "outperforms Fable 5 on a number of benchmarks" — [Anthropic, 2026-07-24](https://www.anthropic.com/news/claude-opus-5) as summarized via [TechCrunch](https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/) / [VentureBeat](https://venturebeat.com/orchestration/anthropic-launches-claude-opus-5-a-cheaper-ai-model-for-coding-agents-and-enterprise-workflows).
- Opus 5.5 "performs at the level of Claude Fable 5.1 on most work", costs 40% less to run than Opus 5, and is comparable to Mythos 5.1 in bio and cyber, so it ships with Fable-5.1-like safeguards. It is Anthropic's "first release since we called for pacing the frontier". External testing was done by METR and Frontier Design — [Anthropic](https://www.anthropic.com/claude-opus-5-5); [Yahoo/Reuters](https://finance.yahoo.com/technology/article/anthropic-launches-opus-55-its-first-model-since-ceo-amodei-called-for-ai-slowdown-163000869.html).

**OpenAI releases in window**
- GPT-5.1: Nov 2025. GPT-5.2 came "just four weeks after GPT-5.1" — [The Decoder](https://the-decoder.com/gpt-5-2-lands-to-top-googles-gemini-3-in-the-ai-benchmark-game-just-four-weeks-after-gpt-5-1/). Exact days not confirmed in this session (see Gaps).
- GPT-5.1-Codex-Max: 2025-11-19 — [itecsonline guide](https://itecsonline.com/post/chatgpt-5-1-codex-max); [OpenAI](https://openai.com/index/gpt-5-1-codex-max/).
- GPT-5.2 (Instant / Thinking / Pro): Dec 2025 — [OpenAI](https://openai.com/blog/introducing-gpt-5-2).
- GPT-5.3-Codex: 2026-02-05, the same day as Opus 4.6 — [Ubergizmo](https://www.ubergizmo.com/2026/02/gpt-5-3-codex/); [OpenAI](https://openai.com/index/introducing-gpt-5-3-codex).
- GPT-5.4 (standard / Thinking / Pro, native computer use, 1M context): 2026-03-05 — [Noqta](https://noqta.tn/en/news/openai-gpt-5-4-million-token-computer-use-2026); [OpenAI](https://openai.com/blog/introducing-gpt-5-4).
- GPT-5.5: 2026-04-23 — [Wikipedia GPT-5.5](https://en.wikipedia.org/wiki/GPT-5.5); [Decrypt](https://decrypt.co/365333/openai-gpt-5-5-release-agentic-coding-benchmarks).
- GPT-5.6 (Luna / Terra / Sol): limited preview on 25 or 26 June 2026 (sources differ), GA 2026-07-09 — [OpenAI](https://openai.com/index/gpt-5-6/); [Artificial Analysis](https://artificialanalysis.ai/articles/gpt-5-6-has-landed).
- GPT-6 Astra: limited preview 2026-09-03 (Daybreak cyber program), public 2026-09-04. GPT-6 Sol and Luna: 2026-09-22. GPT-6 Instant: 7 or 8 Oct 2026 (Wikipedia is internally inconsistent) — [Wikipedia GPT-6](https://en.wikipedia.org/wiki/GPT-6); [CNBC 2026-09-03](https://www.cnbc.com/2026/09/03/open-ai-astra-gpt-6-cyber.html).
- GPT-6.1 Sol on 2026-09-29 and GPT-6.1 Terra on 2026-10-26: **unconfirmed**. They appear on a single secondary timeline only — [scriptbyai](https://www.scriptbyai.com/timeline-of-chatgpt/).

**Google releases in window** — dates from [Wikipedia: Gemini (language model)](https://en.wikipedia.org/wiki/Gemini_(language_model)):
- Gemini 3 Pro: 2025-11-18. Gemini 3 Deep Think: 2025-12-03. Gemini 3 Flash: 2025-12-17. Gemini 3.1 Pro: 2026-02-19 (corroborated by [DataCamp](https://www.datacamp.com/blog/gemini-3-1)). Gemini 3.5 Flash: 2026-05-19, announced at I/O. Gemini 3.6 Flash: 2026-07-21. Gemini 3.7 Flash: 2026-08-13. Gemini 3.8 Flash: 2026-09-02.
- **Gemini 3.5 Pro was never released.** It was announced at I/O on May 19, 2026 for "next month" and then slipped repeatedly. One report says it was cancelled; this is unconfirmed — [TechTimes](https://www.techtimes.com/articles/320308/20260713/gemini-35-pro-targets-july-17-after-full-rebuild-every-spec-remains-unconfirmed.htm); [Medium](https://medium.com/ai-engineering-simplified/gemini-3-5-pro-release-date-2026-why-google-delayed-it-3-times-and-started-training-gemini-4-427f55207e5b). It does not appear in Wikipedia's release list.
- **Gemini 4 Argon** was announced 2026-09-30 (limited, via the Fairwind Program) and became generally available 2026-10-13 — [9to5Google 2026-09-30](https://9to5google.com/2026/09/30/gemini-4-argon-announcement/); [Wikipedia](https://en.wikipedia.org/wiki/Gemini_(language_model)); [VentureBeat](https://venturebeat.com/technology/google-unveils-gemini-4-argon-retaking-benchmark-lead-over-openai-and-anthropic-but-in-limited-release).

**Independent frontier indicators**
- After its Feb 2026 release, Gemini 3.1 Pro "tops [Artificial Analysis] Intelligence Index at same price" [I] — [DeepLearning.AI The Batch](https://www.deeplearning.ai/the-batch/google-releases-gemini-3-1-pro-in-preview-tops-intelligence-index-at-same-price).
- At GPT-5.6's launch (July 2026), GPT-5.6 Sol (max) scored 59 on the AA Intelligence Index, one point below Claude Fable 5 (max), at about a third of the cost. On the AA Coding Agent Index, GPT-5.6 Sol scored 80, 2.8 points above Fable 5 [I] — [Artificial Analysis](https://artificialanalysis.ai/articles/gpt-5-6-has-landed).
- AA Index v4.3: Claude Fable 5.1 (max) and GPT-6 Astra (max) tied at 53 [I] — [Artificial Analysis v4.3 announcement](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3).
- Current AA v4.3.2 leaderboard (late Oct 2026): #1 Claude Opus 5.5 (Max) at 58, #2 Claude Sonnet 5.5 at 56, and Opus 5.5 (xhigh) also at 56. GPT-6 Astra is at 52.67 and GPT-5.6 Sol at 46.97 [I] — [Artificial Analysis leaderboard](https://artificialanalysis.ai/leaderboards/models); [AA Index v4.3.2](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index). Contradicted by [benchlm (unofficial)](https://benchlm.ai/benchmarks/artificialanalysis), which lists GPT-5.6 Sol (58.9) ahead of Opus 5.5 (57.6) using mixed self-reports.
- Vals Index: Gemini 4 Argon ranks #3 of 28 at 69.24% (an earlier snapshot had it #1 at 68.90%) [I] — [Vals AI](https://www.vals.ai/models/google_gemini-4-argon).
- AA index scores are **not comparable across index versions**: Fable 5.1 scored 66 in AA's 1 Sept article and 53 under v4.3 — per the [search summary of AA pages](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3).

### Inferences
- **Suggested "Frontier" snapshot anchors** for the white-collar model:
  - **Q4 2025 (Dec 31, 2025):** a three-way frontier. Claude Opus 4.5 leads agentic coding and computer use (SWE-bench Verified 80.9%, OSWorld 66.3%). GPT-5.2 Thinking leads ARC-AGI-2 (52.9%), GDPval (70.9%) and SWE-bench Pro (55.6%). Gemini 3 Pro / Deep Think leads HLE and GPQA. For agentic white-collar work, Opus 4.5 is the defensible anchor; for knowledge-work quality (GDPval), GPT-5.2.
  - **Q1 2026 (Mar 31, 2026):** Opus 4.6 (Feb 5), GPT-5.4 (Mar 5) and Gemini 3.1 Pro (Feb 19). GPT-5.4 has the best published OSWorld-Verified (75.0%) and GDPval (83.0%). Opus 4.6 leads HLE-with-tools, BrowseComp and GDPval-AA Elo. Gemini 3.1 Pro leads ARC-AGI-2 (77.1%) and the AA index.
  - **Q2 2026 (Jun 30, 2026):** Anthropic's Fable 5 / Mythos 5 (Jun 9) is the frontier: Mythos 5 has SWE-bench Pro 80.3%, OSWorld-Verified 85.0% and HLE-with-tools 64.5%, with Fable 5 within 1–3 points on most tests. Mythos Preview (gated) was already above all public models from April. Best Opus at quarter end: Opus 4.8. Best public non-Anthropic: GPT-5.5 (GPT-5.6 was in limited preview).
  - **Q3 2026 (Sep 30, 2026):** Opus 5.5 (Sep 22), Fable 5.1 / Mythos 5.1 (Sep 1) and GPT-6 Astra (Sep 3). On Anthropic's own table Opus 5.5 beats Fable 5.1 and GPT-6 Astra on most items. It loses to Astra on AutomationBench and Terminal-Bench-Science.
  - **Late Oct 2026:** Opus 5.5 is #1 on Artificial Analysis. Gemini 4 Argon (GA Oct 13) claims SOTA on DeepSWE and AutomationBench, but Vals has it at #3 and it trails Opus 5.5 by about 9 points on Terminal-Bench 4.0. GPT-6 Astra is the main OpenAI peer.
- Release cadence sped up sharply: Anthropic shipped a new Opus about every 2 months in 2026 (Feb, Apr, May, Jul, Sep), and Opus 5 came only 2 months after Opus 4.8 ([TechCrunch](https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/)).

### Gaps
- Exact day-level dates for **GPT-5.1** (believed Nov 12, 2025) and **GPT-5.2** (believed Dec 11, 2025) were not confirmed in sources fetched this session. Only "four weeks apart" and "December 2025" were confirmed.
- GPT-6.1 Sol and Terra dates rest on one secondary site and are unconfirmed.
- Haiku 4.5 / 5.5 and Sonnet 4.6 / 5.5 dates rest on Wikipedia alone.
- The **Mythos 5 / Fable 5 June 9 vs July 9** conflict is unresolved. Wikipedia and multiple trackers say June 9.
- The 2025-09 OpenAI and Google baselines (GPT-5, released Aug 2025; Gemini 2.5 Pro) were not researched in detail.
- xAI (Grok), Meta (Muse Spark is mentioned in [R&D World](https://www.rdworldonline.com/claude-mythos-leads-17-of-18-benchmarks-anthropic-measured-muse-spark-put-meta-back-in-the-frontier-club-and-openais-spud-model-is-reportedly-near-launch/)) and Chinese labs were out of scope and not researched.

---

## Q2. Headline benchmark scores per release

### Takeaway
Anthropic's headline numbers rose from SWE-bench Verified 77.2% (Sonnet 4.5) to 80.9% (Opus 4.5), 87.6% (Opus 4.7), 88.6% (Opus 4.8) and 93.9% (Mythos Preview), after which vendors stopped reporting the saturated benchmark. SWE-bench Pro went from about 53% (Opus 4.6) to 64.3% (4.7), 69.2% (4.8), 77.8% (Mythos Preview) and 80.3% (Mythos 5). OSWorld-Verified went from 61.4% (Sonnet 4.5) to 66.3%, 72.7%, 78.0%, 83.4% and about 85% (Mythos 5). Almost all launch numbers are vendor-reported. Independent coverage exists mainly from Artificial Analysis, Vals AI, METR and ARC Prize.

### Cited Findings

**Table A — Anthropic releases (all [V] unless marked)**

| Model (date) | SWE-bench Verified | SWE-bench Pro | Terminal-Bench | OSWorld | ARC-AGI-2 | HLE (no tools / tools) | GPQA Diamond | BrowseComp | GDPval-AA (Elo) | Other |
|---|---|---|---|---|---|---|---|---|---|---|
| Sonnet 4.5 (2025-09-29) | 77.2% (200K); 82.0% high-compute ([Decrypt](https://decrypt.co/es/342254/review-anthropic-lanza-claude-sonnet-4-5-con-77-2-en-swe-bench-y-30-horas-de-programacion?amp=1), [CometAPI](https://www.cometapi.com/models/anthropic/claude-sonnet-4-5)) | – | – | 61.4% (Sonnet 4 was 42.2%) | 13.6% ([table via timkellogg](https://timkellogg.me/threads/2025-11-24-opus-45-now-13rd-the-cost-and-sota-in-programm/)) | – | – | – | – | "30 hours" autonomous (see Q3) |
| **Opus 4.5** (2025-11-24) | 80.9% | – | TB 2.0: 59.3% (system card). Later cited as 59.8% in Opus 4.6 comparisons ([Vellum](https://www.vellum.ai/blog/claude-opus-4-6-benchmarks)) | 66.3% | 37.6% | – | – | BrowseComp-Plus 85.3% (with context techniques) ([Anthropic](https://www.anthropic.com/news/claude-opus-4-5)) | – | Vending-Bench: +29% vs Sonnet 4.5; beat every human candidate on Anthropic's 2-hour take-home exam ([Anthropic](https://www.anthropic.com/news/claude-opus-4-5)). Sources for SWE-V / TB / OSWorld / ARC: [timkellogg table](https://timkellogg.me/threads/2025-11-24-opus-45-now-13rd-the-cost-and-sota-in-programm/), [benchlm citing system card](https://www.benchlm.ai/models/claude-opus-4-5) |
| **Opus 4.6** (2026-02-05) | 80.8%; 81.42% with prompt modification ([Anthropic](https://www.anthropic.com/news/claude-opus-4-6)) | 53.4% (as listed in Mythos Preview comparison, [CometAPI](https://www.cometapi.com/fr/models/anthropic/claude-mythos-preview/)) | TB 2.0: 65.4% (led TB 2.0 at launch per Anthropic, but GPT-5.3-Codex posted 77.3% the same day) | 72.7% ([Vellum](https://www.vellum.ai/blog/claude-opus-4-6-benchmarks)) | 68.8% (other configs: 65.1%; [ARC/DeepLearning.AI](https://www.deeplearning.ai/the-batch/google-releases-gemini-3-1-pro-in-preview-tops-intelligence-index-at-same-price) 69.2% at $3.47/task) | tools: 53.0% (corrected from 53.1% on 2026-02-23) ([Anthropic](https://www.anthropic.com/news/claude-opus-4-6)) | 91.3% ([computingforgeeks](https://computingforgeeks.com/claude-opus-4-7-released-features-benchmarks/)) | 84.0%–86.8% multi-agent ([Anthropic](https://www.anthropic.com/news/claude-opus-4-6)). Also listed as 83.7% in Opus 4.7 comparisons | about +144 Elo over GPT-5.2 and +190 over Opus 4.5 ([Anthropic](https://www.anthropic.com/news/claude-opus-4-6)) | Vending-Bench 2: earns $3,050.53 more than Opus 4.5. MCP Atlas 62.7%. MRCR v2 1M 8-needle 76%. BigLaw Bench 90.2% ([Anthropic](https://www.anthropic.com/news/claude-opus-4-6)) |
| Mythos Preview (2026-04-07, gated) | 93.9% | 77.8% | TB 2.0: 82.0% | OSWorld-Verified 79.6% ([computingforgeeks](https://computingforgeeks.com/claude-opus-4-7-released-features-benchmarks/)). **Conflict:** 85.4% per [DataCamp/benchlm](https://www.datacamp.com/blog/claude-mythos-5) | – | – | – | – | – | All [V, via secondary]: [CometAPI](https://www.cometapi.com/fr/models/anthropic/claude-mythos-preview/), [claudefa.st](https://claudefa.st/blog/models/claude-mythos). "Leads 17 of 18 benchmarks Anthropic measured" ([R&D World](https://www.rdworldonline.com/claude-mythos-leads-17-of-18-benchmarks-anthropic-measured-muse-spark-put-meta-back-in-the-frontier-club-and-openais-spud-model-is-reportedly-near-launch/)) |
| **Opus 4.7** (2026-04-16) | 87.6% | 64.3% | TB 2.0: 69.4% | OSWorld-Verified 78.0% | – | 46.9% / 54.7% | 94.2% | 79.3% (a regression vs 4.6) | – | MCP-Atlas 77.3%. Sources: [LLM Stats](https://llm-stats.com/blog/research/claude-opus-4-8-launch), [computingforgeeks](https://computingforgeeks.com/claude-opus-4-7-released-features-benchmarks/), [Vellum](https://vellum.ai/blog/claude-opus-4-7-benchmarks-explained) |
| **Opus 4.8** (2026-05-28) | 88.6% | 69.2% | TB 2.1: 74.6% ([LLM Stats](https://llm-stats.com/blog/research/claude-opus-4-8-launch)). **Conflict:** 82.7% on TB 2.1 per Mythos 5 / Sonnet 5 comparison tables ([DataCamp](https://www.datacamp.com/blog/claude-mythos-5), [Vellum Sonnet 5](https://www.vellum.ai/md/blog/claude-sonnet-5-benchmarks-explained)) | OSWorld-Verified 83.4% (partly a harness update) | – | 49.8% / 57.9% | 93.6% | 84.3% single-agent; 88.5% multi-agent | 1890 (v1 per LLM Stats); 1615 on GDPval-AA v2 per [Vellum](https://www.vellum.ai/md/blog/claude-sonnet-5-benchmarks-explained) | SWE-bench Multilingual 84.4%, MCP-Atlas 82.2%, USAMO 2026 96.7%, ScreenSpot-Pro 87.9%, Toolathlon 59.9% ([LLM Stats](https://llm-stats.com/blog/research/claude-opus-4-8-launch)) |
| Mythos 5 / Fable 5 (2026-06-09) | – | Mythos 5: 80.3% | TB 2.1: 88.0%* | OSWorld-Verified 85.0% | – | Mythos 5: 59.0%* / 64.5%* | – | – | – | Fable 5 is within 1–3 points of Mythos 5 on most tests (*larger gap where Fable's classifiers route queries to Opus). Fable 5 on TB 4.0: 42.0% ([listify](https://www.listify.cool/en/blog/claude-fable-5-1-guide)). [DataCamp](https://www.datacamp.com/blog/claude-mythos-5); [benchlm](https://benchlm.ai/models/claude-mythos-5) |
| Sonnet 5 (2026-06-30) | – | 63.2% | TB 2.1: 80.4% | OSWorld-Verified 81.2% | – | 43.2% / 57.4% | – | – | 1618 (v2; edges Opus 4.8's 1615) | $3/$15 per Mtok ($2/$10 introductory). [Vellum](https://www.vellum.ai/md/blog/claude-sonnet-5-benchmarks-explained); [Codersera](https://codersera.com/blog/claude-sonnet-5-launch-guide-2026/amp/) |
| **Opus 5** (2026-07-24) | Not published by Anthropic. A 96.0% claim on [SeaWork](https://seawork.ai/en/blogs/claude-opus-5-for-coding/) is uncorroborated | 79.2% claimed by one secondary source (uncorroborated) | TB 4.0: 52.3%; TB-Science 29.0% ([Anthropic Opus 5.5 table](https://www.anthropic.com/claude-opus-5-5)) | OSWorld 2.1 (partial): 74.0%. Anthropic says it beats Fable 5's best OSWorld 2.0 result at about 1/3 the cost | ARC-AGI-3: about 3x the next-best model ([Anthropic](https://www.anthropic.com/news/claude-opus-5)) | tools: 63.6% | – | – | 1708 (v2.1) | AutomationBench 26.9%. FrontierCode 48.0%. CursorBench 4.0 46.6%. Frontier-Bench v0.1: more than 2x Opus 4.8 ([Anthropic](https://www.anthropic.com/news/claude-opus-5)) |
| Fable 5.1 / Mythos 5.1 (2026-09-01) | – | – | TB 4.0: Fable 5.1 55.8%, Mythos 5.1 60.9%. TB-Science 52.6% (Fable 5 was 24.7%) | OSWorld 2.0 strict: 41.7%. OSWorld 2.1 (partial): 80.7% | – | Fable 5.1 tools: 65.6% | – | – | Fable 5.1: 1735 | AutomationBench 31.4%. CursorBench 3.2: 73.4%. Cache reads 75% cheaper. [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/); [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads); [Anthropic Opus 5.5 table](https://www.anthropic.com/claude-opus-5-5) |
| **Opus 5.5** (2026-09-22) | Not reported | Not reported | **TB 4.0: 66.4%** (xhigh effort); TB-Science 58.7% | **OSWorld 2.1 (partial): 81.8%** | – | **tools: 67.7%** | – | – | **1846 (v2.1)** | FrontierCode v1.1 54.4%. CursorBench 4.0 57.8%. AutomationBench 40.0% (Zapier). Chartography 89.0%. Run with production safeguards, which Anthropic says likely lowered some scores ([Anthropic](https://www.anthropic.com/claude-opus-5-5)) |

**Opus 5.5 launch comparison table** (Anthropic [V], read directly from [anthropic.com/claude-opus-5-5](https://www.anthropic.com/claude-opus-5-5), 2026-09-22). Columns are Opus 5.5 / Fable 5.1 / Opus 5 / GPT-6 Astra / GPT-5.6 Sol:
- Terminal-Bench 4.0: 66.4 / 55.8 / 52.3 / 57.9 / 37.3
- FrontierCode v1.1: 54.4 / 50.3 / 48.0 / 53.3 / 47.5
- CursorBench 4.0: 57.8 / 51.8 / 46.6 / – / 41.7
- GDPval-AA v2.1 Elo: 1846 / 1735 / 1708 / 1542 / 1588
- AutomationBench: 40.0 / 31.4 / 26.9 / **41.4** / 28.8
- HLE with tools: 67.7 / 65.6 / 63.6 / 57.2 / –
- Terminal-Bench-Science 0.1: 58.7 / 52.6 / 29.0 / **64.6** / 22.4
- OSWorld 2.1 (partial): 81.8 / 80.7 / 74.0 / – / –

**Table B — OpenAI releases (all [V] unless marked)**

| Model (date) | Headline numbers | Source |
|---|---|---|
| GPT-5.1 Thinking (Nov 2025) | SWE-bench Pro 50.8%; ARC-AGI-2 17.6% | [OpenAI GPT-5.2 post](https://openai.com/blog/introducing-gpt-5-2) comparison, via search |
| GPT-5.1-Codex-Max (2025-11-19) | SWE-bench Verified 77.9% (xhigh); TB 2.0 58.1%; **"work on tasks for more than 24 hours"** in internal evals via compaction | [OpenAI](https://openai.com/index/gpt-5-1-codex-max/); [itecsonline](https://itecsonline.com/post/chatgpt-5-1-codex-max) |
| GPT-5.2 Thinking (Dec 2025) | SWE-bench Pro 55.6% (SOTA at the time); ARC-AGI-2 Verified 52.9%; **GDPval 70.9%** wins-or-ties vs professionals across 44 occupations (GPT-5 Thinking: 38.8%); TB 2.0 64.7% (Codex CLI); OSWorld-Verified 47.3% | [OpenAI](https://openai.com/blog/introducing-gpt-5-2); [The Decoder](https://the-decoder.com/gpt-5-2-lands-to-top-googles-gemini-3-in-the-ai-benchmark-game-just-four-weeks-after-gpt-5-1/); [Vellum](https://www.vellum.ai/blog/claude-opus-4-6-benchmarks) |
| GPT-5.3-Codex (2026-02-05) | **TB 2.0 77.3%** (SOTA); SWE-bench Pro 56.8%; OSWorld-Verified 64.7%, later restated as 74.0% in the GPT-5.4 table | [Ubergizmo](https://www.ubergizmo.com/2026/02/gpt-5-3-codex/); [OpenAI](https://openai.com/index/introducing-gpt-5-3-codex); [Noqta](https://noqta.tn/en/news/openai-gpt-5-4-million-token-computer-use-2026) |
| GPT-5.4 (2026-03-05) | **OSWorld-Verified 75.0%**, above the 72.4% human baseline; **GDPval 83.0%**; SWE-bench Pro 57.7%; BrowseComp 82.7% (Pro: 89.3%); HLE with tools 58.7%; GPQA (Pro) 94.4%; TB 2.0 75.1% | [Noqta](https://noqta.tn/en/news/openai-gpt-5-4-million-token-computer-use-2026); [The Decoder](https://the-decoder.com/openai-launches-gpt-5-4-thinking-and-pro-combining-coding-reasoning-and-computer-use-in-one-model/); [computingforgeeks](https://computingforgeeks.com/claude-opus-4-7-released-features-benchmarks/); [Interesting Engineering](https://interestingengineering.com/ai-robotics/opanai-gpt-5-5-agentic-coding-gains) |
| GPT-5.5 (2026-04-23) | **TB 2.0 82.7%** (Opus 4.7: 69.4%, Gemini 3.1 Pro: 68.5%); SWE-bench Pro 58.6% (below Opus 4.7's 64.3%); **GDPval 84.9%**; FrontierMath Tier 4 35.4%; OSWorld-Verified 78.7%; HLE with tools 52.2%; TB 2.1 (Codex CLI) 83.4%; API price roughly double GPT-5.4 | [Interesting Engineering](https://interestingengineering.com/ai-robotics/opanai-gpt-5-5-agentic-coding-gains); [Decrypt](https://decrypt.co/365333/openai-gpt-5-5-release-agentic-coding-benchmarks); [benchlm](https://www.benchlm.ai/compare/gpt-5-4-vs-gpt-5-5); [DataCamp](https://www.datacamp.com/blog/claude-mythos-5) |
| GPT-5.6 Luna / Terra / Sol (GA 2026-07-09) | TB 2.1: Sol 88.8%, Sol Ultra 91.9% (Terra per-tier figures conflict: 82.5% vs 87.4%). [I] AA Intelligence Index: Sol (max) 59, one point below Fable 5. [I] AA Coding Agent Index: Sol 80 (+2.8 vs Fable 5) | [OpenAI](https://openai.com/index/gpt-5-6/); [Artificial Analysis](https://artificialanalysis.ai/articles/gpt-5-6-has-landed); [Vellum](https://www.vellum.ai/blog/gpt-5-6-benchmarks-explained) |
| GPT-6 Astra (2026-09-03 / 04) | OSWorld 2.0 offline subset 72.6% (GPT-5.6 Sol: 65.7%; avg time per task about 75 min down to 40 min); TB 4.0 57.7–57.9%; TB-Science 64.6%; DeepSWE v1.1 74.1%; **no GDPval in launch table**. OpenAI called it SOTA in coding, math and computer/browser use. $10/$50 per Mtok; 1.05M context. [I] AA index 61 (v4.1.1) at launch, 52.67 (v4.3.2). [I] ARC-AGI-3: 62.7% (standard harness) vs 99.9% (OpenAI provider adapter). [I] About -80 Elo on GDPval-AA v2 (AA testing) | [The New Stack](https://thenewstack.io/openai-gpt6-astra-benchmarks/); [LLM Stats](https://llm-stats.com/blog/research/gpt-6-astra-launch); [computingforgeeks](https://computingforgeeks.com/gpt-6-astra-released-features-benchmarks/); [Wikipedia](https://en.wikipedia.org/wiki/GPT-6) |

**Table C — Google releases (all [V] unless marked)**

| Model (date) | Headline numbers | Source |
|---|---|---|
| Gemini 3 Pro (2025-11-18) | HLE 37.5% (no tools; Deep Think 41%); ARC-AGI-2 31.1% (Deep Think 45.1%); GPQA Diamond 91.9%; **Vending-Bench 2 mean net worth $5,478.16** (272% above GPT-5.1); SWE-bench Verified 76.2%; TB 2.0 about 54–56%. Anthropic later measured Gemini 3 at 56.7% and GPT-5.1 at 48.6% on a Terminus-2-harness benchmark after fixing its hosting setup | [VentureBeat](https://venturebeat.com/ai/google-unveils-gemini-3-claiming-the-lead-in-math-science-multimodal-and); [Vellum](https://vellum.ai/blog/google-gemini-3-benchmarks); [Anthropic Opus 4.5 footnote](https://www.anthropic.com/news/claude-opus-4-5) |
| Gemini 3.1 Pro (2026-02-19) | **ARC-AGI-2 77.1%** at $0.96/task (Opus 4.6: 68.8%; GPT-5.2: 52.9%); GPQA 94.3%; SWE-bench Verified 80.6%; MMMU-Pro 80.5% (Gemini 3 Pro: 81.0%); HLE with tools 51.4%; BrowseComp 85.9%; TB 2.0 68.5%. [I] Topped the AA Intelligence Index | [The Decoder](https://the-decoder.com/google-releases-gemini-3-1-pro-with-improved-reasoning-capabilities/); [DeepLearning.AI](https://www.deeplearning.ai/the-batch/google-releases-gemini-3-1-pro-in-preview-tops-intelligence-index-at-same-price); [computingforgeeks](https://computingforgeeks.com/claude-opus-4-7-released-features-benchmarks/) |
| Gemini 3.5 Flash (2026-05-19) | TB 2.1 76.2%; MCP Atlas 83.6%; CharXiv Reasoning 84.2% | [CometAPI summary of Google announcement](https://www.cometapi.com/gemini-3-5-pro-release-date-rumored-specifications-all-we-know-in-2026-updated-july-2026/) |
| Gemini 4 Argon (announced 2026-09-30, GA 2026-10-13) | Claimed SOTA on DeepSWE v1.1 (77.9%) and LVBench (91.7%); #1 on AutomationBench (51.3%); tied #1 on CWE-bench v1 (68%); TB 4.0 57.4% (vs Opus 5.5's 66.4%). Not independently reproduced at launch. [I] Vals Index 69.24%, #3 of 28. [I] Arena Agent board (Oct 26): 11.75% net improvement over 45,840 votes | [VentureBeat](https://venturebeat.com/technology/google-unveils-gemini-4-argon-retaking-benchmark-lead-over-openai-and-anthropic-but-in-limited-release); [Vals AI](https://www.vals.ai/models/google_gemini-4-argon); [NeuralTrust](https://neuraltrust.ai/blog/gemini-4-argon) |

### Inferences
- **GDPval trajectory** (OpenAI's measure of win-or-tie rate vs industry professionals across 44 occupations) is the most directly relevant series for a white-collar saturation model: GPT-5 Thinking 38.8% (Aug 2025), GPT-5.2 70.9% (Dec 2025), GPT-5.4 83.0% (Mar 2026), GPT-5.5 84.9% (Apr 2026). OpenAI dropped GDPval from the GPT-6 Astra launch table. The Anthropic-side equivalent is GDPval-AA Elo, which is not on a comparable scale.
- **Computer use (OSWorld-Verified)** passed the human baseline (72.4%) in March 2026 with GPT-5.4 (75.0%). Anthropic models reached 78.0% (Opus 4.7, Apr), 83.4% (Opus 4.8, May) and about 85% (Mythos 5, Jun). After that the benchmark was effectively superseded by OSWorld 2.0/2.1.
- Terminal-Bench 2.0 was saturating by mid-2026 (GPT-5.5 82.7%, GPT-5.6 Sol 88.8% on 2.1). Terminal-Bench 4.0 resets the frontier to about 55–66% (Opus 5.5 66.4%).
- One reasonable "frontier capability index" for each snapshot is the best publicly available score on {SWE-bench Pro, OSWorld-Verified, GDPval, HLE with tools} at quarter end, taking the max across vendors.

### Gaps
- **Requested but not found or not confirmed for most models:** tau2-bench (retail / airline / telecom), MMMU, Finance Agent (Vals AI), ARC-AGI-1, Vending-Bench 2 absolute values for Claude models, and SWE-bench Verified / Pro for Opus 5 and Opus 5.5 (Anthropic stopped publishing them). Anthropic's launch pages present these in chart images that could not be read; the system cards (e.g., [Opus 4.6 system card PDF](https://www-cdn.anthropic.com/0dd865075ad3132672ee0ab40b05a53f14cf5288.pdf)) would contain them but were not parsed.
- Independent SWE-bench (swebench.com), tbench.ai, os-world.github.io, arcprize.org and Epoch AI leaderboard snapshots were not fetched; independent replication of most vendor numbers is unverified.
- **Unresolved conflicts:** Opus 4.8 TB 2.1 (74.6% vs 82.7%); Mythos Preview OSWorld-Verified (79.6% vs 85.4%); Opus 4.5 TB 2.0 (59.3% vs 59.8%); Opus 4.6 ARC-AGI-2 (68.8% / 69.2% / 65.1% by configuration); Opus 4.6 BrowseComp (84.0% / 86.8% / 83.7%).
- No reliable Gemini 3.5 Pro numbers exist; only leaks circulate.

---

## Q3. Which releases marked the start of reliable "agentic" work (long-horizon autonomous coding / computer use), and what's the evidence?

### Takeaway
The "agentic era" claims start with **Sonnet 4.5 (Sept 29, 2025: "30 hours" autonomous coding)** and **GPT-5.1-Codex-Max (Nov 19, 2025: more than 24 hours)**. The commonly cited inflection for real-world adoption is **Opus 4.5 (Nov 24, 2025)**, which coincided with Claude Code going viral over winter 2025–26. METR's independent time-horizon measurements put Opus 4.6 at about 12 hours and an early Mythos Preview at about 17 hours (50% success) by spring 2026. By Opus 5.5 (Sept 2026), customer reports describe 9.5–18+ hour unattended runs.

### Cited Findings
- **Sonnet 4.5 (Sep 2025):** examples of up to about 30 hours of autonomous operation in internal and early-customer tests, versus about 7 hours for Opus 4 [V, anecdotal, not a standardized benchmark]. OSWorld rose from 42.2% to 61.4% in four months — [Decrypt](https://decrypt.co/es/342254/review-anthropic-lanza-claude-sonnet-4-5-con-77-2-en-swe-bench-y-30-horas-de-programacion?amp=1); [Medium](https://medium.com/@cognidownunder/claude-sonnet-4-5-4ddf33d53cd4).
- **Claude Code on the web and sandboxing** launched 2025-10-20 — [Wikipedia](https://en.wikipedia.org/wiki/Claude_(language_model)).
- **GPT-5.1-Codex-Max (Nov 2025):** "in our internal evaluations, we've observed GPT‑5.1‑Codex‑Max work on tasks for more than 24 hours", enabled by context compaction [V] — [OpenAI](https://openai.com/index/gpt-5-1-codex-max/).
- **Opus 4.5 (Nov 2025):** beat every human candidate on Anthropic's 2-hour engineering take-home (with parallel test-time compute). Customers report "consistent performance through 30-minute autonomous coding sessions" [V] — [Anthropic](https://www.anthropic.com/news/claude-opus-4-5). "Winter 2025–2026: Claude Code went viral, including among non-programmers doing vibe coding, alongside Opus 4.5's performance gains" — [Wikipedia](https://en.wikipedia.org/wiki/Claude_(language_model)).
- **Misuse evidence of autonomy (Nov 2025):** Anthropic reported that a China-based group used Claude Code to automate 80–90% of an espionage campaign against about 30 organizations — [Wikipedia](https://en.wikipedia.org/wiki/Claude_(language_model)).
- **Claude Cowork** (agentic desktop / knowledge-work product) launched as a research preview in Jan 2026. Dispatch (send tasks from phone) followed in Mar 2026. Claude in Chrome became GA in Aug 2026 — [Wikipedia](https://en.wikipedia.org/wiki/Claude_(language_model)).
- **Opus 4.6 (Feb 2026):** agent teams in Claude Code, context compaction and 1M context. Rakuten reports it closed 13 issues and assigned 12 in one day; SentinelOne reports a multi-million-line migration in half the time [V] — [Anthropic](https://www.anthropic.com/news/claude-opus-4-6). Nicholas Carlini reported 16 Opus 4.6 agents wrote a Rust C compiler able to compile the Linux kernel, for about $20,000 — [Wikipedia](https://en.wikipedia.org/wiki/Claude_(language_model)).
- **METR time horizons [I]:**
  - Opus 4.6 was first estimated at about 14.5 hours (50% success), then corrected on 2026-03-03 to about 12 hours.
  - An early Claude Mythos Preview reached 17.4 hours at 50% (95% CI 8.5–55.1 h). Its 80% horizon was 185.9 minutes, about 3.1 hours.
  - METR warns that "measurements above 16 [hours] are unreliable with [the] current task suite".
  - METR's 2026-05-19 Frontier Risk Report placed the most capable shared model at 16–20 hours (50%).
  - A secondary fit reports a doubling time of about 105 days.
  - Sources: [Wikipedia: METR](https://en.wikipedia.org/wiki/METR); [agitracker](https://agitracker.io/blog/metr-time-horizons-2026/); [IQ Metrics](https://iqmetrics.org/news/metr-time-horizon-explained-the-latest-numbers-and-why-it-is-not-an-iq/). The 105-day figure is secondary and unverified against metr.org.
- **GPT-5.4 (Mar 2026):** native computer use, and OSWorld-Verified 75.0% exceeded the 72.4% human baseline [V] — [Noqta](https://noqta.tn/en/news/openai-gpt-5-4-million-token-computer-use-2026); [LetsDataScience](https://www.letsdatascience.com/blog/openai-built-a-model-that-uses-a-computer-better-than-you-do-it-needed-to).
- **GPT-6 Astra (Sep 2026):** average time per OSWorld 2.0 task fell from about 75 to about 40 minutes vs GPT-5.6 Sol [V] — [The New Stack](https://thenewstack.io/openai-gpt6-astra-benchmarks/). OpenAI framed the launch as the "AGI era" ([The New Stack headline](https://thenewstack.io/openai-gpt6-astra-benchmarks/)).
- **Opus 5.5 (Sep 2026), customer and internal claims [V]** — [Anthropic](https://www.anthropic.com/claude-opus-5-5):
  - A Clio engineer: "stayed on task for over 18 hours" on an unattended six-repo task.
  - A 200,000-line codebase audit and fix took under 3 hours (Opus 5 took more than 20).
  - A HAProxy C-to-Rust translation took 9.5 hours (Fable 5.1: 12).
  - A 680,000-line migration finished in under a day.
  - An internal financial-modeling task took 63 minutes (Opus 5: 93).
- **Claude Code commercial traction:**
  - About a $1B run-rate in Nov 2025 (Sacra, via secondary).
  - More than a $2.5B run-rate in Feb 2026 (Reuters, via secondary), with business subscriptions quadrupling since the start of the year.
  - About $8B by May 2026 (Sacra estimate only, unverified).
  - Anthropic's overall run-rate was $14B in Feb 2026 and $30B in Apr 2026 (Reuters, via secondary).
  - Sources: [MindStudio](https://www.mindstudio.ai/blog/claude-code-2-5-billion-annualized-revenue-terminal-tool); [fourweekmba](https://fourweekmba.com/ai-claude-code-run-rate-agentic-layer/); [getpanto](https://www.getpanto.ai/blog/anthropic-ai-statistics).

### Inferences
- For the white-collar model, a defensible "start of reliable agentic work" date is **Q4 2025 (Opus 4.5, Nov 24, 2025)**. Long-run claims existed before it (Sonnet 4.5's 30 hours, Codex-Max's 24+ hours), but the inflection in real usage (the Claude Code virality, the run-rate growing from about $1B to $2.5B or more within about three months) and independent METR horizons in the multi-hour range line up from Opus 4.5 / Opus 4.6 onward.
- Time-horizon progression suitable for snapshots, mixing independent and vendor claims:
  - Q4 2025: roughly multi-hour. The METR value for Opus 4.5 was not retrieved this session.
  - Q1 2026: about 12 h at 50% (Opus 4.6, METR).
  - Q2 2026: about 16–20 h (METR May report; Mythos Preview 17.4 h).
  - Q3 / Oct 2026: beyond METR's reliable measurement range. Vendor anecdotes report 18-hour or longer unattended runs.
- The 80% horizon (about 3 hours for Mythos Preview) is the better proxy for "reliable" delegation and is roughly an order of magnitude shorter than the 50% horizon.

### Gaps
- METR's time-horizon values for Opus 4.5, GPT-5.x, Opus 4.7/4.8, Fable 5, Opus 5 / 5.5 and GPT-6 Astra were not retrieved. The live page (metr.org/time-horizons) was not fetched.
- No primary Anthropic disclosure of Claude Code revenue above $2.5B was found. The $8B figure is a single-aggregator estimate.
- Anthropic's original wording and test conditions for the Sonnet 4.5 "30 hours" claim were not verified against the primary announcement.
