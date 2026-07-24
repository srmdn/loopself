# Loopself

Short time-loop puzzle. Each run lasts a few seconds. When the timer ends, your past self replays as a **ghost**. Hold switches, open doors, and reach the exit by cooperating with earlier versions of yourself.

## Play

Serve the project root with any static file server (ES modules do not load from `file://`), then open the site in a browser.

```bash
# example
python3 -m http.server 8765
```

## Controls

| Key | Action |
|-----|--------|
| WASD / arrows | Move |
| R | Hard reset level (wipe all ghosts) / Replay after clear |
| Esc / M | Level select menu |
| 1–9 | Jump to level |
| N | Next level (after clear) |
| Click | Choose level / clear buttons |

## Stack

- HTML + Canvas 2D + vanilla JavaScript
- No build step, no dependencies
- `localStorage` for fewest-ghosts personal bests

## Status

**Slice B (partial)**: level select menu, best scores, L01 + L02 (two-plate AND).
Core loop from Slice A: timer, ghost record/playback, plates + doors.

## License

All rights reserved unless a license file is added later.
