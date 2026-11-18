# DARTS-GAME-DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **darts career game** (History #6): you make a character, or pick one of the hundreds of existing players (History #7), and play their career, but **you don't play the matches yourself: you watch them or sim them** (History #8). **It's text-based**, with the dartboard, the throws and the darts as graphics (History #16). Working title: none yet; the repository is `darts-game`.

**Where the project stands (as of 2026-11-18T00:47:08+00:00):**
- Living design document created (History #1): the stealth game's design document, emptied out to its template and workflow.
- Top-level concept set by Lyra (History #6–#8).
- Round 1 of questions done: you are the player, the world is fictional but works like pro darts, matches are watched as a pure spectator, and the career is a deep sim (History #9–#12).
- Round 2 (matches) mostly done: simming gives just the result, every dart is simulated, and you can watch any match anywhere (History #13–#15). How a watched match is shown is shortlisted for a mock-up.
- The game is text-based, with the board and darts as graphics (History #16). Stack and deployment set (History #17, #18).
- Designing the match view (History #19–#22): it fits the Fold's outer screen in portrait and its inner screen, shows the board, the score and a full PDC-style graphic, with an optional full-stats view. To be built as an Artifact once Lyra has designed it. Layout, the stats view and commentary settled (History #23–#26); the graphic's contents, darts on the board, pace and more stats settled (History #27–#30); inner-screen stats, the "9" indicator and the stats layout settled (History #31–#33); graphics in SVG, and the "9" refined (History #34, #35).
- **Match view mock-up built** as an Artifact (Lyra: "Build the match view artifact"), with a real dart-by-dart simulated match. Lyra's first look: she really likes the UI; it needs more depth and a more 3D look, and the darts especially need reworking. See §C.
- **How players play:** no ceilings; everybody can throw any average, with form (in-match and across matches and tournaments) and attributes deciding how often, and good form is never a guarantee (History #36–#39). Attributes started: composure, scoring and checkouts, no overall skill, and attributes are guides, not guarantees (History #40–#42). Consistency and stamina added, making five, on a 1–20 scale (History #43–#45). What composure, stamina and consistency cover, and how attributes change over a career, settled (History #46–#50). What moves attributes, and free choice of a created character's attributes, settled (History #51–#53).
- **Next build requested** (History #54): the attributes and the match view into the game, plus a batch simulator that exports CSV for tuning. Claude explained the plan; Lyra approved it with changes (History #55).
- **The tuning build is built** (§F): the game scaffolded, the match view ported from the Artifact, the five attributes and form in the dart model, every format variant, and a Simulate panel that runs batches in the background and downloads them as CSV. Merged to `main` and live on GitHub Pages. Lyra's first run on the Fold: 10,000 matches in under about 2 seconds.
- **Retuned after batch 2** (History #56–#60): the 1–20 scale now covers pub players to the world's best; in-match form judges visits against the player's own level; the day roll is toned down, with rare blinders and stinkers carrying the big swings; consistency, composure and stamina count for more.

**Stack:** web: React, Vite, TypeScript, Tailwind CSS and IndexedDB via Dexie, with Phaser only if the darts need it (History #17). So far Phaser isn't needed (everything is SVG) and Dexie isn't in yet (nothing is saved; see §F). Deployed to GitHub Pages for now, maybe Cloudflare Workers later if needed (History #18).

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
- **Text-based.** The game is text-based; the full dartboard, the throws and the darts are graphics. Lyra: "A full dart board and throws, the darts and everything will be graphics, but it's text based." *(2026-11-17T23:15:14+00:00 — History #16)*
- **You are the player themselves.** Every choice away from the oche is theirs (which events, training, money, kit); on the oche, their skill and nerve do the throwing, and you watch your decisions play out. Claude's recommendation, approved. Chosen over their manager, their coach, and no in-world role. *(2026-11-17T23:10:30+00:00 — History #9)*

### The world
- **Fictional, but works like real pro darts.** Invented players, tours and events, organised like the pro game. The option described tour cards, a qualifying school, rankings by prize money, majors and a World Championship as examples; the specifics are still to be designed. Claude's recommendation, approved. Chosen over real players and events, and a fully invented darts world. *(2026-11-17T23:10:30+00:00 — History #10)*

### The career
- **Deep sim.** Football Manager-style: detailed attributes, training regimes, finances, form, lots of numbers to pore over. Chosen over light and story-led, and story on top with numbers underneath. *(2026-11-17T23:10:30+00:00 — History #12)*

### Players and form
- **No ceilings: everybody is capable of throwing any average.** Unlike darts games that give a player a number that sets how well they can play, a player's ability isn't capped. That doesn't mean everyone throws 120 every game; even players lower down the tour, in pub darts or in regional qualifiers can throw a 110 average now and again, but not everybody does, because players differ on things like form, composure, scoring ability and finishing ability (Lyra's examples; the full list isn't decided), which ebb and flow across matches. *(2026-11-17T23:44:51+00:00 — History #36)*
- **Form within a match.** A really good visit improves a player's form for that match, so they start playing really well in it and the simulation becomes capable of throwing better darts for them. Crucially, they're not invincible or unbeatable. *(2026-11-17T23:44:51+00:00 — History #37)*
- **Form across matches and tournaments.** A really good few months in a career (Lyra's example: winning a major, reaching another final and a semi-final) puts a player's form at the top, so they go into every tournament as the favourite. *(2026-11-17T23:44:51+00:00 — History #38)*
- **Form isn't a guarantee: anyone can throw a stinker.** A player on the best form, winning loads of tournaments and averaging 110 in their last one, can still throw 76 in the next match, "because it's darts. That's how it works, even if you're on really good form." Lyra's real-world examples: Littler, Humphries, Price, Wright and Phil Taylor. (Lyra illustrated form as a letter grade, such as A, calling it "a really shit way of doing it": an illustration, not a decision.) *(2026-11-17T23:47:28+00:00 — History #39)*
- **Attributes: composure, scoring and checkouts.** Not going crazy with them. Doubling and checkouts were considered as two and treated as the same thing. ~~Whether anything else joins them is open.~~ Consistency and stamina join them (#43, #44). *(2026-11-17T23:50:09+00:00 — History #40)*
- **No overall skill rating.** A single overall number is the ceiling approach that #36 rules out. *(2026-11-17T23:50:09+00:00 — History #41)*
- **Attributes are a guide, not a guarantee.** Even a top finishing attribute (Lyra's example: 100) doesn't mean hitting 100% of doubles. *(2026-11-17T23:50:09+00:00 — History #42)*
- **Consistency** is an attribute: how wildly a player swings from match to match. A very consistent player rarely has a stinker but rarely hits 110; a streaky one swings both ways. It shapes their ups and downs without capping them. Claude's recommendation, approved. *(2026-11-17T23:51:33+00:00 — History #43)*
- **Stamina** is an attribute: holding up over long formats and long days, so players with less of it tail off late in a long match or on a packed day. *(2026-11-17T23:51:33+00:00 — History #44)*
- **Attributes are on a 1–20 scale**, Football Manager-style. Chosen over 1–100, and hidden attributes described in words. *(2026-11-17T23:51:33+00:00 — History #45)*
- **The five attributes:** composure, scoring, checkouts, consistency and stamina (#40, #43, #44). Experience was offered and not chosen.
- **The 1–20 scale covers the whole darts world:** 1 is a pub player (averaging around 40–50), 20 is the world's best (around 100+), with regional, county and tour players in between. Chosen over serious players upward, and pro tour only. *(2026-11-18T00:43:19+00:00 — History #56)*
- **A mid-level player (scoring 10) throws a 110+ average in about 1 match in 50 on average**, at random rather than to a schedule. Lyra: "1 in 50 on average. Not literally 1 in every 50 though." *(2026-11-18T00:43:19+00:00 — History #57)*
- **Consistency, composure and stamina should all have a bigger effect** than in the first takes. *(2026-11-18T00:43:19+00:00 — History #58)*
- **Between two identical players, the one having the better day wins about 65%.** The day gives an edge, but what happens in the match matters more. Chosen over about 70% and about 75% (it was 82%). *(2026-11-18T00:43:19+00:00 — History #59)*
- **Composure comes into play** on doubles that win something (leg, set and match darts), when scoring under pressure (the opponent waiting on a finish, deciding legs and sets), and on the big stage (TV events, finals and the biggest tournaments turn the pressure up everywhere). All three options chosen. *(2026-11-17T23:55:29+00:00 — History #46)*
- **Stamina is worn down by** long matches (late in long formats), long days (several matches in a day, as on floor events), and a packed schedule (weeks of events without a break). All three options chosen. *(2026-11-17T23:55:29+00:00 — History #47)*
- **Consistency covers swings between matches only.** In-match form (#37) handles the swings within a match, so the two jobs stay separate. Claude's recommendation, approved. Chosen over covering both. *(2026-11-17T23:55:29+00:00 — History #48)*
- **Attributes change slowly over a career, up and down.** On average only 2 or 3 points over about ten years of career mode. Going from 1 to 20 in ten years is unrealistic and too much; so is dropping from 20 to 1 within a few years. ~~What makes them go up or down isn't decided.~~ See #51. *(2026-11-17T23:55:29+00:00 — History #49)*
- **Age doesn't matter.** Lyra's examples: Peter Wright winning his first world title at around 50 in 2020, and Paul Lim reaching a WDF World Championship final at around 70. *(2026-11-17T23:55:29+00:00 — History #50)*
- **What moves attributes:** training moves them up, and so does playing well; playing badly can knock them down, but only when it's consistent over a long period. Lyra's example: getting really good at doubles and training them raises checkouts; missing doubles in matches, consistently over a long time, lowers it. Either way, only a little (#49). *(2026-11-17T23:58:11+00:00 — History #51)*
- **A created character's attributes are the player's free choice:** anything from 1 to 20 in each, all 20s or all 1s. It's choosing your own difficulty, which Lyra thinks would be fun for players and is the kind of thing she'd like in a game like this. *(2026-11-17T23:58:11+00:00 — History #52)*
- **Touchstone: MDickie's games, such as Wrestling Empire,** where even a character with maximum attributes can't win every match. That's the feel here too: attributes at 20 don't mean winning everything (#36, #42). *(2026-11-17T23:58:11+00:00 — History #53)*

### Matches
- **Watching is pure spectating.** No influence during a match: everything you can change is decided before the walk-on. Chosen over a word between legs (Claude's recommendation), calling the shots, and influence only when watching. *(2026-11-17T23:10:30+00:00 — History #11)*
- **Simming gives just the result:** the score and the stats screen, nothing else. Chosen over the result with key moments (Claude's recommendation) and a fast-forward of the watched match. *(2026-11-17T23:11:50+00:00 — History #13)*
- **Every dart is simulated.** Each dart is aimed at a spot and lands with a spread set by skill, nerve, pressure and fatigue; the board scores wherever it lands. Averages, 180s and checkout rates come out of it rather than going in, and what you watch is exactly what was simulated. Claude's recommendation, approved. Chosen over rolling each visit's score from the player's stats. *(2026-11-17T23:11:50+00:00 — History #14)*
- **You can watch any match anywhere**, whether you're playing in that event or not. Chosen over only your own, and any match at your events. *(2026-11-17T23:11:50+00:00 — History #15)*
- **The match view gets built as an Artifact, once Lyra has designed it.** *(2026-11-17T23:20:59+00:00 — History #19)*
- **The match view shows the board, the score and a full PDC-style graphic.** *(2026-11-17T23:20:59+00:00 — History #21)*
- **An optional full-stats view**, with things like the average, first-9 average, highest checkout, checkout percentage (shown as "1/10 - 10%"), 180s, 140+ and 100+: "all of that sort of thing". *(2026-11-17T23:20:59+00:00 — History #22)*
- **Outer screen, portrait: board on top, graphic below.** The board fills the width at the top and the graphic sits under it, like the bottom of a TV picture; nothing covers the board. Claude's recommendation, approved. Chosen over graphic on top, and graphic over the board. *(2026-11-17T23:23:39+00:00 — History #23)*
- **Inner screen: stats always on show.** Board and graphic as on the outer screen, with the full stats permanently beside or below them rather than optional. Chosen over the same layout bigger, and board and graphic side by side. *(2026-11-17T23:23:39+00:00 — History #24)*
- **The stats view swaps with the board** (where it's optional, on the outer screen): a button flips the board area to the stats and back, and the graphic stays put so the live score never goes. Claude's recommendation, approved. Chosen over a panel sliding up over the board, and a separate screen. *(2026-11-17T23:23:39+00:00 — History #25)*
- **No commentary text.** The board and the graphic tell the story. Chosen over a running commentary feed, and just the caller's calls. *(2026-11-17T23:23:39+00:00 — History #26)*
- **The graphic holds, besides names, sets, legs and the remaining score: the checkout route** when a player's on a finish (e.g. "T20 T11 D14" on 121), **darts thrown this leg**, and **the "9" indicator** (Lyra's addition: a nine-dart finish being on). Not chosen: the three-dart average, and the visit's running total as it builds. *(2026-11-17T23:25:12+00:00 — History #27)*
- **Darts stay on the board until the next visit:** the three darts stay in through the pause and go as the next player steps up, as they'd be pulled out in real life. Claude's recommendation, approved. Chosen over clearing them after the visit, and building up over the leg. *(2026-11-17T23:25:12+00:00 — History #28)*
- **Pace is adjustable:** roughly TV pace by default, with a speed control (the option gave 1×, 2× and 4× as examples). Speeding up isn't influencing the match, so it stays pure spectating (#11). Claude's recommendation, approved. Chosen over TV pace fixed, and quick fixed. *(2026-11-17T23:25:12+00:00 — History #29)*
- **More stats:** best leg (fewest darts to win a leg), legs won against the throw, and ton-plus checkouts (100 or more), added to #22's list. A doubles breakdown wasn't chosen. *(2026-11-17T23:25:12+00:00 — History #30)*
- **Inner screen: stats beside the board and graphic.** Board and graphic stacked on one side, stats in a column on the other, so the board stays around 450 px across without scrolling. Claude's recommendation, approved. Chosen over stats below. *(2026-11-17T23:26:07+00:00 — History #31)*
- **The "9" indicator shows while a nine-darter is still possible:** ~~from the first visit~~ from the first dart (#35), for as long as the score left can still be finished in nine darts in total, gone the moment it can't. Chosen over after an opening 180, and after two 180s. *(2026-11-17T23:26:07+00:00 — History #32)*
- **The full-stats view is head to head:** one table with a player on each side and the stat names down the middle, like the TV stats graphic. Claude's recommendation, approved. Chosen over one player at a time. *(2026-11-17T23:26:07+00:00 — History #33)*
- **The "9" isn't lit before the leg starts:** it appears once the first dart is the start of a possible nine-darter, then stays while one is still possible (#32). Lyra: "If the first dart is the start of a possible 9, display it." In practice a nine-darter stays possible only after a first dart of T20, T19, T18, T17, T16, T15, the bull, D20 or D17, and a first visit of 151, 154, 157, 160, 161, or 163 and up. *(Corrected 2026-11-17T23:39:43+00:00: Claude first wrote "31 or more" and "151 or more", which was wrong; the exact list comes from the mock-up's simulation.)* *(2026-11-17T23:28:36+00:00 — History #35)*

### Platforms and input
- **It has to fit Lyra's Pixel 10 Pro Fold:** the outer screen in portrait, and the inner screen. *(2026-11-17T23:20:59+00:00 — History #20)*

### Art and presentation
- **Graphics are SVG:** the board and the darts are drawn as SVG. Lyra said "Use SVGs" in answer to how the board and darts are drawn. *(Wording corrected 2026-11-17T23:39:43+00:00: Claude first wrote it as covering all the game's graphics, which went further than Lyra said.)* *(2026-11-17T23:28:36+00:00 — History #34)*

### Development approach
- **Next: attributes and the match view in the game, with a batch simulator for tuning.** The attributes go into the game; the match view Artifact goes in as the template; and a button simulates as many matches as Lyra wants and saves them as a CSV file she can download and bring back, so numbers can be tweaked in the code, 10,000 matches simulated, and the results used to see what worked and what didn't. A tuning and testing tool for this stage of the game. *(2026-11-18T00:03:31+00:00 — History #54)*
- **Blinders stay all-or-nothing, for the whole match.** Seeing batch 3 (a hot pub player's upsets nearly all coming from a whole-match blinder at around 112, mostly winning 7–0), Lyra: "I'm really happy with that... genuinely perfect. Because it doesn't need to be realistic." *(2026-11-18T00:47:08+00:00 — History #61)*
- **Form should produce big nights:** a weaker player on great form throwing more 100+ and 110+ averages than a better player on awful form (as in batch 3: 376 against 29 matches of 110+) is exactly how Lyra wants form to work. In the engine today, form decides how high a blinder lands (the hot pub player's blinders had a median of 111.9 and 62% reached 110; the cold decent player's had a median of 101.9 and 7% reached 110), while how often blinders happen comes from consistency (6.1% of matches at consistency 1 against 4.0% at 10), not form. *(2026-11-18T00:48:58+00:00 — History #62)*
- **Fix in-match form and tone down the day roll** (Lyra, after batch 2). In-match form had been a near-constant boost; the day roll was deciding most matches. *(2026-11-18T00:43:19+00:00 — History #60)*
- **The build plan is approved, with Lyra's changes.** Form is in. Both players' attributes can be random or set by hand. The format isn't presets: Lyra chooses legs or sets play, the length, double or straight in, the out rule "and that sort of thing", and a batch can randomise all of it per match, so a few thousand matches cover everything from short legs matches to long sets matches. The rest of Claude's plan stands: the scaffold, the match view ported as it is, the attributes' effects as first takes in one tuning file, a background batch with progress and cancel, a matches CSV with an optional legs CSV, seeds for replaying any match, a stage setting, and GitHub Pages deployment. *(2026-11-18T00:21:49+00:00 — History #55)*
- **Not one-shotting the game.** It's built a piece at a time: each piece is made, tested, refined, tested and refined further before moving on to the next. Carried over from the stealth game. *(2026-11-17T22:55:31+00:00, documentation time — History #2)*
- **Depth before breadth.** Each mechanic is made polished, satisfying and fully functional before new ones are added. Workflow: Design → Implement → Test → Refine → Test Again → Refine Further → Move On. In full in §A. *(2026-11-17T22:55:31+00:00, documentation time — History #3)*
- **Claude Artifacts as a visual workshop.** Characters, animations, environments, small mechanic prototypes and UI are designed, compared and refined in Artifacts, approved by Lyra, then used as the reference for implementation. In full in §A. *(2026-11-17T22:55:31+00:00, documentation time — History #4)*
- **Structured rounds of design questions.** Claude guides design through grouped, focused multiple-choice questions over several rounds, with recommendations but no decisions; implementation only once the design is settled and the plan approved. In full in §A. *(2026-11-17T22:55:31+00:00, documentation time — History #5)*

### Technical architecture / platform
- **Stack: web.** React, Vite, TypeScript, Tailwind CSS, IndexedDB via Dexie, and maybe Phaser if it's needed for the darts sim. *(2026-11-17T23:15:14+00:00 — History #17)*
- **Deployed to GitHub Pages for now**, and maybe Cloudflare Workers in future if needed. *(2026-11-17T23:15:14+00:00 — History #18)*

### Testing
- None yet.

### Documentation
- **Living `DARTS-GAME-DESIGN.md`**, made from the stealth game's `STEALTH_GAME_DESIGN.md` emptied out to its template and workflow, and filled in with everything decided and done as the project goes. *(2026-11-17T22:55:31+00:00, documentation time — History #1)*

---

## C. Current Development Scope

**In design: the foundations.** The top-level concept is set (#6–#8); round 1 settled your role, the world, watching and depth (#9–#12). Round 2 settled simming, the dart model and spectating (#13–#15).

**The match view** is being designed by Lyra (#19–#22): board, score, a full PDC-style graphic and an optional stats view, fitting the Fold in portrait and on its inner screen. Built as an Artifact once designed.

**Darts Match View** (Artifact, match view mock-up, 2026-11-17T23:39:43+00:00): https://claude.ai/artifact/Bv6GofTHXNWSxZH29gNzG9. A real simulated match, played dart by dart (#14): each dart is aimed and lands with a spread, and the board and stats show what was actually thrown. On the outer screen in portrait the board is on top, the graphic below and a Stats button swaps the board for the stats (#23, #25); from 700 px wide the stats sit beside the board and graphic (#24, #31). The graphic shows names, sets, legs, remaining, who's throwing, the checkout route, darts this leg and the "9" (#21, #27, #32, #35); darts stay until the next visit (#28); speeds 1×, 2× and 4× (#29); head-to-head stats with everything in #22 and #30 (#33). It opens partway in (set 2, leg 2) so the stats have something in them. Claude's choices, up for change: the look (dark stage, navy graphic, gold score boxes, Barlow Condensed); how the darts are drawn, with orange and cyan flights per player matched by a stripe on their row of the graphic; the graphic's layout (route right-aligned in the name box, the 9 as a gold badge after the name, then darts, sets, legs and remaining); routes shown for both players whenever they're on a finish, picked by a simple preference rule, with singles as plain numbers; BUST shown in the score box, and the legs or sets box flashing on a win; the format (first to 3 sets, sets first to 3 legs, throw alternating); two made-up players, Callum Reid (about a 97 average) and Sander de Wit (about 93); speeds (at 1×, a dart every 1.6 s and 3.2 s after each visit); 140+ as 140–179 and 100+ as 100–139; checkout % counting darts at a finishing double, rounded to a whole percent; the wide layout starting at 700 px.

**Lyra's first look at Darts Match View** (2026-11-17T23:44:51+00:00): she really likes the UI, and the idea of it was really good. It could use a bit of work to look better, with a bit of depth and a more 3D look; the darts especially need reworking to look better. Not yet acted on.

Earlier, for how a watched match is shown, Lyra shortlisted **the board, close up** (darts landing on a big board, scoreboard alongside) and **scoreboard and commentary** (a live scoreboard and a running commentary feed) for an Artifact mock-up, with the note "It's text based, so" (complete as written: the game is text-based, #16). Broadcast-style and side-on at the oche weren't picked.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

1. **Title.**
2. **The match view** (#19–#35): the mock-up is built (§C); Lyra likes it and wants more depth, a more 3D look and better darts. Still open: the look, and the exact speeds (#29).
5. **Players and form** (#36–#55): what scoring and checkouts cover in detail; how training works; tuning the first-take numbers from CSVs, especially how often upsets happen; how in-match and long-term form move, and what brings them back down; how form and attributes feed the dart model (#14).
3. **Whether Phaser is needed** for the darts (#17). The graphics are SVG (#34), and nothing has needed it so far.
4. **Art style.**

---

## F. Implementation Status

*Updated 2026-11-18T00:21:56+00:00.*

| Feature | Status | Notes |
|---|---|---|
| Design doc | Done | `DARTS-GAME-DESIGN.md`, emptied out from `STEALTH_GAME_DESIGN.md`. *(2026-11-17T22:55:31+00:00)* |
| Project scaffold | Done | Vite 8, React 19, TypeScript (strict), Tailwind 4. No Phaser (SVG throughout); no Dexie yet (nothing saved). Type-check and build pass; about 81 kB gzipped. *(2026-11-18T00:21:49+00:00)* |
| Dart model | Built (first takes) | Every dart simulated (#14): aimed at the middle of a bed, landing with a spread set by the attributes, the day, form, fatigue and pressure. Seeded, so any match replays exactly. All numbers in `src/engine/tuning.ts`. *(2026-11-18T00:21:49+00:00)* |
| Attributes and form | Built (first takes) | Scoring, checkouts, composure, consistency, stamina on 1–20 (#40–#48); in-match form (#37); long-term form as a per-player setting from -5 to +5 until there's a career (#38). *(2026-11-18T00:21:49+00:00)* |
| Formats | Built | Legs or sets play at any length (odd best-ofs), starting score 301, 501 or 701, straight or double in, double, master or straight out; stage floor, TV or major final (#55). *(2026-11-18T00:21:49+00:00)* |
| Match view | Ported | From the Darts Match View Artifact, unchanged in look: board, graphic, stats swap on the outer screen, stats beside from 700 px. The graphic now handles legs play (no sets column) and shows the starting score and rules when they aren't 501 SIDO. *(2026-11-18T00:21:49+00:00)* |
| Simulate panel | Built | Both players' attributes and form, each set by hand or Random; every format setting and the stage, each fixed or Random; watch a new match with the settings; replay any CSV row; run a batch of up to 100,000 in the background with progress and cancel; download a matches CSV and optionally a legs CSV. Settings are remembered on the device. Saving a CSV opens the system file picker (Android included) to choose where it goes, falling back to the share sheet, then a plain download; added after Chrome on Android blocked Lyra's second download (2026-11-18T00:29:45+00:00). *(2026-11-18T00:21:49+00:00)* |
| Tests | Passing | 17 unit tests (board scoring, routes and busts for every out rule, nine-darter first darts, seeded replay, legs and sets results, every format finishing, double-in, CSV columns, batch variety and reproducibility, row replay, tuning ranges); a Playwright test at the Fold's outer and inner sizes that plays a match, opens the stats, runs and downloads a batch and replays a row. *(2026-11-18T00:21:49+00:00)* |
| Deployment | Live | GitHub Actions builds, tests and deploys to GitHub Pages on every push to `main`; the first run succeeded. https://evanstom273.github.io/darts-game/ *(2026-11-18T00:24:15+00:00)* |

### Known issues and limitations
- **Upsets now come mostly from blinders.** Best of 11 legs: all-20s beats all-10s 96.7%, all-15s 92.7%; all-10s beats all-5s 91.1%; and a pub player (all-1s) beats the world's best (all-20s) about 5% of the time, because anyone can have a blinder (#36, #57). Approved as it is (#61).
- **Whitewashes between equals are still common** in batch 2's format (best of 13 sets of 3 legs): 7–0 in about 11% of matches, against about 1.6% if every set were a coin flip. Most come from a blinder or stinker on one side, which #57 needs; approved (#61).
- ~~**Not yet run on the Fold.**~~ Lyra ran 10,000 matches on the Fold in under about 2 seconds (2026-11-18T00:24:15+00:00). Claude's figure of 11.5 s came from its cloud container, which is far slower, with everything random (longer matches on average).
- **The darts are still the mock-up's flat darts**; the depth, 3D look and darts rework Lyra asked for (§C) hasn't been done.
- **Stamina only covers long matches.** Long days and a packed schedule (#47) need tournaments and a calendar.
- **Long-term form is a setting**, not earned; there's no career yet (#38).
- **The "9" only shows in 501 legs** (it's about nine-darters), whatever the in and out rules.
- **No "two clear legs" or sudden-death deciding legs**; every leg and set is a plain best-of.

### Tuning log

**Batch 1** (2026-11-18T00:26:09+00:00; Lyra's run on the Fold, 10,000 matches, everything random, batch seed 977636317; first-take tuning):
- **Working:** every format behaves (double out never above 170, master and straight out up to 180, quickest 501 leg 9 darts; double in drags averages down to 73 from 84; straight out lifts checkout % to 45% from 32%). Checkouts 1 → 20 gives 21% → 42% on doubles, the top end about right for real pros. Form ±5 moves a player's average about ±5.5. Top players have stinkers: scoring-20 players ranged 72 to 137, with 5% of their matches under 85.
- **Average by scoring (501 SIDO, median):** 1: 68.5 · 5: 75.3 · 10: 83.6 · 15: 90.6 · 20: 98.1. **100+ averages:** none at scoring 6 or below; 3% at 10; 21% at 16; 41% at 20. **110+:** none at scoring 11 or below (scoring 10's best was 109.6); 2% at 15; 11% at 20.
- **Not working: no ceilings (#36) fails at the bottom.** The cap on the best possible day (added by Claude to stop 144 averages) is itself a ceiling: a low-rated player's best day can't get near 110.
- **Not working: stamina** shows no visible effect even in matches of 30+ legs. **Consistency is weak:** the spread of averages (SD) is 9.9 at consistency 1–5 against 7.7 at 16–20. **Composure is weak** except in major finals (32% on doubles at composure 1–5 against 36.5% at 16–20; no difference on the floor).
- **Upsets:** with mixed attributes, a player 10+ scoring points better wins about 92%; scoring 18–20 beats scoring 1–8 about 94%; 4–6 points better wins about 71%. Longer matches favour the favourite only slightly. (Claude's earlier "all-20s beats all-10s 99%" was with every attribute equal, which exaggerates it.) Whether this is too many or too few upsets depends on what the 1–20 scale stands for in real-world terms.
- **Nine-darters:** 110 in 129,433 legs of 501, about 1 in 1,200.

**Batch 2** (2026-11-18T00:33:24+00:00; Lyra's controlled test: 10,000 matches with a legs CSV, batch seed 507318879. Both players every attribute 10 and form +5; best of 13 sets, sets best of 3 legs; 501 SIDO; TV):
- **Players:** median average 89.6 (1st–99th percentile 75.8–103.7; lowest 58.6, highest 113.7); 110+ in 3 of 20,000 player-matches. First 9 median 100.9. Doubles 33%. Per match: 2.8 180s, 17 140+, 40 100+, 2.2 ton-plus checkouts. 140 nine-darters.
- **Legs:** the player throwing first wins 61.6%. Median winning leg 16 darts. Checkout 40 finishes a quarter of all legs (then 20, 100, 36, 80); 170 finishes 1,756 legs (0.7%), and 17.6% of legs end on a ton-plus checkout, both possibly high.
- **Stamina shows** in long matches: leg averages fall from about 91.6 in the first five legs to 89.0 after leg 30.
- **The day roll decides most matches:** with identical players, whoever rolled the better day won 81.6% (98.8% when the gap was big); the player with the higher average won 86.4%. Scorelines are spread almost evenly from 7–0 to 7–6, with 7–0 in 9.3% of matches (a coin flip per set would give about 1.6%). Winning the first set leads to winning the match 68.8%; trailing 0–3 in sets, 8.5% come back.
- **In-match form is a near-constant boost, not an ebb and flow:** at the end of legs it sits at a median +0.049 (about 5% tighter spread) and is almost never negative, because good visits (100+, 140+, 180, checkouts) are judged on fixed scores rather than against the player's own level. Winning a leg adds only a few points to winning the next (65.9% holding after winning the last leg against 61.6% overall).

**Batch 3** (2026-11-18T00:46:00+00:00; after the retune, CSV version 2; Lyra's test, 10,000 matches, batch seed 3378538919. Player 1 decent but cold: every attribute 10, form -5. Player 2 pub level but red hot: every attribute 1, form +5. Best of 13 sets, sets best of 3 legs; 501 SIDO; TV):
- **Result:** the decent, cold player wins 93.0%; the hot pub player 7.0%. Averages: player 1 median 61.7 (5th–95th percentile 55.3–77.3), player 2 median 52.3 (46.6–106.3). Doubles 21.9% against 18.7%.
- **Every upset is a blinder, and blinders are all-or-nothing.** When the pub player had a blinder (6.1% of matches) they won 98.9%, with a median average of 111.9; on normal days for both they won 0.12%. 580 of their 697 wins were 7–0. When only player 1 had a stinker, player 2 won 39%.
- **Form moved each player by a few points but didn't close the gap:** on normal days, form +5 against form -5 is nowhere near enough for an all-1s player to beat an all-10s player.
- **Scorelines are bimodal:** player 1 won 7–0 in 41.5% of matches; close finishes (7–5, 7–6 either way) were 1.8%.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- **How the attributes work** (retuned 2026-11-18T00:43:19+00:00; all numbers in `src/engine/tuning.ts`): *scoring* sets the spread on treble and single darts (5.6 mm at 20 to 19 mm at 1) and *checkouts* the spread on finishing darts and any dart at a double (6 mm to 15.5 mm). *Consistency* sets the everyday "on the day" roll (small: about ±1% at 20 to ±5% at 1 on the spread) and how often a player has a stinker (1% to 3.5% of matches; the spread widens by about a quarter) or a blinder (1.2% to 6.5%; for that match they throw close to the world's best on their best day, whoever they are). *Composure* reduces how much pressure widens the spread, down to 10% of it at composure 20: winning doubles (leg, set, match), scoring when the opponent's on a finish or in a deciding leg or set, and a little on every dart on TV and more in a major final. *Stamina* sets how fast the spread grows after a player's 250th dart of a match. *In-match form* judges each scoring visit against what that player would normally score today (their spread, day, form and tiredness), so a 100 is a good visit for a pub player and an ordinary one for the world's best; good and bad visits move it up and down, checkouts and missed doubles nudge it, it decays by 15% a visit and is capped at ±15% on the spread. *Long-term form*: each point is about 2.5% on the spread.
- **Results after retuning** (3,000 matches each, best of 11 legs, TV): average all-1s 49.6, all-5s 58.8, all-10s 72.7, all-15s 87.5, all-20s 102.3; doubles 15% to 44%; 110+ in 2.0% of an all-10 player's matches (1.7% for all-1s, 10% for all-20s). Identical all-10 players in Lyra's batch-2 format: the better day wins 64–67%; in-match form centred (median -0.006, 10th to 90th percentile -0.06 to +0.04); winning a leg lifts the next hold from 58% to 63%. Consistency 1 against 20: spread of averages 8.9 against 6.2, 105+ in 5.4% against 1.3% of matches. Composure 1 against an equal composure-15 player wins 44% on the floor and 35% in a major final (composure 20: 52% and 57%). Stamina in best of 13 sets of 5 legs: after leg 30, stamina 1 averages about 8 points below its start and wins 26% against stamina 15; stamina 20 drops about 2 and wins 58%.
- **Double in** aims at D20 to open; darts before the opening double score nothing. A checkout attempt is any dart aimed at a target that would finish under the out rule. Master out finishes on a double, treble or the bull.
- **Random settings** roll from: attributes 1–20 and form -5 to +5, uniformly; legs play 55% / sets 45%; legs matches best of 5–35; sets matches best of 3–13 with sets of best of 5 legs (85%) or 3 (15%); start 501 (80%), 301 (12%), 701 (8%); straight in 85%; double out 85%, master 8%, straight 7%; stage floor 50%, TV 40%, major final 10%.
- **The CSV** (version 2 since the retune; rows from version 1 won't replay, because the engine changed): one row per match with both players' attributes, form and on-the-day spread (above 1 is a worse day), the format, the result and every stat in the stats view plus legs won, darts, points, busts and nine-darters; the optional legs CSV has one row per leg with each player's darts, points, leg average and in-match form at the end of the leg. Each row carries its match seed, so pasting it into Replay shows that exact match.
- **Settings are remembered on the device in browser storage**, not Dexie, since they're a convenience rather than saved game data.
- **The mock-up is far too consistent for #36–#39** (measured 2026-11-17T23:47:28+00:00): over 3,000 simulated matches, Reid (set up as about a 97 player) averaged 97.6 with a spread of only ±4.0, never went below 83.7, and hit 110+ in 9; de Wit hit 110+ in 3 and never went below 80. Random variation dart by dart evens out over a match, so a 110-then-76 swing has to come from something that varies match to match (and over longer spells), not from the darts' spread alone. The mock-up's only match-level variation is a ±6% "form" roll.
- **The mock-up's dart model** (not a design decision): each dart lands around its aim point with a normal spread, wider along the line to the centre than across it, widened by nerves on finishing doubles that win a leg, set or match. A spread of about 6.5 mm gives roughly a 97 average, 40% on doubles and 0.3 180s a leg, close to real pro darts; 6.3 and 6.8 mm are used for the two players. Checkout routes are the cheapest route by darts used, then by a preference for good doubles (D20, D16, D18, D10, D8, D12) and high trebles.
- **"PDC-style" is read as the look and layout of PDC's TV score graphic**, without PDC's name, logo or branding, since the world is fictional (#10).
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
| 16 | 2026-11-17T23:15:14+00:00 | Concept | Text-based; the dartboard, the throws and the darts are graphics. |
| 17 | 2026-11-17T23:15:14+00:00 | Technical | Stack: React, Vite, TypeScript, Tailwind CSS, IndexedDB via Dexie; Phaser only if the darts sim needs it. |
| 18 | 2026-11-17T23:15:14+00:00 | Technical | Deployed to GitHub Pages for now; maybe Cloudflare Workers in future if needed. |
| 19 | 2026-11-17T23:20:59+00:00 | Workflow | The match view gets built as an Artifact, once Lyra has designed it. |
| 20 | 2026-11-17T23:20:59+00:00 | Platform | Has to fit the Pixel 10 Pro Fold: outer screen in portrait, and the inner screen. |
| 21 | 2026-11-17T23:20:59+00:00 | Matches | The match view shows the board, the score and a full PDC-style graphic. |
| 22 | 2026-11-17T23:20:59+00:00 | Matches | Optional full-stats view: average, first 9, highest checkout, checkout % as "1/10 - 10%", 180s, 140+, 100+ and the like. |
| 23 | 2026-11-17T23:23:39+00:00 | Matches | Outer screen, portrait: board on top, graphic below (Claude's recommendation, approved). |
| 24 | 2026-11-17T23:23:39+00:00 | Matches | Inner screen: stats always on show, beside or below the board and graphic. |
| 25 | 2026-11-17T23:23:39+00:00 | Matches | The optional stats view swaps with the board; the graphic stays (Claude's recommendation, approved). |
| 26 | 2026-11-17T23:23:39+00:00 | Matches | No commentary text in the match view. |
| 27 | 2026-11-17T23:25:12+00:00 | Matches | Graphic also holds the checkout route, darts thrown this leg, and the "9" indicator (Lyra's addition); not the average or the visit's running total. |
| 28 | 2026-11-17T23:25:12+00:00 | Matches | Darts stay on the board until the next visit (Claude's recommendation, approved). |
| 29 | 2026-11-17T23:25:12+00:00 | Matches | Pace is adjustable, roughly TV pace by default (Claude's recommendation, approved). |
| 30 | 2026-11-17T23:25:12+00:00 | Matches | More stats: best leg, legs won against the throw, ton-plus checkouts. |
| 31 | 2026-11-17T23:26:07+00:00 | Matches | Inner screen: stats beside the board and graphic (Claude's recommendation, approved). |
| 32 | 2026-11-17T23:26:07+00:00 | Matches | The "9" indicator shows while a nine-darter is still possible. |
| 33 | 2026-11-17T23:26:07+00:00 | Matches | Full-stats view is head to head, like the TV stats graphic (Claude's recommendation, approved). |
| 34 | 2026-11-17T23:28:36+00:00 | Art | Graphics are SVG. |
| 35 | 2026-11-17T23:28:36+00:00 | Matches | The "9" appears once the first dart is the start of a possible nine-darter, not before the leg starts. Refines #32. |
| 36 | 2026-11-17T23:44:51+00:00 | Players | No ceilings: everybody is capable of throwing any average; form, composure, scoring and finishing ability (examples) decide how often. |
| 37 | 2026-11-17T23:44:51+00:00 | Players | Form within a match: a really good visit lifts form for that match, but nobody's invincible. |
| 38 | 2026-11-17T23:44:51+00:00 | Players | Form across matches and tournaments: a great few months makes a player the favourite going into every tournament. |
| 39 | 2026-11-17T23:47:28+00:00 | Players | Form isn't a guarantee: a player averaging 110 in their last tournament can throw 76 in the next match. |
| 40 | 2026-11-17T23:50:09+00:00 | Players | Attributes: composure, scoring, checkouts (doubling and checkouts treated as one). More undecided. |
| 41 | 2026-11-17T23:50:09+00:00 | Players | No overall skill rating (it's the ceiling approach). |
| 42 | 2026-11-17T23:50:09+00:00 | Players | Attributes are a guide, not a guarantee: a top finisher doesn't hit every double. |
| 43 | 2026-11-17T23:51:33+00:00 | Players | Consistency is an attribute: how wildly a player swings match to match (Claude's recommendation, approved). |
| 44 | 2026-11-17T23:51:33+00:00 | Players | Stamina is an attribute: holding up over long formats and long days. |
| 45 | 2026-11-17T23:51:33+00:00 | Players | Attributes on a 1–20 scale. |
| 46 | 2026-11-17T23:55:29+00:00 | Players | Composure covers doubles that win something, scoring under pressure, and the big stage. |
| 47 | 2026-11-17T23:55:29+00:00 | Players | Stamina is worn down by long matches, long days and a packed schedule. |
| 48 | 2026-11-17T23:55:29+00:00 | Players | Consistency covers swings between matches only (Claude's recommendation, approved). |
| 49 | 2026-11-17T23:55:29+00:00 | Players | Attributes change slowly, up and down: about 2–3 points on average over ten years; never 1 to 20 in ten years or 20 to 1 in a few. |
| 50 | 2026-11-17T23:55:29+00:00 | Players | Age doesn't matter. |
| 51 | 2026-11-17T23:58:11+00:00 | Players | Training and playing well move attributes up; playing badly consistently over a long period knocks them down. Only a little. |
| 52 | 2026-11-17T23:58:11+00:00 | Players | Created characters: the player picks every attribute freely, 1 to 20, choosing their own difficulty. |
| 53 | 2026-11-17T23:58:11+00:00 | Concept | Touchstone: MDickie's games (Wrestling Empire), where maximum attributes don't win every match. |
| 54 | 2026-11-18T00:03:31+00:00 | Workflow | Next build: attributes and the match view in the game, plus a batch simulator exporting CSV for tuning. |
| 55 | 2026-11-18T00:21:49+00:00 | Workflow | Build plan approved with changes: form; random or hand-set attributes; free choice of format (legs/sets, length, in/out rules), all randomisable per match in batches. |
| 56 | 2026-11-18T00:43:19+00:00 | Players | The 1–20 scale covers the whole darts world: 1 a pub player (~40–50 average), 20 the world's best (~100+). |
| 57 | 2026-11-18T00:43:19+00:00 | Players | A scoring-10 player throws 110+ in about 1 match in 50, on average. |
| 58 | 2026-11-18T00:43:19+00:00 | Players | Consistency, composure and stamina get a bigger effect. |
| 59 | 2026-11-18T00:43:19+00:00 | Players | Between identical players, the better day wins about 65% (was 82%). |
| 60 | 2026-11-18T00:43:19+00:00 | Workflow | Fix in-match form (it was a constant boost) and tone down the day roll. |
| 61 | 2026-11-18T00:47:08+00:00 | Players | Blinders stay all-or-nothing for the whole match; it doesn't need to be realistic (Lyra, after batch 3). |
| 62 | 2026-11-18T00:48:58+00:00 | Players | Form should produce big nights: a weaker player on great form throwing more 100+/110+ than a better player on awful form is how form should work. |

---

## H. Technical Notes

- **Repository:** `evanstom273/darts-game`. Working branch `ccr-e85ad7ee-472voh`.
- **GitHub Pages:** the workflow is `.github/workflows/deploy.yml`, deploying on every push to `main`. The game is at https://evanstom273.github.io/darts-game/.
- **Project layout:**
  - `src/engine/`: the simulation, plain TypeScript with no UI: `board.ts` (geometry and scoring), `rules.ts` (formats, in and out rules, checkout routes, aiming, nine-darter tables), `players.ts` (attributes to spreads), `match.ts` (a match, event by event, with stats), `rng.ts` (seeded randomness), `tuning.ts` (every number).
  - `src/sim/`: `setup.ts` (settings with Random choices, and what Random rolls from), `batch.ts`, `worker.ts` (runs batches off the main thread), `csv.ts` (columns, rows, reading a row back).
  - `src/match/`: the match view: `Board.tsx`, `Graphic.tsx`, `StatsCard.tsx`, `MatchView.tsx`, `useMatchRunner.ts` (plays a match in real time), `match.css`.
  - `src/panel/SimPanel.tsx`: the Simulate panel. `src/App.tsx` puts them together; `src/settings.ts` remembers the settings.
  - `tests/unit/` (Vitest) and `tests/e2e/` (Playwright). Commands are in the README.
  - `@playwright/test` is pinned to 1.63.0 to match the browser in Claude's cloud environment.
- **Explain before adding** *(carried over from Lyra's previous design documents)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
