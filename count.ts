// This script counts the number of documents that would be imported and
// the number of documents that have already been imported.

async function countMetadataFiles(inputFolder: string): Promise<{ json: number; jsonDone: number }> {
  let jsonCount = 0;
  let jsonDoneCount = 0;

  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const fullPath = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await walkDir(fullPath);
      } else if (entry.isFile) {
        if (entry.name === "metadata.json") {
          jsonCount++;
        } else if (entry.name === "metadata.json.done") {
          jsonDoneCount++;
        }
      }
    }
  }

  await walkDir(inputFolder);
  return { json: jsonCount, jsonDone: jsonDoneCount };
}

// Get input folder from environment variable or use default
const inputFolder = Deno.env.get('INPUT_FOLDER') || './input';

// Count the metadata files
const counts = await countMetadataFiles(inputFolder);

console.log(`Number of files to import: ${counts.json}`);
console.log(`Number of files already imported: ${counts.jsonDone}`);
console.log(`Total number of files: ${counts.json + counts.jsonDone}`);

