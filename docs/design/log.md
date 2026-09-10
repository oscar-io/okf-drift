# design: update log

Why the decisions in this directory changed. Newest first.

## 2026-09-10

**[`language-choice.md`](language-choice.md) written.** Go was the runner-up and the
document says so, along with the condition that would reverse the decision: adoption
outside JavaScript-shaped repositories. A decision record that lists no rejected option
is a press release.

**[`catalogue-generation.md`](catalogue-generation.md) written**, then amended the same
day when the missing-`description` case turned up. The amendment is the interesting
half: the original decision was "the catalogue is derived", which is clean and would
have justified deleting text the tool could not regenerate. "Derived, but never
destructive" is the version that survived contact with a real edge case.
