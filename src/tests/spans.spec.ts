/**
 * @jest-environment jsdom
 */
import { newLRParser } from "../factory";
import { PTNode } from "../parser";
import * as dsl from "../dsl";
import { Parser as LLParser, ParseTable } from "../ll";
import Samples from "./samples";

const json = `
      %token NUMBER /-?\\d+/
      %skip /[ \\t\\n\\f\\r]+/

      Value -> List | NUMBER ;
      List -> "[" [ Value ( "," Value ) * ] "]" ;
`;

function newLLParser(grammar: string): LLParser {
  const loader = new dsl.Loader(grammar);
  const parser = new LLParser(new ParseTable(loader.grammar.augmentStartSymbol()));
  const tokenizer = loader.generatedTokenizer;
  parser.setTokenizer(tokenizer.next.bind(tokenizer));
  return parser;
}

/** Every node in the tree, depth first. */
function nodes(root: PTNode | null): PTNode[] {
  if (!root) return [];
  return [root, ...root.children.flatMap((c) => nodes(c))];
}

describe("source spans on parse tree nodes", () => {
  const [lr] = newLRParser(json, { type: "slr" });

  test("a terminal keeps the token it was shifted from", () => {
    const input = "[1, 22]";
    const twentyTwo = nodes(lr.parse(input)).find((n) => n.isTerminal && n.value == "22")!;
    expect(twentyTwo.token).not.toBeNull();
    expect(twentyTwo.token!.value).toBe("22");
    expect([twentyTwo.start, twentyTwo.end]).toEqual([4, 6]);
    expect(input.substring(twentyTwo.start!, twentyTwo.end!)).toBe("22");
  });

  test("a non-terminal spans its first to its last token", () => {
    const input = "  [1, 22]";
    const list = nodes(lr.parse(input)).find((n) => n.sym.label == "List")!;
    expect([list.start, list.end]).toEqual([2, 9]);
  });

  test("an empty reduction covers no source", () => {
    const empty = nodes(lr.parse("[]")).filter((n) => !n.isTerminal && n.children.length == 0);
    expect(empty.length).toBeGreaterThan(0);
    for (const n of empty) expect([n.start, n.end]).toEqual([null, null]);
  });

  test("rule handlers see the spans of the children they reduce", () => {
    const seen: [number | null, number | null][] = [];
    lr.parse("[1, 22]", {
      onReduction: (node: PTNode) => {
        if (node.sym.label == "List") seen.push([node.start, node.end]);
        return node;
      },
    });
    expect(seen).toEqual([[0, 7]]);
  });

  test("the LL parser keeps tokens on terminals too", () => {
    const ll = newLLParser(Samples.expr2);
    const input = "A+B*C";
    const terminals = nodes(ll.parse(input)).filter((n) => n.isTerminal && n.token);
    expect(terminals.map((n) => [n.value, n.start, n.end])).toEqual([
      ["A", 0, 1],
      ["+", 1, 2],
      ["B", 2, 3],
      ["*", 3, 4],
      ["C", 4, 5],
    ]);
  });
});
