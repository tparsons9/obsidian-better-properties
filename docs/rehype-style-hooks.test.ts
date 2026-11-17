import assert from "node:assert/strict";
import { test } from "node:test";
import { rehypeStyleHooks } from "./rehype-style-hooks.ts";

type Tree = Parameters<ReturnType<typeof rehypeStyleHooks>>[0];

test("marks linked headings and code links while preserving unrelated classes", () => {
  const tree: Tree = { type: "root", children: [
    { type: "element", tagName: "h2", properties: { className: ["existing"] }, children: [
      { type: "element", tagName: "a", children: [{ type: "element", tagName: "span", properties: { className: ["icon", "icon-link"] } }] },
    ] },
    { type: "element", tagName: "a", properties: { className: "existing" }, children: [
      { type: "element", tagName: "em", children: [{ type: "element", tagName: "code" }] },
    ] },
  ] };
  const transform = rehypeStyleHooks();
  transform(tree);
  transform(tree);
  assert.deepEqual(tree.children?.[0]?.properties?.className, ["existing", "docs-linked-heading"]);
  assert.deepEqual(tree.children?.[1]?.properties?.className, ["existing", "docs-code-link"]);
});

test("leaves plain headings, ordinary links and excluded code alone", () => {
  const tree: Tree = { type: "root", children: [
    { type: "element", tagName: "h2", children: [{ type: "text" }] },
    { type: "element", tagName: "a", children: [{ type: "text" }] },
    { type: "element", tagName: "a", children: [{ type: "element", tagName: "code", properties: { className: ["not-typography"] } }] },
  ] };
  const before = structuredClone(tree);
  rehypeStyleHooks()(tree);
  assert.deepEqual(tree, before);
});
