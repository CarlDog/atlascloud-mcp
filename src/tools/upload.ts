import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { uploadMedia } from "../services/api-client.js";
import { handleError } from "../utils/error-handler.js";

export function registerUploadTools(server: McpServer): void {
  server.registerTool(
    "atlas_upload_media",
    {
      title: "Upload Media File",
      description: `Upload a local image or media file to Atlas Cloud and get a publicly accessible URL.

Use this tool when you need to provide an image URL to image-editing or image-to-video models, but only have a local file path.

Workflow:
  1. Upload the local file with this tool to get a URL
  2. Use the returned URL as the "image_url" parameter in atlas_generate_image, atlas_generate_video, or atlas_quick_generate

Supported file types: images (jpg, png, webp, etc.), videos, and other media files.

IMPORTANT: This upload is intended for temporary use with Atlas Cloud generation tasks only. Uploaded files may be cleaned up periodically. Do NOT use this as a permanent file hosting service. Abuse (e.g., bulk uploads unrelated to generation tasks) may result in API key suspension.

IMPORTANT — transport matters for "local": this MCP server may be running two different ways, and "local" means a different filesystem in each:
  - stdio (the server runs on the same machine as you, e.g. via a local Claude Desktop/Code config): file_path is a path on YOUR machine, e.g. "/path/to/photos/cat.jpg".
  - Streamable HTTP (a remote/containerized deployment, e.g. this fork's Docker/Portainer setup): file_path is a path INSIDE THE SERVER'S CONTAINER, not your own machine. The operator must have already placed the file under the container's mounted upload directory (typically /data/uploads/<name> — see that deployment's README/HOST_UPLOAD_DIR docs) BEFORE calling this tool; passing a path that only exists on your own machine will fail with a filesystem error (e.g. ENOENT), since the server process cannot see your local disk at all in this mode.
  If unsure which transport you're connected over, ask the user, or try the call — a "no such file or directory" error on a path you know exists locally is the signature of this mismatch.

Args:
  - file_path (string, required): Absolute path to the file to upload, resolved on the MCP SERVER's filesystem (see transport note above — NOT necessarily your own machine).

Returns:
  The publicly accessible download URL of the uploaded file.

Examples:
  - stdio: file_path="/path/to/photos/cat.jpg" -> uploads and returns a URL like "https://atlas-img.oss-accelerate-overseas.aliyuncs.com/media/xxx.jpg"
  - Streamable HTTP: file_path="/data/uploads/cat.jpg" (the file was placed under the container's mounted upload directory first) -> same result`,
      inputSchema: {
        file_path: z
          .string()
          .min(1)
          .describe(
            "Absolute path to the file to upload, resolved on the MCP SERVER's filesystem. Over stdio this is your own machine; over Streamable HTTP (a remote/containerized deployment) this must be a path already present inside the server's container (e.g. /data/uploads/<name>) — see that deployment's docs."
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ file_path }) => {
      try {
        const result = await uploadMedia(file_path);

        return {
          content: [
            {
              type: "text",
              text:
                `File uploaded successfully.\n\n` +
                `- **URL**: ${result.data.download_url}\n` +
                `- **Filename**: ${result.data.filename}\n` +
                `- **Size**: ${result.data.size} bytes\n\n` +
                `You can now use this URL as the \`image_url\` parameter in image edit or video generation tools.\n\n` +
                `> **Note**: This URL is for temporary use with Atlas Cloud generation tasks only. It may expire after a period of time. Do not use it as permanent file hosting.`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: handleError(error) }],
        };
      }
    }
  );
}
