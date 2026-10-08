import { fireEvent, render, screen } from '@testing-library/react';
import SignIn from './SignIn';

const mockNav = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNav }), {
  virtual: true,
});

function setup() {
  const setPlayerName = jest.fn();
  render(<SignIn playerName="" setPlayerName={setPlayerName} />);
  return setPlayerName;
}

beforeEach(() => mockNav.mockClear());

test('a one character name is rejected with a message', () => {
  const setPlayerName = setup();
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'a' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/2 to 20/);
  expect(setPlayerName).not.toHaveBeenCalled();
  expect(mockNav).not.toHaveBeenCalled();
});

test('a two character name is accepted', () => {
  const setPlayerName = setup();
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: ' ab ' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  expect(setPlayerName).toHaveBeenCalledWith('ab');
  expect(mockNav).toHaveBeenCalledWith('/side');
});
