import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonthlyProductionChart } from "@/components/solar/MonthlyProductionChart";

const values = Array.from({ length: 12 }, (_, index) => ({
  month: index + 1,
  productionKwh: index === 6 ? 758 : 100 + index * 25,
}));

describe("MonthlyProductionChart", () => {
  it("selects the peak month initially and exposes every value", () => {
    render(<MonthlyProductionChart values={values} />);
    expect(screen.getByTestId("selected-month-summary")).toHaveTextContent("Iulie · 758 kWh");
    expect(screen.getAllByRole("button")).toHaveLength(12);
    expect(screen.getByRole("button", { name: "Iulie: 758 kWh" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps a tapped or focused month visible", () => {
    render(<MonthlyProductionChart values={values} />);
    const april = screen.getByRole("button", { name: "Aprilie: 175 kWh" });
    fireEvent.click(april);
    expect(screen.getByTestId("selected-month-summary")).toHaveTextContent("Aprilie · 175 kWh");
    fireEvent.keyDown(april, { key: "ArrowRight" });
    expect(screen.getByTestId("selected-month-summary")).toHaveTextContent("Mai · 200 kWh");
  });
});
