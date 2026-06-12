import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { processFileUpload, UploadCallbacks } from "./upload-service";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn()
  }
}));

const mockedAxios = vi.mocked(axios, true);

const makeCallbacks = (): UploadCallbacks => ({
  onProgress: vi.fn(),
  onStatus: vi.fn()
});

const file = new File(["data"], "photo.png", { type: "image/png" });

describe("processFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the presign flow when the external service works", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        uploads: [
          {
            fileName: "photo.png",
            filePath: "user/photo.png",
            contentType: "image/png",
            presignedUrl: "https://storage.example.com/put",
            url: "https://cdn.example.com/photo.png"
          }
        ]
      }
    });
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });

    const callbacks = makeCallbacks();
    const result = await processFileUpload("u1", file, callbacks);

    expect(result.method).toBe("direct");
    expect(result.metadata.uploadedUrl).toBe("https://cdn.example.com/photo.png");
    expect(callbacks.onStatus).toHaveBeenCalledWith("u1", "uploaded");
  });

  it("falls back to local upload when the presign service is down", async () => {
    // presign call fails (external service 500)
    mockedAxios.post.mockRejectedValueOnce(new Error("Request failed with status code 500"));
    // local upload succeeds
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        fileName: "photo.png",
        filePath: "/uploads/photo-abc123.png",
        url: "/uploads/photo-abc123.png",
        contentType: "image/png"
      }
    });

    const callbacks = makeCallbacks();
    const result = await processFileUpload("u2", file, callbacks);

    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      "/api/uploads/local",
      expect.any(FormData),
      expect.anything()
    );
    expect(result.method).toBe("local");
    expect(result.metadata.uploadedUrl).toBe("/uploads/photo-abc123.png");
    expect(result.type).toBe("image");
    expect(callbacks.onStatus).toHaveBeenCalledWith("u2", "uploaded");
    expect(callbacks.onStatus).not.toHaveBeenCalledWith(
      "u2",
      "failed",
      expect.anything()
    );
  });

  it("falls back to local upload when the presigned PUT fails", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        uploads: [
          {
            fileName: "photo.png",
            filePath: "user/photo.png",
            contentType: "image/png",
            presignedUrl: "https://storage.example.com/put",
            url: "https://cdn.example.com/photo.png"
          }
        ]
      }
    });
    // PUT returns an error status (validateStatus lets it through)
    mockedAxios.put.mockResolvedValueOnce({ status: 403 });
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        fileName: "photo.png",
        filePath: "/uploads/photo-def456.png",
        url: "/uploads/photo-def456.png",
        contentType: "image/png"
      }
    });

    const result = await processFileUpload("u3", file, makeCallbacks());
    expect(result.method).toBe("local");
  });

  it("reports failure when both presign and local upload fail", async () => {
    mockedAxios.post.mockRejectedValue(new Error("network down"));

    const callbacks = makeCallbacks();
    await expect(processFileUpload("u4", file, callbacks)).rejects.toThrow();
    expect(callbacks.onStatus).toHaveBeenCalledWith(
      "u4",
      "failed",
      "network down"
    );
  });
});
