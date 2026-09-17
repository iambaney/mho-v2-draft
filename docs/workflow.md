# How the site gets edited and published

Diagrams for the My Healing Oasis site. They are written in [Mermaid](https://mermaid.js.org): GitHub renders them in place, VS Code previews them with a Mermaid extension, and https://mermaid.live edits them.

The case for this design, written for Andrew in Divi terms, is in [proposal.md](proposal.md).

## The loop

Every change, from anyone, goes round this loop. Nothing reaches the live site without a person pressing Publish.

```mermaid
flowchart LR
  edit["1 · Make a change<br/>(code, the edit page, or an AI agent)"]
  draft["2 · The draft site shows it<br/>about a minute later"]
  check{"3 · Happy with it?"}
  live["4 · The live site shows it<br/>about a minute later"]
  edit --> draft --> check
  check -- "Not yet: change it again,<br/>or restore an earlier version" --> edit
  check -- "Yes: press Publish" --> live
  classDef draftsite fill:#F7ECDD,stroke:#C07640,color:#2A241D
  classDef livesite fill:#E3EBE4,stroke:#46684B,color:#2A241D
  class draft draftsite
  class live livesite
```

## Who does what

Three ways in, one repository, two branches, two sites. Everyone lands on the draft branch; only Publish writes to main.

```mermaid
flowchart TB
  subgraph doors["Three ways in"]
    anthony["Anthony<br/>code editor + git"]
    andrew["Andrew's AI agents<br/>read AGENTS.md, then<br/>edit copy or design"]
    anya["Anya<br/>the edit page: the site itself,<br/>every line editable, no account"]
    cms["Pages CMS form<br/>images, links, new reviews"]
  end
  relay["Relay<br/>a small server that turns<br/>Save into a commit"]
  draft[("GitHub · draft branch<br/>every change lands here")]
  draftsite["Draft site · …/draft/<br/>includes the edit page"]
  main[("GitHub · main branch<br/>only Publish writes here")]
  livesite["Live site · myhealingoasis.net<br/>HTML + CSS, no JavaScript"]

  anthony -- "push" --> draft
  andrew -- "push" --> draft
  anya -- "Save" --> relay -- "commit" --> draft
  cms -- "save = commit" --> draft
  draft -- "GitHub Actions builds and uploads it, about a minute" --> draftsite
  draftsite -- "Publish: the button on the edit page, the CMS button, or one command.<br/>The Publish workflow merges draft into main." --> main
  main -- "GitHub Actions builds and uploads it, about a minute" --> livesite
  draftsite -. "Restore or Undo in the Versions panel<br/>= a new commit on draft" .-> draft
  classDef draftsite fill:#F7ECDD,stroke:#C07640,color:#2A241D
  classDef livesite fill:#E3EBE4,stroke:#46684B,color:#2A241D
  class draftsite draftsite
  class livesite livesite
```

## What happens when someone presses Save

The edit page is the home page with every line turned into a form field. Save posts the form to the relay, which writes one commit.

```mermaid
%%{init: {"sequence": {"width": 120, "actorMargin": 36, "messageMargin": 24, "boxMargin": 8, "mirrorActors": false}}}%%
sequenceDiagram
  actor Anya
  participant Edit as Edit page
  participant Relay
  participant GitHub as GitHub<br/>draft branch
  participant Draft as Draft site
  Anya->>Edit: changes a headline, presses Save
  Edit->>Relay: posts the form (no JavaScript)
  Relay->>GitHub: commits that one field to draft
  GitHub->>GitHub: the push starts a build
  GitHub->>Draft: uploads the new pages
  Draft-->>Anya: a minute later the change is on the draft site,<br/>at the top of the Versions list
```

## What happens when someone presses Publish

Publish is one workflow. It merges draft into main, rebuilds the live site, and leaves the two branches identical.

```mermaid
%%{init: {"sequence": {"width": 120, "actorMargin": 36, "messageMargin": 24, "boxMargin": 8, "mirrorActors": false}}}%%
sequenceDiagram
  actor Anya
  participant Relay
  participant Publish as Publish workflow
  participant GitHub
  participant Live as Live site
  Anya->>Relay: presses Publish
  Relay->>Publish: starts it
  Publish->>GitHub: merges draft into main,<br/>then brings draft level with main
  Publish->>GitHub: starts the deploy for main
  GitHub->>Live: builds and uploads the pages,<br/>leaving the edit page out
  Live-->>Anya: a minute later the change is live
```
