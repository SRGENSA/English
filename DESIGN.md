---
name: طلاقة / TALAQA
description: A calm daily English learning workspace for Arabic STEP learners.
colors:
  forest: "#174d40"
  forest-hover: "#23634f"
  ink: "#253c34"
  secondary-ink: "#65725e"
  paper: "#f7f8f4"
  surface: "#ffffff"
  line: "#e4e8df"
  mint: "#e7eecf"
  mint-ink: "#204733"
  sage: "#eaf0e2"
  peach: "#f9ebe1"
  lavender: "#eeeaf4"
  sand: "#f3efdc"
  focus: "#d38953"
typography:
  headline:
    fontFamily: '"Noto Sans Arabic Variable", sans-serif'
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "-0.7px"
  description:
    fontFamily: '"Noto Sans Arabic Variable", sans-serif'
    fontSize: "13px"
    lineHeight: 2
  navigation:
    fontFamily: '"Noto Sans Arabic Variable", sans-serif'
    fontSize: "14px"
    fontWeight: 550
  english-question:
    fontFamily: '"DM Sans Variable", sans-serif'
    fontSize: "21px"
  field:
    fontFamily: '"Noto Sans Arabic Variable", sans-serif'
    fontSize: "14px"
rounded:
  control: "7px"
  field: "8px"
  marker: "10px"
  card: "12px"
  feature: "16px"
spacing:
  compact: "8px"
  control-gap: "10px"
  field-inline: "12px"
  button-inline: "17px"
  list-inline: "18px"
  mobile-gutter: "20px"
  dialog: "28px"
  desktop-gutter: "43px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 17px"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
  button-light:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.mint-ink}"
    rounded: "{rounded.control}"
    padding: "9px 17px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 17px"
  field:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  daily-list:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "0 18px"
---

# Design System: طلاقة / TALAQA

## Overview

**Creative North Star: “A quiet learning desk”**

A welcoming, calm workspace makes daily practice feel manageable. Forest green anchors the interface; ivory, white and mint give Arabic text room to breathe. Peach and lavender markers help learners scan different learning activities without competing with their content.

The visual system serves a real learning sequence: choose practice, answer, understand the explanation, then see recorded progress. Friendly Saudi Arabic encourages effort while clear disclosures distinguish provider AI, fixed examples and browser speech. The implemented CSS and components are the extraction source. Visual review approved shipping as an MVP within the original material-fix scope: legibility, mobile statistics, AI availability, touch areas, and remaining surface/completion evidence are resolved, along with the mobile browser voice/privacy disclosure. Live AI provider readiness and production launch remain unvalidated.

**Key Characteristics:**
- Arabic first, with deliberate English reading regions.
- Tonal surfaces, fine borders and restrained depth.
- Clear daily actions and readable explanations.
- Honest learner data and capability states.

## Colors

Forest is the primary action and feature color; mint supports actions on dark backgrounds. Sage, peach, lavender and sand are learning markers. Paper is the application canvas, white defines working surfaces, ink carries primary text, and secondary ink carries essential supporting copy. Fine line borders separate adjacent tasks. Focus orange marks keyboard location.

Use the frontmatter values directly. The older CSS muted variable is not the authoritative essential-copy color: later overrides use secondary ink.

## Typography

Noto Sans Arabic Variable is the main family; DM Sans Variable supports English examples, questions, words and numerical emphasis. Each has a sans-serif fallback. English passages and answer options have explicit LTR direction within the RTL application.

The desktop page headline is 26px, weight 700, line-height 1.6; mobile headings reduce to 23px or 22px by breakpoint. Page descriptions use 13px and a generous line-height of 2. Essential descriptions and learning copy generally occupy 12–14px, with longer reading passages at 14–15px. Navigation is 14px. Large English vocabulary and score figures are purpose-specific displays, not a universal heading scale. Do not copy residual tiny metadata sizes into new instructional text.

