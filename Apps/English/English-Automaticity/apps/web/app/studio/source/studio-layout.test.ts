import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const filename = new URL("./studio-source.tsx", import.meta.url);
const source = ts.createSourceFile(
  filename.pathname,
  readFileSync(filename, "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);

type Element = ts.JsxElement | ts.JsxSelfClosingElement;

function isElement(node: ts.Node): node is Element {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
}

function tagName(element: Element): string {
  return ts.isJsxElement(element)
    ? element.openingElement.tagName.getText(source)
    : element.tagName.getText(source);
}

function elementsIn(node: ts.Node): Element[] {
  const elements: Element[] = [];
  function visit(current: ts.Node) {
    if (isElement(current)) elements.push(current);
    ts.forEachChild(current, visit);
  }
  visit(node);
  return elements;
}

test("a visible update notice stays inside the main column of the two-column Studio grid", () => {
  const elements = elementsIn(source);
  const page = elements.find(
    (element) =>
      ts.isJsxElement(element) &&
      element.openingElement.attributes.properties.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          attribute.name.getText(source) === "className" &&
          attribute.initializer &&
          ts.isStringLiteral(attribute.initializer) &&
          attribute.initializer.text.split(/\s+/).includes("conversation-page"),
      ),
  );
  if (!page || !ts.isJsxElement(page))
    throw new Error("Studio grid is missing");

  // The notice normally renders nothing, so initial SSR alone misses the
  // waiting-update case. Inspect the JSX hierarchy with the notice present.
  const gridChildren = page.children.filter(isElement);
  expect(gridChildren.map(tagName)).toEqual(["aside", "main"]);
  const main = gridChildren[1];
  if (!main || !ts.isJsxElement(main))
    throw new Error("Studio main is missing");

  const notices = elements.filter(
    (element) => tagName(element) === "AppUpdateNotice",
  );
  expect(notices).toHaveLength(1);
  expect(notices[0]?.parent).toBe(main);
  const mainChildren = main.children.filter(isElement);
  const headerIndex = mainChildren.findIndex(
    (element) => tagName(element) === "header",
  );
  expect(headerIndex).toBeGreaterThanOrEqual(0);
  expect(mainChildren[headerIndex + 1]).toBe(notices[0]);
});
