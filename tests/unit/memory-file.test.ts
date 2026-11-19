import { describe, expect, it } from "vitest";
import { AlbumFileError, albumFileName, albumFromJson, albumToJson } from "@/lib/memory-file";
import { CAPTION_MAX, type Memory } from "@/lib/memories";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 0xff, 0xd9]);

function memory(over: Partial<Memory> = {}): Memory {
  return {
    id: "3f2b1c4d-0000-4000-8000-000000000001",
    challengeId: "karnak-cartouche",
    destination: "luxor",
    visitDate: "2026-11-02",
    caption: "Found the cartouche",
    story: "Second column on the left.",
    template: "papyrus",
    arabic: true,
    photo: new Blob([JPEG], { type: "image/jpeg" }),
    createdAt: "2026-11-02T10:00:00.000Z",
    updatedAt: "2026-11-02T10:05:00.000Z",
    backedUpAt: "2026-11-03T00:00:00.000Z",
    ...over,
  };
}

async function bytes(b: Blob) {
  return new Uint8Array(await new Promise<ArrayBuffer>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as ArrayBuffer);
    r.readAsArrayBuffer(b);
  }));
}

describe("album backup file", () => {
  it("round-trips memories, photos included", async () => {
    const text = await albumToJson([memory(), memory({ id: "3f2b1c4d-0000-4000-8000-000000000002", photo: null, template: "nile" })]);
    const back = albumFromJson(text);
    expect(back).toHaveLength(2);
    expect(back[0]).toMatchObject({ challengeId: "karnak-cartouche", caption: "Found the cartouche", template: "papyrus", arabic: true, backedUpAt: null });
    expect(Array.from(await bytes(back[0].photo!))).toEqual(Array.from(JPEG));
    expect(back[1].photo).toBeNull();
  });

  it("does not put the cloud-backup flag in the file", async () => {
    expect(await albumToJson([memory()])).not.toContain("backedUpAt");
  });

  it("rejects files that aren't album backups", () => {
    expect(() => albumFromJson("not json")).toThrow(AlbumFileError);
    expect(() => albumFromJson(JSON.stringify({ memories: [] }))).toThrow(AlbumFileError);
    expect(() => albumFromJson(JSON.stringify({ format: "discover-egypt-album", version: 99, memories: [] }))).toThrow(/newer version/);
  });

  it("skips memories with photos that aren't JPEGs, and cleans every field", () => {
    const svg = btoa("<svg onload=alert(1)></svg>");
    const text = JSON.stringify({
      format: "discover-egypt-album",
      version: 1,
      memories: [
        { id: "aaaaaaaa-1", photo: `data:image/svg+xml;base64,${svg}` },
        { id: "aaaaaaaa-2", photo: `data:image/jpeg;base64,${svg}` },
        { id: "../../etc", caption: "bad id" },
        {
          id: "aaaaaaaa-3",
          photo: null,
          caption: "x".repeat(CAPTION_MAX + 50),
          template: "<script>",
          destination: "Luxor <b>",
          visitDate: "yesterday",
          arabic: "yes",
          challengeId: 42,
        },
      ],
    });
    const back = albumFromJson(text);
    expect(back.map((m) => m.id)).toEqual(["aaaaaaaa-3"]);
    expect(back[0]).toMatchObject({ template: "golden-hour", destination: null, visitDate: null, arabic: false, challengeId: null });
    expect(back[0].caption).toHaveLength(CAPTION_MAX);
  });

  it("names the file with the date", () => {
    expect(albumFileName(new Date("2026-11-19T08:00:00Z"))).toBe("discover-egypt-album-2026-11-19.json");
  });
});
