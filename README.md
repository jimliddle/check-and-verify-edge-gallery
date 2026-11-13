# Check and Verify for AI Edge Gallery

Check an answer before showing it. Review the evidence, reasoning and calculations, correct mistakes, and explain anything that remains uncertain.

Use this skill for factual questions, comparisons, calculations and answers based on documents or supplied text. It works with the tools already available in Edge Gallery. Pocket Docs is one example; it is not required.

No new APK or API key is needed for the skill itself. Any search or document tools you use keep their own setup requirements.

## What it does

The skill first runs a small execution check. If that succeeds, the model prepares an answer, checks it once, then returns the corrected version. If execution or citation checking fails, the instructions tell the model to report the failure rather than present the draft as checked. It looks for unsupported claims, missing parts of the question, contradictory evidence and calculation errors. If more evidence would help, it can make one further search and read a fuller passage.

For document answers, a small JavaScript checker checks citation records and quotations, then adds the filenames and page numbers to the answer. It runs locally and makes no network requests.

The final response contains the answer and any remaining uncertainty. Edge Gallery may still display the tool calls used along the way.

## Install

First enable GitHub Pages for this repository: **Settings → Pages → Deploy from a branch → main → /(root)**.

Once deployment finishes, use this skill URL:

```text
https://jimliddle.github.io/check-and-verify-edge-gallery/check-and-verify/
```

Check that [SKILL.md](https://jimliddle.github.io/check-and-verify-edge-gallery/check-and-verify/SKILL.md) displays as plain text before importing. The URL will only work after Pages is enabled and deployed.

In Edge Gallery, open **Agent Skills → Skills → + → Load skill from URL**, enter the URL above and enable the skill.

You can also copy the `check-and-verify` folder onto your phone and select it through **Import local skill**. Copy the whole folder, including `scripts/index.html`.

## Update and check execution

Remove the old **check-and-verify** entry from Edge Gallery, then import the same URL above and enable it. This refreshes the stored instructions. Leave Pocket Docs and its MCP configuration in place.

The current instructions show **Revision: 0.2.0**. In a new conversation, send:

```text
Use Check and Verify. Run only its execution check and return the readiness marker. Do not search documents or prepare an answer.
```

A successful call returns `CHECK_AND_VERIFY_READY_0.2.0`. The check formats a known citation and rejects an unknown citation and an altered quotation. It tests whether the checker runs; it does not establish that a future answer is correct.

If Edge Gallery still shows “Failed to call skill index.html”, the failure occurs before the script runs. In the inspected Edge Gallery source, that message uses the script filename even though the failed lookup is for the skill name. The revised instructions put a complete call with both names first. We have tested that call against the package, but cannot guarantee that Gemma will emit it correctly on the phone.

## Examples

Ask for the skill by name while testing:

> Use Check and Verify before answering: [your question]. Check the evidence, reasoning and calculations, then give the answer and explain anything still uncertain.

### Compare costs

> Use Check and Verify. A membership costs £24 per month or £250 per year. What is the annual saving, and what percentage of the monthly plan's annual cost does that represent?

### Assess a claim

> Use Check and Verify to assess this claim: a survey of 20 customers proves that all customers prefer the new design. What does the evidence actually support?

### Check missing information

> Use Check and Verify. Based only on these notes, tell me the cancellation deadline: “Membership renews annually. Contact support to cancel.”

The notes contain no deadline. The answer should say so rather than invent one.

### Query documents

This example needs a connected document tool, such as Pocket Docs:

> Use Check and Verify before answering. Search my documents: does the warranty cover accidental damage? Explain the terms and cite the exact filename and page. Identify any missing evidence.

### Explain a technical paper

> Use Check and Verify. Search my documents and explain how the encoder processes input positions, then explain how the decoder generates output tokens. Explain what the passages support and what remains unclear.

## Make sure the skill is used

Importing the skill does not make it run on every answer. The model must select and load it. You can request it by name or add this rule to the system prompt:

> When the user asks to check, validate or verify an answer, load check-and-verify before answering. Follow its instructions and use available MCP tools directly when needed. Do not load the same skill again during the review. For ordinary conversation, answer directly.

Keep Edge Gallery's existing skill and tool placeholders. The skill cannot force the model to follow its instructions or prevent the app from displaying an unchecked answer.

## What the code checks

The JavaScript checker rejects unknown citation references, duplicate source identifiers, invalid page numbers and declared quotations that do not match the supplied source text and answer. It adds citations from the supplied filenames and pages.

There are limits:

- The model passes the source records to the checker. If it copies a filename incorrectly before that step, the checker cannot recover the original.
- The checker does not decide whether a source supports an explanation. That remains part of the model's review.
- Only quotations explicitly passed to the checker are checked.
- The model can still change the checker's output when writing its final response.

The review can miss mistakes. It is not an independent fact-check and does not award a “verified” badge. Enforcing exact citations would require changes to the document tool or Edge Gallery itself.

## Tests

Run the tests with Node.js 20 or later:

```sh
node --test tests/checker.test.cjs
```

The 18 automated tests run the JavaScript embedded in the skill's HTML file. They cover citation formatting, invalid inputs, quotation mismatches, the documented execution check, and Edge Gallery’s error-response branch order. They do not run Gemma or Android WebView.

Phone testing is still needed. Keep the model, system prompt and context settings fixed when comparing answers with and without the skill. Include questions with clear answers, missing information, conflicting evidence and calculations. Check citations against the actual tool results.

## Changes in 0.2.0

- Put a complete `run_js` argument example before the review instructions and shorten the review.
- Add an execution check with a version marker, so it can be tested without document retrieval.
- Return both an empty result and an error on failure. Edge Gallery checks for a result field before checking the error; the previous error-only response could be reported as a successful call.
- Stop after a failed check instead of silently continuing with an unchecked answer.

## Files

| File | Purpose |
| --- | --- |
| `check-and-verify/SKILL.md` | Instructions for the model |
| `check-and-verify/scripts/index.html` | Local citation checker |
| `tests/checker.test.cjs` | Automated tests |

See [AI Edge Gallery's skill documentation](https://github.com/google-ai-edge/gallery/blob/main/skills/README.md) for the supported skill format.

## Licence

[MIT](LICENSE).
