import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App.tsx";

describe("App", () => {
  it("näyttää otsikon ja vastuuvapauslausekkeen", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Osakkeen tunnusluvut");
    expect(screen.getByText(/ei sijoitusneuvontaa/)).toBeInTheDocument();
  });
});
