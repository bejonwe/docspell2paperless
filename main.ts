import "https://deno.land/std/dotenv/load.ts";
import { dirname } from "https://deno.land/std/path/mod.ts";
import * as Docspell from "./interfaces/docspell.ts";
import * as Paperless from "./interfaces/paperless.ts";

// Get paths of the metadata files in the input folder
async function getMetadataPaths(inputFolder: string): Promise<string[]> {
  const metadataPaths: string[] = [];

  // Recursive function to walk through directories
  async function walkDir(dir: string): Promise<void> {
    for await (const entry of Deno.readDir(dir)) {
      const fullPath = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await walkDir(fullPath);
      } else if (entry.isFile && entry.name === "metadata.json") {
        metadataPaths.push(fullPath);
      } 
    }
  }

  await walkDir(inputFolder);
  return metadataPaths;
}

// Get the current document types from the Paperless-ngx API
async function getPaperlessDocumentTypes(): Promise<Paperless.DocumentType[]> {
  const documentTypeResponse = await fetch(`${paperlessApiUrl}/document_types/`, {
    headers: {
      'Authorization': `Token ${paperlessApiToken}`
    }
  });
  const paperlessDocumentType : Paperless.DocumentTypeResult = await documentTypeResponse.json();
  return paperlessDocumentType.results;
}

// Get the current tags from the Paperless-ngx API
async function getPaperlessTags(): Promise<Paperless.Tag[]> {
  const tagResponse = await fetch(`${paperlessApiUrl}/tags/`, {
    headers: {
      'Authorization': `Token ${paperlessApiToken}`
    }
  });
  const paperlessTag : Paperless.TagResult = await tagResponse.json();
  return paperlessTag.results;
}

// Get the attachment paths from the metadata
function getAttachmentPaths(metadata: Docspell.Metadata, metadataPath: string): string[] {
  const folderPath = dirname(metadataPath);
  const attachmentPaths: string[] = [];
  for (const attachment of metadata.attachments) {
    const attachmentPath = `${folderPath}/files/${attachment.name.replace('.converted', '')}`;
    attachmentPaths.push(attachmentPath);
  }
  return attachmentPaths;
}

async function getAttachmentFiles(attachmentPaths: string[]): Promise<Uint8Array[]> {
  const files: Uint8Array[] = [];
  for (const attachmentPath of attachmentPaths) {
    const file = await Deno.readFile(attachmentPath);
    files.push(file);
  }
  return files;
}

// Get the correspondent id from the Paperless-ngx API or create a new correspondent if it doesn't exist
async function getCorrespondentId(correspondent: Docspell.Organisation): Promise<number> {
  const correspondentResponse = await fetch(`${paperlessApiUrl}/correspondents/?name__iexact=${correspondent.name}`, {
    headers: {
      'Authorization': `Token ${paperlessApiToken}`
    }
  });
  const paperlessCorrespondent : Paperless.CorrespondentResult = await correspondentResponse.json();
  if (paperlessCorrespondent.count === 0) {
    // Create a new correspondent
    const createCorrespondentResponse = await fetch(`${paperlessApiUrl}/correspondents/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${paperlessApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: correspondent.name,
        matching_algorithm: 6,
      }),
    });

    if (!createCorrespondentResponse.ok) {
      throw new Error(`Failed to create correspondent: ${createCorrespondentResponse.statusText}`);
    }

    const newCorrespondent : Paperless. Correspondent = await createCorrespondentResponse.json();
    return newCorrespondent.id;
  }
  return paperlessCorrespondent.results[0].id;
}

// Create a new document type in Paperless-ngx
async function createPaperlessDocumentType(name: string): Promise<Paperless.DocumentType> {
  const createDocumentTypeResponse = await fetch(`${paperlessApiUrl}/documents_types/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${paperlessApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      matching_algorithm: 6,
    }),
  });

  if (!createDocumentTypeResponse.ok) {
    throw new Error(`Failed to create document type: ${createDocumentTypeResponse.statusText}`);
  }

  const newDocumentType : Paperless.DocumentTypeResult = await createDocumentTypeResponse.json();
  return newDocumentType.results[0];
}

