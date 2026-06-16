export function sanitizeFileName(text: string): string {
  return text
    .normalize("NFC")
    // Remove characters illegal on Windows/macOS/Linux filesystems
    .replace(/[/\\:*?"<>|]/g, "")
    // Remove control characters
    .replace(/[\x00-\x1f\x7f]/g, "")
    // Collapse whitespace and trim
    .replace(/\s+/g, " ")
    .trim()
    || "OneNote";
}

export async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string)?.split(",")[1]); // Extract Base64 part
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
