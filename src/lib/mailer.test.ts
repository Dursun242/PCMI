import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendPair } from "./mailer";

const opts = {
  subject: "Contact — Jean",
  internalHtml: "<p>interne</p>",
  replyTo: "client@example.com",
  clientSubject: "Bien reçu",
  clientHtml: "<p>client</p>",
};

describe("sendPair", () => {
  beforeEach(() => {
    send.mockReset();
    process.env.RESEND_API_KEY = "re_test";
  });
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  test("échoue quand Resend refuse l'e-mail interne (le SDK ne lève pas d'exception)", async () => {
    // Arrange
    send.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "domain not verified" } });

    // Act + Assert
    await expect(sendPair(opts)).rejects.toThrow("domain not verified");
    expect(send).toHaveBeenCalledTimes(1);
  });

  test("réussit quand seul l'accusé de réception client échoue : la demande est bien arrivée", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});
    send
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "invalid to" } });

    // Act
    const result = await sendPair(opts);

    // Assert
    expect(result).toEqual({ dev: false });
    expect(send).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalled();
  });

  test("réussit aussi quand l'accusé de réception lève une exception réseau", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValueOnce({ data: { id: "1" }, error: null }).mockRejectedValueOnce(new Error("ECONNRESET"));

    await expect(sendPair(opts)).resolves.toEqual({ dev: false });
  });

  test("envoie les deux e-mails quand tout va bien", async () => {
    send.mockResolvedValue({ data: { id: "1" }, error: null });

    const result = await sendPair(opts);

    expect(result).toEqual({ dev: false });
    expect(send).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: "client@example.com" }));
  });

  test("sans clé API, n'envoie rien et le signale", async () => {
    delete process.env.RESEND_API_KEY;
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendPair(opts);

    expect(result).toEqual({ dev: true });
    expect(send).not.toHaveBeenCalled();
  });
});
