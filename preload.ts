// preload.ts
// Dijalankan SEBELUM module apapun di-load via: bun --preload ./preload.ts
// Patch ini harus ada sebelum bson di-import, karena bson memanggil
// isBuildingSnapshot() saat module initialization (bukan saat runtime).

if (typeof globalThis.process !== "undefined") {
  const orig = globalThis.process.getBuiltinModule?.bind(globalThis.process);
  if (orig) {
    // @ts-ignore — patch internal Bun compatibility
    globalThis.process.getBuiltinModule = (id: string) => {
      if (id === "v8") {
        return { startupSnapshot: { isBuildingSnapshot: () => false } };
      }
      return orig(id);
    };
  }
}
