# Frog Economy 

Built with plain **HTML, CSS, JavaScript, and Canvas**. No framework, build step, database, or external game library is required.

## Play locally

1. Download and unzip the project.
2. Open the `frog-economy` folder.
3. Double-click `index.html` to open it in a browser.

For a local development server, open the folder in VS Code and use the Live Server extension, or run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

| Control | Action |
| --- | --- |
| Left / Right arrows | Move the lily pad |
| A / D | Move the lily pad |
| Mouse / trackpad | Move the lily pad horizontally |
| Touch / drag | Move the lily pad on mobile |
| P | Pause / resume |
| Space | Start or restart after game over |

## Rules

- Catch a big frog: **+1 point**
- Catch a medium frog: **+3 points**
- Catch a small frog: **+6 points**
- Let a frog fall past the lily pad: **lose one life**
- Catch poop: **lose one life**
- Let poop fall past the lily pad: **no penalty**
- You begin with **3 lives**.

The requested spawn weights (48, 24, 11, 16) add up to 99 rather than 100. The game normalizes these weights when choosing a spawn, preserving their relative odds while covering the full probability range.

The falling speed ramps up smoothly over the first 60 seconds, reaching **2.25×** the starting pace, then stays capped. Spawn frequency also increases gradually.

## High score

The best score is stored in your browser's `localStorage` under:

```text
frog-economy-best-v1
```

It is local to that browser and device. Clearing site data or using a different browser may reset or separate the score.
