import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const tmpRoot = path.join(tmpdir(), `rve-upload-test-${Date.now()}`);

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(tmpRoot, { recursive: true, force: true });
});

const postFile = async (file: File | string) => {
  const formData = new FormData();
  formData.append("file", file);
  const request = new Request("http://localhost/api/uploads/local", {
    method: "POST",
    body: formData
  });
  return POST(request as any);
};

describe("POST /api/uploads/local", () => {
  it("writes the file to public/uploads and returns its URL", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);

    const response = await postFile(
      new File(["hello"], "my photo (1).png", { type: "image/png" })
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.fileName).toBe("my photo (1).png");
    expect(data.contentType).toBe("image/png");
    // sanitized name + random suffix, same extension
    expect(data.url).toMatch(/^\/uploads\/my_photo__1_-[\w-]{8}\.png$/);

    const writtenPath = path.join(tmpRoot, "public", data.url);
    expect(existsSync(writtenPath)).toBe(true);
    expect(readFileSync(writtenPath, "utf-8")).toBe("hello");
  });

  it("rejects requests without a file", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);

    const response = await postFile("not-a-file");
    expect(response.status).toBe(400);
  });
});
