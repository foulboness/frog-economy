# Frog Economy 🐸

A tiny arcade browser game about catching frogs, avoiding poop, and surviving a very volatile pond economy.

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

## Leaderboard

The leaderboard is intentionally disabled in `leaderboard.js`. While disabled:

- The game does not ask for a player name.
- No leaderboard is displayed.
- The game works offline after the files are downloaded.
- The local high score still works.

To add an online leaderboard, connect a backend or hosted leaderboard service. Do not place private API keys in client-side JavaScript. Implement `submit()` and `getTopScores()` in `leaderboard.js`, then set `ENABLED` to `true` only after the integration is complete.

## Deploy

This is a static website and can be hosted on Netlify, Vercel, GitHub Pages, or any static web host.

### Netlify
1. Upload the unzipped project folder to Netlify, or connect its Git repository.
2. Set the publish directory to the project root (`.`).
3. No build command is needed.

### Vercel
1. Import the repository into Vercel.
2. Select **Other** as the framework preset if prompted.
3. Leave the build command empty.
4. Set the output directory to `.` (project root).
5. Deploy.

Ensure `index.html`, `style.css`, `game.js`, and `leaderboard.js` are all in the deployed root directory.

## Project files

```text
frog-economy/
├── index.html       # Page structure and game HUD
├── style.css        # Responsive editorial arcade styling
├── game.js          # Canvas rendering, controls, collisions, scoring
├── leaderboard.js   # Disabled-by-default leaderboard adapter
└── README.md
```

## Notes

- The Google Fonts import is optional; if unavailable, local fallback fonts are used.
- The game draws its sprites directly on Canvas, so no image assets are required.
'''
}

for name, content in files.items():
    with open(os.path.join(base, name), "w", encoding="utf-8") as f:
        f.write(content)

zip_path = "/mnt/data/frog-economy.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for name in files:
        z.write(os.path.join(base, name), arcname=f"frog-economy/{name}")

print("Created:", zip_path)
print("Files:", ", ".join(files.keys()))