# Travel AI — Beta Testing & Quality Assurance Plan

**Release Phase:** Internal / Closed Beta  
**Target Platform:** Android (`com.travelai.mobile`)  
**Distribution Channel:** Google Play Internal Testing & EAS Internal Preview Builds

---

## 1. Beta Testing Objectives

The primary objective of the beta testing phase is to validate the Travel AI mobile experience across diverse real-world conditions before public distribution:
1. Validate real Instagram Reel extraction and analysis across diverse creator formats.
2. Confirm Google and Apple OAuth authentication reliability across devices.
3. Verify guest-to-auth state preservation without losing bookmarked destinations.
4. Verify multi-device cloud synchronization and strict account isolation.
5. Identify network latency bottlenecks and edge-case failure modes.

---

## 2. Tester Workflow & Distribution

### A. Internal Preview APK Distribution (Immediate Testing)
1. Developers generate preview APK via EAS:
   ```bash
   eas build --platform android --profile preview
   ```
2. Distribute `.apk` to internal engineering team via direct download or internal shared drive.
3. Testers enable "Install unknown apps" permission for browser/file manager and install the package.

### B. Google Play Internal Testing Track (Production Staging)
1. Build signed Android App Bundle (AAB):
   ```bash
   eas build --platform android --profile production
   ```
2. Upload AAB to **Google Play Console** > **Testing** > **Internal testing**.
3. Add tester email addresses to the authorized testers list.
4. Testers open the opt-in invite link and install Travel AI directly via Google Play Store.

---

## 3. Key Metrics to Monitor

Track these core reliability indicators during beta iterations (using backend observability logs and Play Console Android Vitals):

| Metric | Target SLA | Description | Measurement Source |
|---|---|---|---|
| **Analysis Success Rate** | > 92% | Percentage of valid public travel Reels successfully resolved | Backend `/analyze` logs (`obs_logger`) |
| **Average Analysis Latency** | < 35 seconds | End-to-end processing duration from Reel submission to Dossier | Backend timing metrics & mobile response |
| **OAuth Sign-In Success Rate**| > 98% | Completed OAuth sessions vs. initiated attempts (excluding user cancellations) | Supabase Auth logs |
| **Guest → Auth Preservation** | 100% | Bookmarks preserved when signing in from guest prompt | Manual test checklist / boundary suite |
| **Crash-Free Sessions** | > 99.5% | Percentage of user sessions without unhandled crashes | Google Play Console Android Vitals |
| **Cloud Sync Integrity** | 100% | Zero cross-account data leakage across sign-in / sign-out | Database RLS policy tests |

---

## 4. Defect Classification & Severity Matrix

| Severity Level | Definition | SLA / Action | Release Blocker? |
|---|---|---|---|
| **P0 — Critical** | App crashes on boot; user data leaked to another user; OAuth completely broken; unhandled crash loops | Immediate hotfix required within 24h | **YES — Absolute Release Blocker** |
| **P1 — High** | Analysis hangs with infinite spinner; bookmarked places lost on restart; backend `/health` degraded | Must be fixed before advancing from beta to production | **YES — Release Blocker** |
| **P2 — Medium** | Thumbnail fails to render; non-critical layout glitch on specific screen ratios; minor error message ambiguity | Scheduled for fix during beta cycle | No (if acceptable fallback exists) |
| **P3 — Low** | Typo in copy; slight animation stutter; minor visual alignment discrepancy | Backlog for post-release polish | No |

---

## 5. Bug Reporting Guidelines for Testers

When reporting a bug, testers must provide:
1. **Device Model & OS:** (e.g. Pixel 8, Android 14 / Samsung Galaxy S23, One UI 6)
2. **Instagram Reel URL:** The exact Reel URL tested.
3. **User State:** Guest or Signed-In (Google or Apple).
4. **Steps to Reproduce:**
   - Action 1
   - Action 2
   - Action 3
5. **Expected Behavior:** What should have occurred.
6. **Actual Behavior:** What actually happened.
7. **Screenshots / Video:** Screen recording if reproducible.
8. **Network Condition:** Wi-Fi, 5G, or cellular with low signal.