## Layout

The desktop shell has a fixed 238px navigation rail on the right and matching main-content offset. Content is centered within a 1360px maximum with 43px desktop gutters; the top bar is 77px high. Repeated gaps follow compact 8–20px steps, with larger sectional breathing room.

The dashboard feature uses a two-column text/demo layout; practice and support regions use responsive grids. At 760px the sidebar becomes a right-hand drawer with scrim, the main offset disappears, the top bar becomes 66px, and gutters become 20px. At 540px the feature and major content stack. Statistics use a compact grid with wrapping labels and flexible inner widths. Adapt intermediate widths using the existing 1200px, 1100px and 1000px rules; 1500px expands desktop presentation.

The dashboard first viewport pairs a daily heading with the tutor entry and a functional browser pronunciation example. When AI is unavailable the feature explains that a teaching example remains available. This is the dashboard composition, not a template required for every screen.

## Elevation & Depth

Working surfaces are predominantly flat, differentiated by white, paper and quiet tonal fills with 1px borders. Overlays earn stronger depth: dialogs use `0 20px 80px #0f30253d`, toasts use `0 8px 30px #122f3326`, and a selected segmented control uses `0 2px 6px #2343290a`. Avoid transferring overlay shadows to every content card.

## Shapes

Controls use 7–8px corners, activity markers 10px, cards 12px, and prominent features/dialogs 16px. Avatars and small status dots are circular. The brand mark has an asymmetric 14px 14px 5px 14px silhouette and slight rotation; reserve that treatment for the brand.

## Components

### Buttons

Primary actions use forest with white text; hover deepens to forest-hover. Light buttons use mint and mint ink on dark feature surfaces. Outline buttons have a transparent background, a fine #dce2d6 border and #edf1e7 hover fill. Shared controls have a 42px minimum height, 9px 17px padding and 10px icon gap. Disabled buttons reduce opacity to 0.5. Active buttons shift down 1px. Keyboard focus is a 3px orange outline offset by 4px.

### Inputs / Fields

White fields use a #d7e0cd border, 8px radius, 10px 12px padding and 14px text. Visible labels precede fields. Account email/password fields explicitly use LTR direction. Inline errors are semantic alerts; busy forms disable relevant actions.

### Navigation

Right-aligned icon-and-text rows use muted default text, pale #f4f6f0 hover fill, and #eaf1e6 active fill with stronger green text. The active row increases weight to 700 and includes an indicator. Mobile uses the same navigation inside a drawer rather than compressing desktop labels.

### Cards / Containers

The daily list has a white surface, line border, 12px corners and 18px inline padding. Full-width lesson rows have 18px vertical padding and fine dividers; the whole row is actionable. Supporting statistics pair a colored marker with a number and descriptive label. Empty progress states explain how to create real activity.

### Chips

Selected segmented filters use white on a pale green track with a subtle shadow. Status chips pair quiet tonal backgrounds with readable labels; do not let a color alone convey learning status.

### Learning feedback and pronunciation

Answer options distinguish selection, correct and incorrect states and reveal Arabic explanations. The pronunciation demo pairs an English example with a labeled play action and an ornamental waveform; it is browser speech, not a live AI call. Wave bars animate for 2.8 seconds with the shared easing. Reduced-motion preference disables animations and transitions. Tutor examples and service availability must stay explicit.

## Do's and Don'ts

- **Do** preserve Arabic RTL structure and set English learning passages to LTR.
- **Do** use the final CSS overrides for readable essential copy and wrapping mobile statistics.
- **Do** show actual progress, meaningful empty states and accurate AI availability.
- **Do** retain visible keyboard focus and respect reduced motion.
- **Don't** turn ornamental demo indicators into claims of an active AI session.
- **Don't** extrapolate tiny residual metadata into a body-text standard.
- **Don't** add fabricated achievement, affiliation, revenue or subscription claims.
