import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("wraps the page in an English document body", () => {
    const child = <p>page</p>;

    const tree = RootLayout({ children: child } as LayoutProps<"/">);

    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
    expect(tree.props.children.type).toBe("body");
    expect(tree.props.children.props.children).toBe(child);
  });

  it("names the app in the browser tab", () => {
    expect(metadata.title).toBe("CRM — Digital System Pros");
  });
});
