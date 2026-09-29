# Background video: scroll-scrub encoding

The hero video is scrubbed by scroll: the page sets `video.currentTime` instead of playing the
video. Every seek makes the browser decode from the nearest keyframe up to the target frame.
That makes the encoding the main factor in whether scrubbing is smooth.

## Why the old HLS file lagged

`public/media/generated-video-hls/segment_000.ts`:

- 3840×2160 (4K), ~60 Mbit/s, 60 MB for 8 seconds
- 2 keyframes in 193 frames, plus B-frames, so a seek can decode up to ~96 4K frames
- an audio track that is never used
- random seek cost measured with ffmpeg: **~840 ms**

## Current files (`public/media/scrub/`)

| File | Size | Resolution | Random seek (ffmpeg) |
| --- | ---: | --- | ---: |
| `coffee-scrub-1080.mp4` | 24 MB | 1920×1080 | ~51 ms |
| `coffee-scrub-720.mp4` | 11 MB | 1280×720 | ~42 ms |

Both are all-keyframe (`-g 1`) with no B-frames and no audio, so any frame decodes on its
own. The 720p file is served on screens ≤767 px wide and when data-saver is on.

## Re-encode a new clip

```bash
ffmpeg -i input.mp4 -an \
  -vf "scale=1920:1080:flags=lanczos,format=yuv420p" \
  -c:v libx264 -profile:v high -preset slow -crf 22 \
  -g 1 -keyint_min 1 -bf 0 -tune fastdecode \
  -movflags +faststart public/media/scrub/coffee-scrub-1080.mp4

ffmpeg -i input.mp4 -an \
  -vf "scale=1280:720:flags=lanczos,format=yuv420p" \
  -c:v libx264 -profile:v high -preset slow -crf 24 \
  -g 1 -keyint_min 1 -bf 0 -tune fastdecode \
  -movflags +faststart public/media/scrub/coffee-scrub-720.mp4
```

If the file gets too heavy, try `-g 4` before lowering resolution. Seeks then decode at most
3 extra frames, and the file shrinks a lot.

## Tuning the feel

In `src/components/CinematicVideo.tsx`, `SCRUB_SMOOTHING` (default `0.18`) sets how fast the
video catches up with the scrollbar. Lower values glide more; higher values track the
scrollbar more tightly.
