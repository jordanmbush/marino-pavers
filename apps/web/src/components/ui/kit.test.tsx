import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";
import { Select } from "./Select";
import { buttonClasses } from "./button-classes";

/**
 * The kit's accessibility contract, checked as markup. No DOM: static render
 * is enough to prove the attributes are there.
 */
describe("Button", () => {
  it("defaults to type=button so it can't submit by accident", () => {
    expect(renderToStaticMarkup(<Button>Go</Button>)).toContain(
      'type="button"',
    );
  });

  it("bare drops every visual class but keeps a focus ring", () => {
    const classes = buttonClasses({ variant: "bare", class: "x" });
    expect(classes).not.toContain("bg-");
    expect(classes).toContain("focus-visible:outline-cherokee");
    expect(classes).toContain("x");
  });

  it("later classes win", () => {
    expect(buttonClasses({ class: "px-10" })).toMatch(/px-10/);
    expect(buttonClasses({ class: "px-10" })).not.toMatch(/px-6/);
  });
});

describe("Field", () => {
  it("wires the label and announces the error", () => {
    const html = renderToStaticMarkup(
      <Field label="Email" htmlFor="email" error="Required">
        <Input id="email" />
      </Field>,
    );
    expect(html).toContain('for="email"');
    expect(html).toContain('id="email"');
    expect(html).toContain('role="alert"');
  });
});

describe("Select", () => {
  it("renders every option", () => {
    const html = renderToStaticMarkup(
      <Select
        aria-label="c"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    expect(html).toContain('value="a"');
    expect(html).toContain(">B<");
  });
});
