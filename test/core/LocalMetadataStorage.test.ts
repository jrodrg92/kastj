import { expect } from "chai";
import { LocalMetadataStorage } from "../../core/adapters/LocalMetadataStorage";
import type { ProposalMetadata } from "../../core/ports/MetadataStorage";

describe("LocalMetadataStorage", function () {
    let storage: LocalMetadataStorage;

    beforeEach(function () {
        storage = new LocalMetadataStorage();
    });

    it("stores and resolves metadata round-trip", async function () {
        const input: ProposalMetadata = {
            title: "Fund a community tool",
            description: "Building a block explorer for Kaspa.",
        };

        const uri = await storage.store(input);
        expect(uri).to.match(/^local:\/\//);

        const resolved = await storage.resolve(uri);
        expect(resolved).to.not.be.null;
        expect(resolved!.title).to.equal(input.title);
        expect(resolved!.description).to.equal(input.description);
    });

    it("preserves optional fields", async function () {
        const input: ProposalMetadata = {
            title: "Test",
            description: "Desc",
            imageUrl: "https://example.com/image.png",
            externalUrl: "https://example.com",
        };

        const uri = await storage.store(input);
        const resolved = await storage.resolve(uri);

        expect(resolved!.imageUrl).to.equal(input.imageUrl);
        expect(resolved!.externalUrl).to.equal(input.externalUrl);
    });

    it("handles special characters in metadata", async function () {
        const input: ProposalMetadata = {
            title: "Propuesta con acentos: áéíóú ñ",
            description: "Emoji: 🎉 & symbols <script>alert('xss')</script>",
        };

        const uri = await storage.store(input);
        const resolved = await storage.resolve(uri);

        expect(resolved!.title).to.equal(input.title);
        expect(resolved!.description).to.equal(input.description);
    });

    it("returns null for unknown URI schemes", async function () {
        const result = await storage.resolve("ipfs://QmSomeHash");
        expect(result).to.be.null;
    });

    it("returns null for invalid JSON", async function () {
        const result = await storage.resolve("local://not-valid-json");
        expect(result).to.be.null;
    });

    it("handles supabase:// scheme", async function () {
        const input: ProposalMetadata = {
            title: "Supabase stored",
            description: "Via supabase scheme",
        };

        const uri = await storage.store(input);
        // Simulate supabase scheme by replacing prefix
        const supabaseUri = uri.replace("local://", "supabase://");
        const resolved = await storage.resolve(supabaseUri);

        expect(resolved).to.not.be.null;
        expect(resolved!.title).to.equal(input.title);
    });
});
