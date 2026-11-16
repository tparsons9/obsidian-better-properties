# Script imports

```bpjs
async (bp) => {
  const helper = await bp.import("Helper.js");
  await bp.import("Imported.css");
  return `${helper.answer}:${typeof bp.obsidian.Notice}`;
}
```
