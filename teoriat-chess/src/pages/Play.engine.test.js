import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Play from './Play';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), {
  virtual: true,
});

// stand-in for the board: one button plays e2-e4
jest.mock('react-chessboard', () => ({
  Chessboard: (props) => (
    <button type="button" onClick={() => props.onPieceDrop('e2', 'e4', 'wP')}>
      play e4
    </button>
  ),
}));

function renderPlay() {
  return render(<Play playerName="Tester" playerColor="w" timeMode="rapid" />);
}

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body };
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

test('a failed engine request shows a message and retry gets the move', async () => {
  global.fetch = jest
    .fn()
    .mockRejectedValueOnce(new Error('network down'))
    .mockResolvedValueOnce(jsonResponse({ move: 'e7e5' }));
  renderPlay();

  fireEvent.click(screen.getByText('play e4'));
  expect(await screen.findByRole('alert')).toHaveTextContent(/engine did not answer/i);

  fireEvent.click(screen.getByRole('button', { name: /retry/i }));
  await waitFor(() =>
    expect(screen.getByLabelText('Moves')).toHaveTextContent('e5')
  );
  expect(screen.queryByRole('alert')).toBeNull();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('an http error from the engine is treated as a failure too', async () => {
  global.fetch = jest.fn().mockResolvedValue(jsonResponse({}, false));
  renderPlay();

  fireEvent.click(screen.getByText('play e4'));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

test('a late engine reply after resigning is ignored', async () => {
  let resolveMove;
  global.fetch = jest.fn((url) =>
    String(url).endsWith('/move')
      ? new Promise((resolve) => {
          resolveMove = resolve;
        })
      : Promise.resolve(jsonResponse({}))
  );
  renderPlay();

  fireEvent.click(screen.getByText('play e4'));
  fireEvent.click(screen.getByRole('button', { name: /resign/i }));
  expect(await screen.findByText('Black wins.')).toBeInTheDocument();

  await act(async () => {
    resolveMove(jsonResponse({ move: 'e7e5' }));
  });

  expect(screen.getByText('Black wins.')).toBeInTheDocument();
  expect(screen.getByLabelText('Moves')).not.toHaveTextContent('e5');
});
