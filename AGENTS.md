# Agent Instructions for SFRS ETT

## General Principles
- **Desloppify**: This repository uses Desloppify to ensure high code quality.
- **Guardrail**: For every step in `DEVELOPMENT_PLAN.md`, you MUST run `npx desloppify scan` (if available) or perform a thorough self-review based on the "Deslopify Guardrails" section in the plan.
- **Verification**: Do not mark a step as complete until all verification actions listed in that step have passed.

## Specific Checks
- Ensure all dates are formatted as `DD/MM/YYYY`.
- Ensure all interactive elements have a minimum touch target of 44x44px.
- Verify that `Functional` tests satisfy `Visual` requirements.
- Verify that only an `Acceptance` test can clear an "Off the Run" (OTR) status.
