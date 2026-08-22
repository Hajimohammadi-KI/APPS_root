export async function GET() {
  return Response.json(
    {
      service: "research-pdf-studio",
      ready: true,
      contractVersion: 1,
      version: process.env.PDF_READER_RELEASE_VERSION?.trim() || "development",
      storageBoundary: "browser-local",
      localPdfImport: "loopback-only",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
