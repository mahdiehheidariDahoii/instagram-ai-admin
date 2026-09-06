import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import Home from "./page";


afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("shows regenerate button after an image is generated", async () => {
  const user = userEvent.setup();

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        prompt: "test prompt",
        imageUrl: null,
        imageBase64: "abc123",
        mediaType: "image/png",
      }),
    })
  );

  render(<Home />);

  await user.click(
    screen.getByRole("button", {
      name: "تولید تصویر",
    })
  );

  expect(
    await screen.findByRole("button", {
      name: "یک تصویر دیگر با همین اطلاعات",
    })
  ).toBeInTheDocument();
});

test("generates another image when regenerate button is clicked", async () => {
  const user = userEvent.setup();

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      prompt: "test prompt",
      imageUrl: null,
      imageBase64: "abc123",
      mediaType: "image/png",
    }),
  });

  vi.stubGlobal("fetch", fetchMock);

  render(<Home />);

  await user.click(
    screen.getByRole("button", {
      name: "تولید تصویر",
    })
  );

  const regenerateButton = await screen.findByRole("button", {
    name: "یک تصویر دیگر با همین اطلاعات",
  });

  await user.click(regenerateButton);

  expect(fetchMock).toHaveBeenCalledTimes(2);
});

