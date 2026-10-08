import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SideSelect from "./sideselect";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock("react-chessboard", () => ({ Chessboard: () => <div /> }));

let setPlayerColor;
beforeEach(() => {
  jest.clearAllMocks();
  setPlayerColor = jest.fn();
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});

function settings() {
  return render(
    <SideSelect playerName="Tester" playerColor="w" setPlayerColor={setPlayerColor}
      timeMode="bullet" setTimeMode={jest.fn()} />
  );
}

test("waits for the engine before entering a timed game", async () => {
  let wakeEngine;
  fetch.mockImplementation(() => new Promise(resolve => { wakeEngine = resolve; }));
  settings();
  fireEvent.click(screen.getByRole("button", { name: "Play Black" }));
  expect(screen.getByRole("status")).toHaveTextContent("Your clock has not started");
  expect(screen.getByRole("button", { name: "Play White" })).toBeDisabled();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(setPlayerColor).not.toHaveBeenCalled();
  await act(async () => wakeEngine({ ok: true, json: async () => ({ status: "running" }) }));
  expect(setPlayerColor).toHaveBeenCalledWith("b");
  expect(mockNavigate).toHaveBeenCalledWith("/play");
});

test("keeps the game stopped after a failed start and allows retry", async () => {
  fetch.mockResolvedValueOnce({ ok: false });
  settings();
  fireEvent.click(screen.getByRole("button", { name: "Play White" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("reconnect");
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Play White" })).toBeEnabled();
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: "running" }) });
  fireEvent.click(screen.getByRole("button", { name: "Play White" }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/play"));
});

test("does not start a game on a hosting provider loading page", async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError("HTML response"); } });
  settings();
  fireEvent.click(screen.getByRole("button", { name: "Play White" }));
  await screen.findByRole("alert");
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("times out an unreachable engine and allows another attempt", async () => {
  jest.useFakeTimers();
  fetch.mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")));
  }));
  settings();
  fireEvent.click(screen.getByRole("button", { name: "Play White" }));
  await act(async () => jest.advanceTimersByTime(120000));
  expect(screen.getByRole("alert")).toHaveTextContent("reconnect");
  expect(screen.getByRole("button", { name: "Play White" })).toBeEnabled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("cancels startup when leaving game settings", async () => {
  let wakeEngine;
  let signal;
  fetch.mockImplementation((url, options) => {
    signal = options.signal;
    return new Promise(resolve => { wakeEngine = resolve; });
  });
  const { unmount } = settings();
  fireEvent.click(screen.getByRole("button", { name: "Play White" }));
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => wakeEngine({ ok: true, json: async () => ({ status: "running" }) }));
  expect(mockNavigate).not.toHaveBeenCalled();
});
