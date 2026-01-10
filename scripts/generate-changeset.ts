/*
MIT License

Copyright (c) 2024 Bob Obringer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// pattern: Imperative Shell

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import commitParser, { type Commit } from "conventional-commits-parser";

type UpgradeType = "major" | "minor" | "patch" | "none";

type CommitInfo = {
  sha: string;
  commitMessage: Commit;
  isBreakingChange: boolean;
  upgradeType: UpgradeType;
  changedPackages: string[];
};

// https://github.com/changesets/changesets/issues/862

// Pattern to identify breaking changes in commit messages
const BREAKING_PATTERN = "BREAKING CHANGE";

// Mapping of commit types to corresponding upgrade types
const bumpMap: Record<string, UpgradeType> = {
  feat: "minor",
  fix: "patch",
  refactor: "patch",
  perf: "patch",
};

/**
 * Main function to generate changesets based on version bump commits.
 */
export async function generateChangeset({
  productionBranch = "main",
  integrationBranch = "develop",
  packageFolders = ["packages"],
}: {
  productionBranch?: string;
  integrationBranch?: string;
  packageFolders?: Array<string>;
} = {}): Promise<void> {
  const versionBumpCommits = getVersionBumpCommitsSinceMain({
    productionBranch,
    integrationBranch,
    packageFolders,
  });
  await createChangesets(versionBumpCommits);
}

/**
 * Retrieves version bump commits since the main branch.
 * @returns An array of CommitInfo objects representing version bump commits.
 */
function getVersionBumpCommitsSinceMain({
  productionBranch,
  integrationBranch,
  packageFolders,
}: {
  productionBranch: string;
  integrationBranch: string;
  packageFolders: Array<string>;
}): CommitInfo[] {
  const delimiter = "<!--|COMMIT|-->";
  return execSync(
    `git log --format="%H %B${delimiter}" ${productionBranch}..${integrationBranch}`,
  )
    .toString()
    .trim()
    .split(delimiter)
    .slice(0, -1)
    .map((commitText) => parseCommit({ commitText, packageFolders }))
    .filter(
      ({ upgradeType, changedPackages }) =>
        upgradeType !== null && changedPackages.length > 0,
    );
}

/**
 * Parses a commit message and extracts relevant information.
 * @param commitText The commit message text.
 * @param packagePaths
 * @returns A CommitInfo object containing parsed commit information.
 */
function parseCommit({
  commitText,
  packageFolders,
}: {
  commitText: string;
  packageFolders: Array<string>;
}): CommitInfo {
  const commit = commitText.trim();
  const sha = commit.substring(0, 40);
  const message = commit.substring(40).trim();
  const commitMessage = commitParser.sync(message);
  const isBreakingChange = Boolean(
    commitMessage.body?.includes(BREAKING_PATTERN) ??
      commitMessage.footer?.includes(BREAKING_PATTERN),
  );
  const upgradeType = isBreakingChange
    ? "major"
    : bumpMap[commitMessage.type ?? ""] || "none";
  const changedPackages = getChangedPackagesForCommit({ sha, packageFolders });
  return {
    changedPackages,
    sha,
    commitMessage,
    isBreakingChange,
    upgradeType,
  };
}

/**
 * Retrieves the list of changed packages for a given commit.
 * @param commitSha The SHA of the commit.
 * @returns An array of changed package names.
 */
function getChangedPackagesForCommit({
  sha,
  packageFolders,
}: {
  sha: string;
  packageFolders: Array<string>;
}): string[] {
  // Get the list of changed files in the commit using git diff
  const changedFiles = execSync(
    `git diff --name-only --diff-filter=d ${sha}^ ${sha}`,
  )
    .toString()
    .trim()
    .split("\n")
    .filter((file) => packageFolders.some((p) => file.startsWith(p)));

  const changedPackages = new Set<string>();
  const processedPaths = new Set<string>();

  // Iterate over the changed files and find the corresponding package.json files
  for (const file of changedFiles) {
    let dir = dirname(file);
    while (dir !== ".") {
      if (processedPaths.has(dir)) {
        break;
      }
      const packageJsonPath = join(dir, "package.json");
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        changedPackages.add(packageJson.name);
        processedPaths.add(dir);
        break;
      }
      dir = dirname(dir);
    }
  }

  return [...changedPackages];
}

/**
 * Creates changeset files for the given commits.
 * @param commits An array of CommitInfo objects representing commits.
 */
async function createChangesets(commits: CommitInfo[]): Promise<void> {
  const changesetDir = join(process.cwd(), ".changeset");
  await mkdir(changesetDir, { recursive: true });
  await Promise.all(
    commits.map((commit) => createChangeset(commit, changesetDir)),
  );
}

/**
 * Creates a changeset file for a single commit.
 * @param commit The CommitInfo object representing the commit.
 * @param dir The directory where the changeset file will be created.
 */
async function createChangeset(commit: CommitInfo, dir: string): Promise<void> {
  const changesetContent = getChangesetMarkdown(commit);
  const changesetFile = join(dir, `${commit.sha}.md`);
  try {
    await writeFile(changesetFile, changesetContent, "utf8");
    console.log(`Created changeset: ${changesetFile}`);
  } catch (error) {
    console.error(`Error creating changeset for commit ${commit.sha}:`, error);
  }
}

/**
 * Generates the content of a changeset file in markdown format.
 * @param commit The CommitInfo object representing the commit.
 * @returns The generated markdown content for the changeset file.
 */
function getChangesetMarkdown(commit: CommitInfo): string {
  const {
    upgradeType,
    commitMessage: { subject, body, footer },
  } = commit;

  const packageUpgrades: Record<string, UpgradeType> = {};
  for (const packageName of commit.changedPackages) {
    packageUpgrades[packageName] = upgradeType;
  }

  const headerContent = Object.entries(packageUpgrades)
    .filter(([_, upgradeType]) => upgradeType !== null)
    .map(([packageName, upgradeType]) => `"${packageName}": ${upgradeType}`)
    .join("\n");

  const message = [subject, body, footer].filter(Boolean).join("\n\n");

  return `---
${headerContent}
---
${message}
`;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  productionBranch: string;
  integrationBranch: string;
  packageFolders: Array<string>;
} {
  let productionBranch = "main";
  let integrationBranch = "develop";
  const packageFolders = ["packages"];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "-p":
      case "--production":
        productionBranch = args[++i] ?? "main";
        break;
      case "-i":
      case "--integration":
        integrationBranch = args[++i] ?? "develop";
        break;
      case "--help":
      case "-h":
        console.log(`
generate-changeset - Generate changesets from conventional commits

Usage: generate-changeset [options]

Options:
  -p, --production <branch>    Production branch (default: main)
  -i, --integration <branch>   Integration branch (default: develop)
  -h, --help                   Show this help message
`);
        process.exit(0);
    }
  }

  return { productionBranch, integrationBranch, packageFolders };
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await generateChangeset(args);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
