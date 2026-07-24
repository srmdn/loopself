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
| R | Hard reset level (wipe all ghosts) |

## Stack

- HTML + Canvas 2D + vanilla JavaScript
- No build step, no dependencies

## Status

**Slice A** playable: move, timer, ghost record/playback, pressure plate + door, tutorial level L01.

## License

All rights reserved unless a license file is added later.
