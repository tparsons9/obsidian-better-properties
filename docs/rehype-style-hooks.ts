// Add the parent state at compile time rather than requiring relational CSS selectors.
interface StyleNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: StyleNode[];
}

function classes(node: StyleNode): string[] {
  const value = node.properties?.className;
  return Array.isArray(value) ? value.map(String) : typeof value === "string" ? value.split(/\s+/) : [];
}

function contains(node: StyleNode, match: (child: StyleNode) => boolean): boolean {
  return node.children?.some((child) => match(child) || contains(child, match)) ?? false;
}

function addClass(node: StyleNode, name: string) {
  node.properties ??= {};
  node.properties.className = [...new Set([...classes(node), name])];
}

export function rehypeStyleHooks() {
  return (tree: StyleNode) => {
    const visit = (node: StyleNode) => {
      if (/^h[1-6]$/.test(node.tagName ?? "") && contains(node, (child) => classes(child).includes("icon-link") && classes(child).includes("icon"))) {
        addClass(node, "docs-linked-heading");
      }
      if (node.tagName === "a" && contains(node, (child) => child.tagName === "code" && !classes(child).includes("not-typography"))) {
        addClass(node, "docs-code-link");
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
