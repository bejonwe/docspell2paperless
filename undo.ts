// This script restores the original metadata.json files from the metadata.json.done files in the input folder.

async function renameMetadataFiles(inputFolder: string) {
  async function walkDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const fullPath = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await walkDir(fullPath);
      } else if (entry.isFile && entry.name === "metadata.json.done") {
        const oldPath = fullPath;
        const newPath = oldPath.replace(".done", "");
        try {
          await Deno.rename(oldPath, newPath);
          console.log(`Renamed: ${oldPath} -> ${newPath}`);
        } catch (error) {
          console.error(`Error renaming ${oldPath}: ${error}`);
        }
      }
    }
  }

  await walkDir(inputFolder);
}

// Get input folder from environment variable or use default
const inputFolder = Deno.env.get('INPUT_FOLDER') || './input';

// Run the renaming function
await renameMetadataFiles(inputFolder);
console.log("Renaming process completed.");
