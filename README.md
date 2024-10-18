# Docspell to Paperless-ngx Import Script

This script is designed to import files from a Docspell export into Paperless-ngx. It processes the metadata files and their associated attachments that can be exported from Docspell, uploading them to a Paperless-ngx instance.

## Prerequisites

- [Deno](https://deno.land/) installed on your system
- A Paperless-ngx instance set up and running
- Docspell export (metadata.json and associated attachments, see below)
- Environment variables set up (see below)

## Environment Variables

The script requires the following environment variables (copy `.env.example` to `.env` and set the values):

| Environment Variable | Description |
|----------------------|-------------|
| `INPUT_FOLDER` | Path to the folder containing Docspell export files (default: './input') |
| `PAPERLESS_HOST` | Hostname of your Paperless-ngx instance |
| `PAPERLESS_PORT` | Port of your Paperless-ngx instance |
| `PAPERLESS_PROTOCOL` | Protocol to use (http or https, default: 'http') |
| `PAPERLESS_API_TOKEN` | API token for authentication with Paperless-ngx, you can create (or re-create) an API token by opening the "My Profile" link in the user dropdown found in the web UI and clicking the circular arrow button. |
| `PAPERLESS_STORAGE_PATH_ID` | ID of the storage path in Paperless-ngx, if you only have one storage path, you can use `1` |
| `DOCSPELL_CATEGORY_NAME` | Name of the category in Docspell as it is in the `category` field of the `metadata.json` files (sadly this is locale dependent, so you might need to adjust it) |
| `DOCSPELL_DOCUMENT_TYPE_NAME` | Name of the document type in Docspell as it is in the `documentType` field of the `metadata.json` files (same as above) |

## Docspell Export

The Docspell export can be done using the docspell cli as described [here](https://docspell.org/docs/tools/cli/#export-data). Copy the `items` folder to the input folder of this script.

## Usage

To run the script, use the following command:

```bash
deno run --allow-env --allow-read --allow-write --allow-net main.ts
```

## Notes

 - To prevent multiple imports of the same document, the script renames `metadata.json` to `metadata.json.done` after a successful import. If you want to reimport a document, you have to rename it back. You can use the `undo.ts` script for this.
 - The script assumes that the documents are stored in the `input` folder in the same folder structure as they are in the Docspell export. If they are in a different folder structure, you have to adjust the script.
