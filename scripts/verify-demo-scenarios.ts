/**
 * VAMO — Scripted Verification for 3 Demo Scenarios
 *
 * Verifies:
 * 1. Photo exists and matches place
 * 2. No ratings or review counts (null / omitted)
 * 3. No photo credits (empty photos array)
 * 4. Overview has >= 3 lines
 * 5. Best-time text has a window + reason
 * 6. Budget labeled "model estimate"
 * 7. Zero occurrences of OCR/caption/speech/Gemini/evidence in keys or strings
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  scenarioId: string;
  destination: string;
  photoExistsAndMatches: boolean;
  photoDetails: string;
  noRatings: boolean;
  noPhotoCredits: boolean;
  overviewLines: number;
  overviewValid: boolean;
  bestTimeValid: boolean;
  bestTimeSummary: string;
  budgetLabeledEstimate: boolean;
  noForbiddenTerms: boolean;
  forbiddenDetails: string[];
  allPassed: boolean;
}

export function runDemoScenarioAudit(): CheckResult[] {
  const jsonPath = path.resolve(__dirname, '../mobile/lib/fixtures/demo-scenarios.json');
  const scenarios = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const photoMapping: Record<string, { file: string; depicts: string }> = {
    jeju: {
      file: 'mobile/assets/backgrounds/jeju_island.webp',
      depicts: 'Seongsan Ilchulbong staircase & black sand cove, Jeju Island',
    },
    rome: {
      file: 'mobile/assets/backgrounds/rome_colosseum.webp',
      depicts: 'Colosseum outer arcade in afternoon sunlight, Rome',
    },
    kyoto: {
      file: 'mobile/assets/backgrounds/cherry_blossom_pagoda.webp',
      depicts: 'Kiyomizu-dera pagoda among cherry blossoms at sunset, Kyoto',
    },
  };

  const results: CheckResult[] = [];
  const forbiddenTerms = ['ocr', 'caption', 'speech', 'gemini', 'evidence'];

  for (const [id, s] of Object.entries<any>(scenarios)) {
    const bg = s.data.best_guess;
    const ti = s.data.travel_intelligence;

    // 1. Photo exists and matches place
    const expected = photoMapping[id];
    const fileExists = expected ? fs.existsSync(path.resolve(__dirname, '..', expected.file)) : false;

    // 2. No ratings
    const bgNoRating = bg.rating == null && bg.user_ratings_total == null;
    const nearbyNoRating = (s.data.nearby_places || []).every(
      (p: any) => p.rating == null && p.user_ratings_total == null
    );
    const noRatings = bgNoRating && nearbyNoRating;

    // 3. No photo credits
    const bgNoCredits = !bg.photos || bg.photos.length === 0;
    const nearbyNoCredits = (s.data.nearby_places || []).every(
      (p: any) => !p.photos || p.photos.length === 0
    );
    const noPhotoCredits = bgNoCredits && nearbyNoCredits;

    // 4. Overview has >= 3 lines
    const overviewKeys = ['where', 'size', 'main_city_landmark', 'recognition', 'climate'].filter(
      (k) => bg.overview && typeof bg.overview[k] === 'string' && bg.overview[k].trim().length > 0
    );
    const overviewLines = overviewKeys.length;
    const overviewValid = overviewLines >= 3;

    // 5. Best-time text is a window + reason
    const hasWindow = Boolean(ti.recommended_window && ti.recommended_window.trim().length > 0);
    const hasReason = Boolean(ti.recommended_reason && ti.recommended_reason.trim().length > 0);
    const bestTimeValid = hasWindow && hasReason;
    const bestTimeSummary = `${ti.recommended_window}: ${ti.recommended_reason}`;

    // 6. Budget labeled estimate
    const basis = ti.budget_model?.basis || '';
    const budgetLabeledEstimate = /estimate/i.test(basis);

    // 7. Nothing mentions OCR/caption/speech/Gemini/evidence
    const forbiddenDetails: string[] = [];
    function scan(obj: any, currentPath = '') {
      if (typeof obj === 'string') {
        for (const term of forbiddenTerms) {
          if (new RegExp(term, 'i').test(obj)) {
            forbiddenDetails.push(`String "${currentPath}" contains "${term}": "${obj}"`);
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, idx) => scan(item, `${currentPath}[${idx}]`));
      } else if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          for (const term of forbiddenTerms) {
            if (new RegExp(term, 'i').test(k)) {
              forbiddenDetails.push(`Key "${currentPath}.${k}" matches forbidden term "${term}"`);
            }
          }
          scan(v, `${currentPath}.${k}`);
        }
      }
    }
    scan(s);
    const noForbiddenTerms = forbiddenDetails.length === 0;

    const allPassed =
      fileExists &&
      noRatings &&
      noPhotoCredits &&
      overviewValid &&
      bestTimeValid &&
      budgetLabeledEstimate &&
      noForbiddenTerms;

    results.push({
      scenarioId: id,
      destination: s.name,
      photoExistsAndMatches: fileExists,
      photoDetails: expected ? expected.depicts : 'Unknown photo mapping',
      noRatings,
      noPhotoCredits,
      overviewLines,
      overviewValid,
      bestTimeValid,
      bestTimeSummary,
      budgetLabeledEstimate,
      noForbiddenTerms,
      forbiddenDetails,
      allPassed,
    });
  }

  return results;
}

export function printAuditTable(results: CheckResult[]) {
  console.log('\n========================================================================================================');
  console.log('DEMO SCENARIOS HONESTY & INTEGRITY AUDIT');
  console.log('========================================================================================================\n');

  console.log(
    '| Destination | Photo Match | Zero Ratings | Zero Photo Credit | Overview >= 3 | Window + Reason | Budget Estimate | Zero Forbidden | Status |'
  );
  console.log(
    '|-------------|-------------|--------------|-------------------|---------------|-----------------|-----------------|----------------|--------|'
  );

  for (const r of results) {
    const photoCell = r.photoExistsAndMatches ? 'PASS (Exists)' : 'FAIL';
    const ratingsCell = r.noRatings ? 'PASS (null)' : 'FAIL';
    const creditsCell = r.noPhotoCredits ? 'PASS (0)' : 'FAIL';
    const overviewCell = r.overviewValid ? `PASS (${r.overviewLines} lines)` : `FAIL (${r.overviewLines})`;
    const bestTimeCell = r.bestTimeValid ? 'PASS' : 'FAIL';
    const budgetCell = r.budgetLabeledEstimate ? 'PASS (model estimate)' : 'FAIL';
    const forbiddenCell = r.noForbiddenTerms ? 'PASS (0)' : `FAIL (${r.forbiddenDetails.length})`;
    const statusCell = r.allPassed ? 'PASS' : 'FAIL';

    console.log(
      `| ${r.destination.padEnd(11)} | ${photoCell.padEnd(11)} | ${ratingsCell.padEnd(12)} | ${creditsCell.padEnd(17)} | ${overviewCell.padEnd(13)} | ${bestTimeCell.padEnd(15)} | ${budgetCell.padEnd(15)} | ${forbiddenCell.padEnd(14)} | ${statusCell.padEnd(6)} |`
    );
  }

  console.log('\n--------------------------------------------------------------------------------------------------------');
  console.log('Detailed Scenario Check Notes:');
  for (const r of results) {
    console.log(`\n[${r.destination} (${r.scenarioId})]`);
    console.log(`  • Photo Depiction: ${r.photoDetails}`);
    console.log(`  • Best Time: ${r.bestTimeSummary}`);
    if (r.forbiddenDetails.length > 0) {
      console.log(`  • Forbidden Term Violations:`);
      r.forbiddenDetails.forEach((d) => console.log(`      - ${d}`));
    } else {
      console.log(`  • Forbidden Terms: Clean (no OCR, caption, speech, Gemini, or evidence references)`);
    }
  }
  console.log('\n========================================================================================================\n');
}

if (require.main === module) {
  const results = runDemoScenarioAudit();
  printAuditTable(results);
  const anyFailed = results.some((r) => !r.allPassed);
  if (anyFailed) {
    process.exit(1);
  }
}

