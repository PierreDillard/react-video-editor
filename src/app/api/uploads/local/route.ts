import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

// Local-disk upload fallback, used when the external presign service is down.
// Files are served by Next.js from public/uploads (gitignored).
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "file field is required" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name);
    const base = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 64);
    const fileName = `${base}-${nanoid(8)}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(
      path.join(uploadsDir, fileName),
      Buffer.from(await file.arrayBuffer())
    );

    const url = `/uploads/${fileName}`;
    return NextResponse.json({
      fileName: file.name,
      filePath: url,
      url,
      contentType: file.type || "application/octet-stream"
    });
  } catch (error) {
    console.error("Error in local upload route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