// Create a new tag in Paperless-ngx
async function createPaperlessTag(name: string): Promise<Paperless.Tag> {
  const createTagResponse = await fetch(`${paperlessApiUrl}/tags/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${paperlessApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      matching_algorithm: 6,
    }),
  }); 

  if (!createTagResponse.ok) {
    throw new Error(`Failed to create tag: ${createTagResponse.statusText}`);
  }

  const newTag : Paperless.TagResult = await createTagResponse.json();
  return newTag.results[0];
}

// Add tags to the document
async function addTags(formData: FormData, tags: Docspell.Tag[]) {
  for (const tag of tags) {
    if (tag.category === docspellDocumentTypeName) {
      const paperlessDocumentType = paperlessDocumentTypes.find(dt => dt.name === tag.name);  
      if (paperlessDocumentType) {
        formData.append('document_type', paperlessDocumentType.id.toString());
      } else {
        const newDocumentType = await createPaperlessDocumentType(tag.name);
        formData.append('document_type', newDocumentType.id.toString());
      }
    } else if (tag.category === docspellCategoryName) {
      const paperlessTag = paperlessTags.find(t => t.name === tag.name);
      if (paperlessTag) {
        formData.append('tags', paperlessTag.id.toString());
      } else {
        const newTag = await createPaperlessTag(tag.name);
        formData.append('tags', newTag.id.toString());
      }
    }
  }
}

// Main function
// Get the environment variables
const inputFolder = Deno.env.get('INPUT_FOLDER') || './input';
const paperlessHost = Deno.env.get('PAPERLESS_HOST') || (() => { throw new Error('PAPERLESS_HOST is not set'); })();
const paperlessPort = Deno.env.get('PAPERLESS_PORT') || (() => { throw new Error('PAPERLESS_PORT is not set'); })();
const paperlessProtocol = Deno.env.get('PAPERLESS_PROTOCOL') || 'http';
const paperlessApiToken = Deno.env.get('PAPERLESS_API_TOKEN') || (() => { throw new Error('PAPERLESS_API_TOKEN is not set'); })();
const paperlessApiUrl = `${paperlessProtocol}://${paperlessHost}:${paperlessPort}/api`;
const paperlessStoragePathId = Deno.env.get('PAPERLESS_STORAGE_PATH_ID') || (() => { throw new Error('PAPERLESS_STORAGE_PATH_ID is not set'); })();

const docspellCategoryName = Deno.env.get('DOCSPELL_CATEGORY_NAME') || (() => { throw new Error('DOCSPELL_CATEGORY_NAME is not set'); })();
const docspellDocumentTypeName = Deno.env.get('DOCSPELL_DOCUMENT_TYPE_NAME') || (() => { throw new Error('DOCSPELL_DOCUMENT_TYPE_NAME is not set'); })();

// Get the metadata paths from the input folder
const metadataPaths = await getMetadataPaths(inputFolder);

// Get the current document types and tags from the Paperless-ngx API
const paperlessDocumentTypes = await getPaperlessDocumentTypes();
const paperlessTags = await getPaperlessTags();

// Process each metadata file
for (const [index, metadataPath] of metadataPaths.entries()) {
  const metadata: Docspell.Metadata = JSON.parse(await Deno.readTextFile(metadataPath));
  
  // Skip the document if it has no attachments
  if (metadata.attachments.length === 0) {
    console.warn(`${index+1}/${metadataPaths.length}: No attachments found for ${metadata.name}`);
    continue;
  }

  // Get the attachment paths and files
  const attachmentPaths = getAttachmentPaths(metadata, metadataPath);
  const attachmentFiles = await getAttachmentFiles(attachmentPaths);
  console.log(`${index+1}/${metadataPaths.length}: Found ${attachmentFiles.length} attachments for ${metadata.name}`);

  // Prepare the form data for the API request
  const formData = new FormData();

  // Add metadata fields to the form data
  formData.append('title', metadata.name);
  formData.append('created', new Date(metadata.date).toISOString());
  formData.append('storage_path', paperlessStoragePathId);
  if (metadata.corr_org) {
    formData.append('correspondent', (await getCorrespondentId(metadata.corr_org)).toString());
  }
  
  if (metadata.tags) {
    await addTags(formData, metadata.tags);
  }


  try {
    // Upload each attachment to Paperless-NGX
    for (const [index, file] of attachmentFiles.entries()) {
      const fileName = metadata.attachments[index].name.replace('.converted', '');
      const blob = new Blob([file], { type: 'application/octet-stream' });
      formData.append('document', blob, fileName);

      const response = await fetch(`${paperlessApiUrl}/documents/post_document/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Token ${paperlessApiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      formData.delete('document');
    }

    console.log(`${index+1}/${metadataPaths.length}: Document uploaded successfully: ${metadata.name}`);
    Deno.rename(metadataPath, `${metadataPath}.done`);
    console.log(`${index+1}/${metadataPaths.length}: Marked ${metadataPath} as done`);
  } catch (error) {
    console.error(`${index+1}/${metadataPaths.length}: Error uploading document ${metadata.name}:`, error);
    break;
  }
}