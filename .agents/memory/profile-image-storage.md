---
name: Profile image storage
description: Why profile/AI-generated images and thumbnails are stored in Postgres instead of the filesystem, and how the filesystem cache fits in.
---

Persist full-size images and thumbnails as base64 in a database table, never rely on the filesystem as the source of truth.

**Why:** Replit's filesystem is ephemeral — files written outside the repo (e.g. generated thumbnails, uploaded photos) can disappear on restart/redeploy. AI-generated avatar images previously had intermittent "missing image" issues traced back to this plus a missing `sharp` dependency needed for thumbnail generation.

**How to apply:** A filesystem directory can still be used as a *cache* for derived data (e.g. thumbnails) as long as the code transparently regenerates the cached artifact from the DB row when the cache file is absent. Never treat the filesystem cache as the only copy. Also double check native image-processing libraries (e.g. `sharp`) are actually installed — a missing dependency here manifests as a silent crash/500 on the image pipeline, not an obvious import error.
