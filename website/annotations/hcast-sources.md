Full source list
METR: core documentation
https://metr.org/time-horizons/ (dashboard; update log; “no longer actively updated”, 2026-09-08)
https://metr.org/blog/2026-01-29-time-horizon-1-1/ (TH1.1)
https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ (TH1.0)
https://arxiv.org/abs/2503.14499 (Kwa et al., several versions)
https://arxiv.org/abs/2503.17354 and https://metr.org/hcast.pdf (HCAST; the withholding rationale)
https://metr.org/blog/2024-11-22-evaluating-r-d-capabilities-of-llms/ (RE-Bench)
https://metr.org/notes/2026-03-20-impact-of-modelling-assumptions-on-time-horizon-results/ (“~15% … publicly available”)
https://metr.org/notes/2026-01-22-time-horizon-limitations/
https://metr.org/blog/2025-07-14-how-does-time-horizon-vary-across-domains/
https://metr.org/blog/2025-08-12-research-update-towards-reconciling-slowdown-with-time-horizons/
https://metr.org/blog/2025-06-05-recent-reward-hacking
https://taskdev.metr.org/desiderata/ and https://taskdev.metr.org/introduction/ (task bounty / construction)
METR: data, code and transcripts
https://github.com/METR/eval-analysis-public (runs for all tasks)
https://metr.org/assets/task_results_1_1.yaml and https://metr.org/assets/benchmark_results_1_1.yaml
https://github.com/METR/hcast-public (public task families; check yourself)
https://transcripts.metr.org/ (agent transcripts for public tasks only)
https://github.com/METR/vivaria and https://inspect.aisi.org.uk/ (harnesses)
METR: model evaluation reports (access terms and runs per model)
https://metr.org/evaluations/gpt-5-report/ (pre-release access, NDA, OpenAI’s right to review and approve)
https://metr.org/blog/2026-05-19-frontier-risk-report/
Others are listed at https://metr.org/research. Add any whose time-horizon numbers you cite.
Ties and independence
https://metr.org/about (“METR has not accepted funding from AI companies”; past partnerships; free tokens)
https://metr.org/coi-policy.pdf (v1.1, effective 2026-10-09)
https://metr.org/blog/2026-08-14-funding-update/ (about $71M from foundations and individuals)
https://www.anthropic.com/news/an-update-on-independent-evaluators (Oct 15, 2026; employee-like access)
https://officechai.com/ai/metrs-independence-questioned-after-x-user-highlights-financial-links-between-company-and-anthropic/ (secondary; the Good Ventures allegations are unverified)
The HCAST paper’s author list includes Equistamp, a contractor that co-authored task work. Note it for 4.3.
External re-analyses and critiques
https://arxiv.org/html/2610.12466 (Nguyen and Fithian, UC Berkeley Statistics, Oct 8, 2026; re-analysis using METR’s public data)
https://www.lesswrong.com/posts/sBEzomgnYJmYHki9T/metr-s-data-can-t-distinguish-between-trajectories-and-80
https://www.lesswrong.com/posts/5CGNxadG3JRbGfGfg/notes-on-the-long-tasks-metr-paper-from-a-hcast-task (written by an HCAST task contributor, so possibly an interested party)
https://www.transformernews.ai/p/against-the-metr-graph-coding-capabilities-software-jobs-task-ai (Witkin)
https://www.technologyreview.com/2026/02/05/1132254/this-is-the-most-misunderstood-graph-in-ai/
https://github.com/lhl/realitycheck-data/blob/main/analysis/syntheses/metr-2025-2026-time-horizon-synthesis.md (weak)

Add to the source list:
https://metr.org/notes/2026-03-20-impact-of-modelling-assumptions-on-time-horizon-results/ (already listed; now the source for the 34/228 breakdown)
https://metr.org/blog/2026-02-17-how-we-protect-confidential-information/
https://metr.org/blog/2026-08-31-security-update/ (and the SOC 2 Type I report it links to)
https://metr.org/blog/2026-06-26-gpt-5-6-sol/
https://metr.org/notes/2026-02-13-measuring-time-horizon-using-claude-code-and-codex/ (plus its linked Inspect agents and Triframe implementation)
https://github.com/METR/inspect-metr-task-bridge and the METR Task Standard repository (historical: METR now defines tasks in Inspect)
https://github.com/METR/hcast-public (deprecation notice, 2026-10-20)
https://metr.org/risk-report-feb-mar-2026.pdf (full PDF; check Appendix A for the ZDR and contract passage)
The taskdev Specification, Quality assurance and bounty pages (I couldn’t reach these; check the pause date yourself)
1. The metric. It isn’t quite “human task time where AI succeeds 50% of the time”. It’s the task length, measured in how long skilled humans take, at which a fitted curve predicts the model succeeds half the time. That makes it a measure of task difficulty, estimated across the whole suite. It isn’t how long the model can work. METR’s own limitations note heads off the two most common misreadings: “Time horizon is not the length of time AIs can work independently”, and a 50% horizon of X hours “does not mean we can delegate tasks under X hours to AIs”. The 50% level also flatters the result. Moss argues the 80% figures are off by about an order of magnitude.
2. “A reasonable amount public” undersells it. Of your three benchmarks, METR is the most transparent by a wide margin:
run-level records for all 228 tasks, private ones included,
the analysis code (Berkeley reproduced the plot from it),
a published hash of the private task repository,
a direct comparison of full-suite and private-only results.
That’s why it gets so much scrutiny: outsiders can actually check the statistics. What’s still hidden is the private task content, the transcripts and the per-task scorers. So you can check how outcomes became a horizon, but not whether each outcome was graded correctly.
3. The neutrality problems are specific, not fuzzy. METR isn’t an evaluated provider, so there’s no self-scoring conflict like GDPval’s. The real issues are:
Provider approval of publications. OpenAI “would have had the legal right to block us from sharing conclusions about risk.” This is the most serious one.
Dependence on labs for access: free tokens, pre-release access under NDA, and past partnerships with most of the providers it scores.
Discretionary selection of which models get measured (“others were skipped entirely”).
The Good Ventures/Anthropic allegations are unverified, so leave them out of anything formal.
Weaknesses to add to your picture
Shaky measurement at the top end: 66 of 228 task times are estimates, only 5 of 31 long tasks were baselined, and results “above 16 hrs are unreliable”. GPT-5.6 Sol cheated so much that METR declined to give a robust number.
Self-reports don’t always match the data: the “6 runs per task” claim vs. mostly 4 in the published file, and a post-publication analysis fix (March 2026) that moved some estimates by up to 20%.
Maintenance: the dashboard is “no longer actively updated”, HCAST is deprecated, and the public data stops in early 2026. It’s a well-documented benchmark that may be winding down.
For your paper: METR is the strongest case that verifiability and verification can line up. It published enough that outsiders actually did check it, and they found real problems. GDPval is the opposite case, and SWE-Bench Pro sits in between.

