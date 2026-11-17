# DARTS-GAME-DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **darts career game** (History #6): you make a character, or pick one of the hundreds of existing players (History #7), and play their career, but **you don't play the matches yourself: you watch them or sim them** (History #8). Working title: none yet; the repository is `darts-game`.

**Where the project stands (as of 2026-11-17T23:11:50+00:00):**
- Living design document created (History #1): the stealth game's design document, emptied out to its template and workflow.
- Top-level concept set by Lyra (History #6–#8).
- Round 1 of questions done: you are the player, the world is fictional but works like pro darts, matches are watched as a pure spectator, and the career is a deep sim (History #9–#12).
- Round 2 (matches) mostly done: simming gives just the result, every dart is simulated, and you can watch any match anywhere (History #13–#15). How a watched match is shown is shortlisted for a mock-up.

**Stack:** not decided yet.

**Art style:** not decided yet.

**Guiding principles** *(carried over from Lyra's previous projects' design documents; flag if any don't apply here)*:
- Small, polished and functional beats large and placeholder-filled.
- The creative director (Lyra) makes design decisions; recommendations are not decisions until approved.

### Development Philosophy: Depth Before Breadth

*Lyra's own words, carried over from the stealth game. (2026-11-17T22:55:31+00:00, documentation time — History #3)*

I want us to prioritise making existing mechanics genuinely polished, satisfying and fully functional before introducing new ones.

This doesn't mean limiting the game's ambition or avoiding complex systems. It means building that complexity gradually, on strong foundations.

Our workflow should be:

**Design → Implement → Test → Refine → Test Again → Refine Further → Move On.**

- **Depth before breadth:** Make each mechanic feel excellent before expanding the game with additional mechanics, enemies, levels or systems.
- **Iterative development:** Nothing should be considered finished simply because it works technically. It needs to feel good in actual gameplay.
- **Playtesting drives decisions:** If something feels awkward, frustrating, too easy or too difficult, we adjust it. We should be willing to substantially change or remove mechanics.
- **No one-shotting:** Don't attempt to build entire interconnected systems in one enormous implementation. Break development into manageable, independently testable stages.
- **Polish before expansion:** Animations, responsiveness, feedback, AI behaviour and interactions deserve attention before we move on.
- **Document everything:** Record decisions, refinements and reversals in `DARTS-GAME-DESIGN.md`, including why changes were made.
- **Creative control:** Suggest improvements and possibilities, but don't treat recommendations as approved decisions.

Our previous simple-shooter project demonstrated why this works. Through repeated testing, we fundamentally improved movement, enemy behaviour, health, combat balance and weapons. Those refinements gave the game its identity.

The goal isn't to make a small game. It's to build an ambitious game one exceptionally well-developed system at a time.

I'd rather have one brilliant, polished stealth encounter than ten levels of shallow, unfinished mechanics.

### Development Workflow: Use Claude Artifacts for Visual Design and Prototyping

*Lyra's own words, carried over from the stealth game. (2026-11-17T22:55:31+00:00, documentation time — History #4)*

I want us to make extensive use of Claude's Artifacts throughout development, particularly for smaller, self-contained design tasks.

Rather than immediately implementing every idea into the game, we should use Artifacts as a visual workshop where we can experiment, review, refine and approve designs before committing them to the codebase.

Examples include:

- **Character designs:** Draw characters, guards, enemies and NPCs in our established Stylised Geometry art style. Show different appearances, expressions, poses and animations.
- **Animation previews:** Demonstrate movement, idle animations, patrol behaviour, detection reactions and other visual effects.
- **Environment concepts:** Mock up individual rooms, obstacles, hiding places, platforms and environmental features.
- **Gameplay mechanics:** Create small interactive prototypes to demonstrate ideas before implementing them in the actual game.
- **UI and HUD:** Design and preview menus, detection indicators, health displays, interaction prompts and other interface elements.
- **Side-by-side comparisons:** Present multiple visual options so I can compare them, choose elements I like and request changes.

The important principles:

1. **Show, don't just describe.** Whenever a design decision would benefit from seeing something, offer to create an Artifact rather than relying entirely on written descriptions.
2. **Iterate visually.** We should be able to experiment with different designs and refine them repeatedly before approval.
3. **Keep Artifacts focused.** They're for individual designs, small prototypes and experiments, not for building the entire game separately.
4. **Respect the art style.** Character and environment concepts should follow our Stylised Geometry reference unless we're deliberately exploring alternatives.
5. **Don't implement prematurely.** An Artifact is an opportunity to explore an idea, not automatic permission to add it to the game.
6. **Transfer approved designs into the game.** Once we're happy with something, use the approved design as the reference for implementation.
7. **Document decisions.** Record approved designs and relevant decisions in `DARTS-GAME-DESIGN.md`.

This worked particularly well in our previous simple-shooter project, where visual concepts and mockups helped us develop characters, enemies, environments and bosses.

The philosophy is simple: **design it, see it, refine it, approve it, then build it.**

Use Artifacts proactively whenever they would make a design discussion more productive, but always leave the final creative decisions to me.

### Design Workflow: Structured Questions and Collaborative Decision-Making

*Lyra's own words, carried over from the stealth game. (2026-11-17T22:55:31+00:00, documentation time — History #5)*

I want you to actively guide me through designing the game's mechanics, characters, enemies, environments and systems using structured rounds of questions, just as we've done successfully in my previous projects.

How this should work:

1. **Ask focused questions.** When we're designing something, break it down into its individual components rather than asking one enormous, open-ended question.
2. **Provide multiple-choice options.** For each question, offer several distinct, well-considered possibilities, with brief explanations where useful. Always include the freedom for me to suggest something different or combine options.
3. **Group related questions.** Ask several questions together when they concern the same aspect of a feature. For example, when designing a guard, we might first decide its appearance and movement, then its detection behaviour, then its reactions and animations.
4. **Work through multiple rounds.** Don't try to settle every detail in one batch. Use my answers to inform the next set of questions, progressively developing the design.
5. **Make recommendations without making decisions.** You're welcome to explain which options you think would work best and why, but the final creative decisions belong to me.
6. **Consider the details.** Don't stop at the headline mechanic. Explore how something feels, behaves, looks, sounds, interacts with other systems and communicates information to the player.
7. **Record approved decisions.** Update `DARTS-GAME-DESIGN.md` with what we've agreed, including important reasoning and subsequent changes.
8. **Implement only when the design is sufficiently settled.** Once we've agreed on the relevant details, explain the proposed implementation and wait for my approval before building.

**Example:** When designing a guard, don't simply ask whether it should patrol. Explore how it patrols, what it can see, what it can hear, how it communicates suspicion, how it investigates disturbances, what happens when it detects the player, and how it eventually returns to normal behaviour.

We don't necessarily need to decide all of these immediately. The point is to explore each feature properly, in manageable rounds.

Combine this with our other principles:

- Depth before breadth.
- Build, test and refine repeatedly.
- Use Claude Artifacts for visual concepts and small prototypes.
- Document decisions and reversals.
- Never mistake a suggestion for an approved design.

I want the process to feel like a genuine collaborative game design session, with you presenting thoughtful possibilities and me directing the creative vision.

Don't rush through the questions simply to get to implementation. The design process is part of what I enjoy.

---

## B. Confirmed Design Decisions

*Each entry: the decision in bold, any detail, then when it was confirmed and its History number. A changed decision is struck through (~~like this~~) with the number of the entry that changed it.*

### Concept
- **A darts career game.** You play through a darts player's career. *(2026-11-17T23:08:14+00:00 — History #6)*
- **Make a character, or pick one of the hundreds of existing players**, and play their career. *(2026-11-17T23:08:14+00:00 — History #7)*
- **You don't play the matches yourself: you watch them or sim them.** *(2026-11-17T23:08:14+00:00 — History #8)*
- **You are the player themselves.** Every choice away from the oche is theirs (which events, training, money, kit); on the oche, their skill and nerve do the throwing, and you watch your decisions play out. Claude's recommendation, approved. Chosen over their manager, their coach, and no in-world role. *(2026-11-17T23:10:30+00:00 — History #9)*

### The world
- **Fictional, but works like real pro darts.** Invented players, tours and events, organised like the pro game. The option described tour cards, a qualifying school, rankings by prize money, majors and a World Championship as examples; the specifics are still to be designed. Claude's recommendation, approved. Chosen over real players and events, and a fully invented darts world. *(2026-11-17T23:10:30+00:00 — History #10)*

### The career
- **Deep sim.** Football Manager-style: detailed attributes, training regimes, finances, form, lots of numbers to pore over. Chosen over light and story-led, and story on top with numbers underneath. *(2026-11-17T23:10:30+00:00 — History #12)*

### Matches
- **Watching is pure spectating.** No influence during a match: everything you can change is decided before the walk-on. Chosen over a word between legs (Claude's recommendation), calling the shots, and influence only when watching. *(2026-11-17T23:10:30+00:00 — History #11)*
- **Simming gives just the result:** the score and the stats screen, nothing else. Chosen over the result with key moments (Claude's recommendation) and a fast-forward of the watched match. *(2026-11-17T23:11:50+00:00 — History #13)*
- **Every dart is simulated.** Each dart is aimed at a spot and lands with a spread set by skill, nerve, pressure and fatigue; the board scores wherever it lands. Averages, 180s and checkout rates come out of it rather than going in, and what you watch is exactly what was simulated. Claude's recommendation, approved. Chosen over rolling each visit's score from the player's stats. *(2026-11-17T23:11:50+00:00 — History #14)*
- **You can watch any match anywhere**, whether you're playing in that event or not. Chosen over only your own, and any match at your events. *(2026-11-17T23:11:50+00:00 — History #15)*

### Platforms and input
- None yet.

### Art and presentation
- None yet.

### Development approach
- **Not one-shotting the game.** It's built a piece at a time: each piece is made, tested, refined, tested and refined further before moving on to the next. Carried over from the stealth game. *(2026-11-17T22:55:31+00:00, documentation time — History #2)*
- **Depth before breadth.** Each mechanic is made polished, satisfying and fully functional before new ones are added. Workflow: Design → Implement → Test → Refine → Test Again → Refine Further → Move On. In full in §A. *(2026-11-17T22:55:31+00:00, documentation time — History #3)*
- **Claude Artifacts as a visual workshop.** Characters, animations, environments, small mechanic prototypes and UI are designed, compared and refined in Artifacts, approved by Lyra, then used as the reference for implementation. In full in §A. *(2026-11-17T22:55:31+00:00, documentation time — History #4)*
- **Structured rounds of design questions.** Claude guides design through grouped, focused multiple-choice questions over several rounds, with recommendations but no decisions; implementation only once the design is settled and the plan approved. In full in §A. *(2026-11-17T22:55:31+00:00, documentation time — History #5)*

### Technical architecture / platform
- None yet.

### Testing
- None yet.

### Documentation
- **Living `DARTS-GAME-DESIGN.md`**, made from the stealth game's `STEALTH_GAME_DESIGN.md` emptied out to its template and workflow, and filled in with everything decided and done as the project goes. *(2026-11-17T22:55:31+00:00, documentation time — History #1)*

---

## C. Current Development Scope

**In design: the foundations.** The top-level concept is set (#6–#8); round 1 settled your role, the world, watching and depth (#9–#12). Round 2 settled simming, the dart model and spectating (#13–#15).

**How a watched match is shown:** Lyra shortlisted **the board, close up** (darts landing on a big board, scoreboard alongside) and **scoreboard and commentary** (a live scoreboard and a running commentary feed) for an Artifact mock-up, with a note that began "It's text based, so" and was cut off. Broadcast-style and side-on at the oche weren't picked.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

- None yet.

---

## F. Implementation Status

*Updated 2026-11-17T22:55:31+00:00.*

| Feature | Status | Notes |
|---|---|---|
| Design doc | Done | `DARTS-GAME-DESIGN.md`, emptied out from `STEALTH_GAME_DESIGN.md`. *(2026-11-17T22:55:31+00:00)* |

### Known issues and limitations
- None yet.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- **The filename is as Lyra gave it:** `DARTS-GAME-DESIGN.md`, with hyphens (the stealth game's used underscores).
- **Lyra's own words in §A are kept word for word**, except that `STEALTH_GAME_DESIGN.md` now reads `DARTS-GAME-DESIGN.md`. Her examples from the stealth game are left as she wrote them, including "our Stylised Geometry reference" in point 4 of the Artifacts section, though no art style has been chosen for this game.
- **Left out as stealth-specific**, though filed under Workflow there: the first playable piece and the build plans (#37, #46 and #85 in the stealth doc), and "the style guide is a reference, not gospel" (#62 there), which was about the Stylised Geometry guide. The struck-through "Discuss → Decide → Document → Implement → Test → Expand" principle, already superseded there, is left out too.
- The guiding principles in §A and the "explain before adding" and merge-to-`main` standing orders in §H come from Lyra's earlier design documents. The three principle sections in §A are Lyra's own, written for the stealth game (#11–#13 there, #3–#5 here).

---

## G. Decision History

*Append-only. Changed decisions are recorded as new entries; earlier entries are preserved.*

| # | Timestamp (Europe/London) | Category | Decision |
|---|---|---|---|
| 1 | 2026-11-17T22:55:31+00:00 *(documentation time)* | Documentation | Living `DARTS-GAME-DESIGN.md`, made from the stealth game's design document emptied out to its template and workflow (Lyra). |
| 2 | 2026-11-17T22:55:31+00:00 *(documentation time)* | Workflow | Not one-shotting the game: each piece is made, tested, refined, tested and refined further before moving on. Carried over from the stealth game. |
| 3 | 2026-11-17T22:55:31+00:00 *(documentation time)* | Workflow | Development Philosophy: Depth Before Breadth (in full in §A). Carried over from the stealth game. |
| 4 | 2026-11-17T22:55:31+00:00 *(documentation time)* | Workflow | Development Workflow: Claude Artifacts for visual design and prototyping (in full in §A). Carried over from the stealth game. |
| 5 | 2026-11-17T22:55:31+00:00 *(documentation time)* | Workflow | Design Workflow: structured rounds of questions and collaborative decision-making (in full in §A). Carried over from the stealth game. |
| 6 | 2026-11-17T23:08:14+00:00 | Concept | A darts career game. |
| 7 | 2026-11-17T23:08:14+00:00 | Concept | Make a character, or pick one of the hundreds of existing players, and play their career. |
| 8 | 2026-11-17T23:08:14+00:00 | Concept | You don't play the matches yourself: you watch them or sim them. |
| 9 | 2026-11-17T23:10:30+00:00 | Concept | You are the player themselves: choices away from the oche are yours; their skill and nerve throw (Claude's recommendation, approved). |
| 10 | 2026-11-17T23:10:30+00:00 | World | Fictional world that works like real pro darts; specifics to be designed (Claude's recommendation, approved). |
| 11 | 2026-11-17T23:10:30+00:00 | Matches | Watching is pure spectating: no influence during a match (chosen over Claude's recommendation of a word between legs). |
| 12 | 2026-11-17T23:10:30+00:00 | Career | Deep sim, Football Manager-style. |
| 13 | 2026-11-17T23:11:50+00:00 | Matches | Simming gives just the result (chosen over Claude's recommendation of result and key moments). |
| 14 | 2026-11-17T23:11:50+00:00 | Matches | Every dart is simulated: aimed, with a spread from skill, nerve, pressure and fatigue; stats come out of it (Claude's recommendation, approved). |
| 15 | 2026-11-17T23:11:50+00:00 | Matches | You can watch any match anywhere. |

---

## H. Technical Notes

- **Repository:** `evanstom273/darts-game`. Working branch `ccr-e85ad7ee-472voh`.
- **Project layout:** nothing built yet.
- **Explain before adding** *(carried over from Lyra's previous design documents)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
