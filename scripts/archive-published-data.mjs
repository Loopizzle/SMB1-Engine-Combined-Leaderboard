import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = (process.env.SNAPSHOT_ORIGIN || 'https://smb1ecl.loopie.fr').replace(/\/$/, '');
const sourceDirectory = process.env.SNAPSHOT_DIRECTORY ? path.resolve(process.env.SNAPSHOT_DIRECTORY) : null;
const sourceWorkbook = process.env.SOURCE_WORKBOOK ? path.resolve(process.env.SOURCE_WORKBOOK) : null;
const outputDirectory = path.resolve(process.argv[2] || 'work/published-snapshot');
const manifestPath = 'data/site-data-manifest.json';
const supplementalFiles = [
  'activity.json',
  'activity-snapshot.json',
  'combined-leaderboard.csv',
  'runner-metadata.json',
  'world-countries.geojson',
  'world-region-centroids.json',
];

async function download(relativePath) {
  let bytes;
  if (sourceDirectory) {
    bytes = await readFile(path.join(sourceDirectory, ...relativePath.split('/')));
  } else {
    const response = await fetch(`${origin}/${relativePath}`);
    if (!response.ok) {
      throw new Error(`Could not download ${relativePath}: HTTP ${response.status}`);
    }
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const destination = path.join(outputDirectory, ...relativePath.split('/'));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

await mkdir(outputDirectory, { recursive: true });
const manifestFile = await download(manifestPath);
const manifest = JSON.parse(await readFile(path.join(outputDirectory, manifestPath), 'utf8'));
const partFiles = (manifest.parts || []).map((file) => `data/${file}`);
const files = [manifestFile];

for (const relativePath of [...partFiles, ...supplementalFiles]) {
  files.push(await download(relativePath));
}

if (sourceWorkbook) {
  const bytes = await readFile(sourceWorkbook);
  const filename = 'source-workbook-2026-10-01.xlsx';
  await writeFile(path.join(outputDirectory, filename), bytes);
  files.push({
    path: filename,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

const joinedData = Buffer.concat(
  await Promise.all(partFiles.map((file) => readFile(path.join(outputDirectory, ...file.split('/'))))),
);
const siteData = JSON.parse(joinedData.toString('utf8'));
const runnerMetadata = JSON.parse(await readFile(path.join(outputDirectory, 'runner-metadata.json'), 'utf8'));
const provenance = {
  archiveFormat: 1,
  archivedAt: new Date().toISOString(),
  publishedOrigin: origin,
  acquisitionPeriod: 'Before the Speedrun.com Terms of Use change effective 2026-10-01',
  sourceDescription: siteData.generatedFrom || 'The SMB1 Engine Combined Leaderboard public workbook',
  sourceGeneratedAt: siteData.generatedAt || null,
  runnerMetadataGeneratedAt: runnerMetadata.generatedAt || null,
  recoveryEvidence: {
    sourceWorkbookVersion: 'October 1, 2026, 06:03 Europe/Paris',
    workflowRun: 'https://github.com/Loopizzle/SMB1-Engine-Combined-Leaderboard/actions/runs/36910892716',
    workflowStartedAt: '2026-10-01T18:58:55Z',
    workflowArtifactSha256: 'eb30ebda99eb302318fcfdd93fc7d1ca138911c0ca5445f2e414c651496d942b',
    workflowCounts: {
      currentRuns: 7182,
      acceptedHistoricalRuns: 19851,
      rankedRunners: 2786,
      monthlyRows: 9583,
      yearlyRows: 4476,
    },
  },
  counts: {
    currentRuns: siteData.runs?.length || 0,
    rankedRunners: siteData.combined?.length || 0,
    boards: siteData.boards?.length || 0,
    games: siteData.games?.length || 0,
    cachedRunnerProfiles: runnerMetadata.players?.length || 0,
  },
  files,
};

await writeFile(
  path.join(outputDirectory, 'PROVENANCE.json'),
  `${JSON.stringify(provenance, null, 2)}\n`,
  'utf8',
);
console.log(JSON.stringify(provenance, null, 2));
