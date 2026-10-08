import { fireEvent, render, screen } from '@testing-library/react';
import Play from './Play';

// jest 27 in react-scripts cannot resolve react-router-dom 7 (exports map)
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), {
  virtual: true,
});

function setViewport(w, h) {
  window.innerWidth = w;
  window.innerHeight = h;
}

function renderPlay() {
  return render(<Play playerName="Tester" playerColor="w" timeMode="rapid" />);
}

test('side panel holds moves, resign and captured pieces', () => {
  setViewport(1440, 900);
  renderPlay();
  expect(screen.getByRole('button', { name: /resign/i })).toBeInTheDocument();
  expect(screen.getByLabelText('Moves')).toHaveTextContent('Captured (White)');
  expect(screen.getByLabelText('Moves')).toHaveTextContent('Captured (Black)');
});

test('board size follows viewport height on desktop and width on phones', () => {
  setViewport(1440, 900);
  const { container, unmount } = renderPlay();
  expect(container.querySelector('.playGrid').style.getPropertyValue('--boardW')).toBe('730px');
  unmount();

  setViewport(390, 844);
  const phone = renderPlay();
  expect(phone.container.querySelector('.playGrid').style.getPropertyValue('--boardW')).toBe('358px');
});

test('game over dim is rendered inside the board wrapper after resigning', () => {
  setViewport(1440, 900);
  const { container } = renderPlay();
  expect(container.querySelector('.gameOverDim')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /resign/i }));
  expect(container.querySelector('.boardWrap > .gameOverDim')).not.toBeNull();
  expect(screen.getByRole('dialog', { name: 'Result' })).toBeInTheDocument();
});
