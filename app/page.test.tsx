import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import Home from "./page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("generates the image prompt locally without calling the prompt API", async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  render(<Home />);

  await user.type(screen.getByLabelText("موضوع / محصول"), "عطر ورساچه برایت کریستال");
  await user.type(screen.getByLabelText("هدف پست"), "فروش محصول");
  await user.click(screen.getByRole("button", { name: "تولید پرامپت" }));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(await screen.findByText(/عطر ورساچه برایت کریستال/)).toBeInTheDocument();
});

test("uses the selected reference image in the local prompt strategy", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("fetch", vi.fn());

  render(<Home />);

  const file = new File(["image"], "product.jpg", { type: "image/jpeg" });
  await user.upload(screen.getByLabelText("عکس مرجع"), file);
  await user.type(screen.getByLabelText("موضوع / محصول"), "بازی کاتان");
  await user.type(screen.getByLabelText("هدف پست"), "معرفی بازی");
  await user.click(screen.getByRole("button", { name: "تولید پرامپت" }));

  expect(await screen.findByText(/source of truth/)).toBeInTheDocument();
});

test("copies the generated local prompt", async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, "writeText");
  vi.stubGlobal("fetch", vi.fn());

  render(<Home />);

  await user.type(screen.getByLabelText("موضوع / محصول"), "بازی کاتان");
  await user.click(screen.getByRole("button", { name: "تولید پرامپت" }));
  await user.click(
    await screen.findByRole("button", { name: "کپی پرامپت" })
  );

  expect(writeText).toHaveBeenCalledWith(
    expect.stringContaining("بازی کاتان")
  );
});
