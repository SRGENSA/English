# طلاقة

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegated by user: React, Vite, Node.js 24.19+ and SQLite. No existing application or dependencies existed at onboarding. No hosted services are needed for exercises and accounts. Real tutoring needs an AI service key.

## Users
Arabic-speaking learners developing English and preparing for the Saudi STEP exam. The user confirmed the proposed audience and delegated name, design and implementation decisions.

## Product Purpose
A daily workspace connecting English practice, STEP preparation, vocabulary and an AI teacher with text and browser-assisted speech.

## Capabilities and Constraints
Current implementation: 36 independently authored exercise questions with bilingual explanations across grammar, reading, vocabulary and listening; 6 vocabulary cards; 12 original bilingual lessons with two questions each; 6 original silent visual MP4s; local speaking recorder with playback; persistent Arabic/English and dark/light preferences; preliminary six-question diagnostic; local progress; email/password accounts with server progress sync; provider-backed tutor adapter; explicitly labeled static teaching example when AI is unavailable. Browser speech recognition and synthesis are not a realtime voice AI session. There is no official STEP affiliation or score guarantee.

AI key is not supplied. Real provider responses have not been verified. Proposed SAR 49/month pricing is illustrative, with no active payment or subscription system. Password reset, email verification, full exam-length question bank, administrator tools and production deployment remain outside the implemented release. Account email, name and progress persist in SQLite; passwords use scrypt; raw session tokens exist only in HttpOnly cookies. Chat is browser-local, and questions sent to the enabled tutor are processed by the AI provider.

## Brand Commitments
Working name طلاقة / TALAQA selected by agent under explicit delegation. Friendly Saudi Arabic voice without invented testimonials, learner counts, score improvements or income claims.

## Product Principles
- Make daily practice approachable.
- Explain why an answer works.
- Clearly distinguish real AI, fixed examples and browser speech features.
- Show actual learner data, including honest empty states.
- Present business assumptions as proposals, never evidence of revenue.
