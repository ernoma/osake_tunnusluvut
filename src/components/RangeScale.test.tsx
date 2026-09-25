import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MetricRange } from "../data/types.ts";
import RangeScale from "./RangeScale.tsx";

const ranges: MetricRange[] = [
  { label: "Alle 1", meaning: "Edullinen.", tone: "good" },
  { label: "Yli 2", meaning: "Kallis.", tone: "warning" },
];

describe("RangeScale", () => {
  it("merkitsee asteikon aina nyrkkisäännöksi", () => {
    const { container } = render(<RangeScale ranges={ranges} note="Vaihtelee aloittain." />);
    expect(container).toHaveTextContent("Nyrkkisääntö. Vaihtelee aloittain.");
  });

  it("ei toista merkintää, jos huomautus alkaa sillä", () => {
    const { container } = render(
      <RangeScale ranges={ranges} note="Nyrkkisääntö. Vaihtelee aloittain." />,
    );
    expect(container).not.toHaveTextContent("Nyrkkisääntö. Nyrkkisääntö.");
    expect(container).toHaveTextContent("Nyrkkisääntö. Vaihtelee aloittain.");
  });

  it("kertoo sävyn myös tekstinä, ei pelkällä värillä", () => {
    render(<RangeScale ranges={ranges} />);
    expect(screen.getByText("(myönteinen)", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("(varoitusmerkki)", { exact: false })).toBeInTheDocument();
  });
});
