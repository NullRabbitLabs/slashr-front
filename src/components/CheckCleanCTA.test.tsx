import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckCleanCTA } from './CheckCleanCTA';

describe('CheckCleanCTA', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the heading and email input', () => {
    render(<CheckCleanCTA walletAddress="abc123" network="solana" />);
    expect(screen.getByText('Want to know if that changes?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notify me/i })).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    render(<CheckCleanCTA walletAddress="abc123" network="solana" />);
    const input = screen.getByPlaceholderText('you@example.com');
    const button = screen.getByRole('button', { name: /notify me/i });

    fireEvent.change(input, { target: { value: 'notanemail' } });
    fireEvent.click(button);

    expect(screen.getByText('enter a valid email')).toBeInTheDocument();
  });

  it('submits with correct payload on valid email', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CheckCleanCTA walletAddress="9WzDXwBb" network="solana" />);
    const input = screen.getByPlaceholderText('you@example.com');
    const button = screen.getByRole('button', { name: /notify me/i });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          integrations: [],
          other: 'check-page: solana/9WzDXwBb',
        }),
      });
    });
  });

  it('shows success message after successful submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    }));

    render(<CheckCleanCTA walletAddress="abc" network="cosmos" />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByText("noted. we'll let you know.")).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'rate limited' }),
    }));

    render(<CheckCleanCTA walletAddress="abc" network="solana" />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByText('rate limited')).toBeInTheDocument();
    });
  });

  it('shows generic error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    render(<CheckCleanCTA walletAddress="abc" network="solana" />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByText('could not reach the server')).toBeInTheDocument();
    });
  });
});
