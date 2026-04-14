// @ts-nocheck — satori virtual DOM types don't match React.ReactNode; CF Pages types not in tsconfig
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

interface Env {
  API_ORIGIN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
}

const NETWORK_META: Record<string, { ticker: string; color: string; name: string }> = {
  solana:   { ticker: 'SOL',  color: '#14F195', name: 'Solana' },
  ethereum: { ticker: 'ETH',  color: '#849DFF', name: 'Ethereum' },
  cosmos:   { ticker: 'ATOM', color: '#A5A7C4', name: 'Cosmos Hub' },
  sui:      { ticker: 'SUI',  color: '#4DA2FF', name: 'Sui' },
  polkadot: { ticker: 'DOT',  color: '#E6007A', name: 'Polkadot' },
};

let wasmInitialized = false;

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-4);
}

function formatStake(stake: number | null, token: string | null): string {
  if (stake == null || token == null) return '';
  if (stake >= 1_000_000) return `${(stake / 1_000_000).toFixed(1)}M ${token}`;
  if (stake >= 1_000) return `${(stake / 1_000).toFixed(0)}K ${token}`;
  return `${stake.toFixed(0)} ${token}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const network = context.params.network as string;
  const rawAddress = context.params.address as string;
  const address = rawAddress.replace(/\.png$/, '');

  const meta = NETWORK_META[network];
  if (!meta) {
    return new Response('Unknown network', { status: 404 });
  }

  // Fetch validator data
  let moniker = '';
  let eventCount = 0;
  let stake: number | null = null;
  let stakeToken: string | null = null;

  try {
    const url = `${context.env.API_ORIGIN}/v1/validators/${encodeURIComponent(network)}/${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        'CF-Access-Client-Id': context.env.CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': context.env.CF_ACCESS_CLIENT_SECRET,
        Accept: 'application/json',
      },
    });
    if (res.ok) {
      const json = (await res.json()) as {
        data: {
          moniker: string | null;
          events: { id: number }[];
          stake: number | null;
          stake_token: string | null;
        };
      };
      moniker = json.data.moniker?.trim() || '';
      eventCount = json.data.events.length;
      stake = json.data.stake;
      stakeToken = json.data.stake_token;
    }
  } catch {
    // continue with defaults
  }

  const displayName = moniker || truncateAddress(address);
  const stakeStr = formatStake(stake, stakeToken);

  // Load fonts
  const origin = new URL(context.request.url).origin;
  const [spaceGrotesk, jetbrainsMono, inter] = await Promise.all([
    fetch(`${origin}/fonts/space-grotesk-latin-700-normal.woff`).then(r => r.arrayBuffer()),
    fetch(`${origin}/fonts/jetbrains-mono-latin-600-normal.woff`).then(r => r.arrayBuffer()),
    fetch(`${origin}/fonts/inter-latin-500-normal.woff`).then(r => r.arrayBuffer()),
  ]);

  // Render SVG with satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0b',
          padding: '48px 60px',
        },
        children: [
          // Top row: brand + network
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 20,
                      fontFamily: 'JetBrains Mono',
                      color: '#14f195',
                      letterSpacing: '-0.02em',
                    },
                    children: 'slashr.dev',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: meta.color,
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 18,
                            fontFamily: 'JetBrains Mono',
                            color: 'rgba(255,255,255,0.6)',
                            letterSpacing: '0.06em',
                          },
                          children: meta.ticker,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // Middle: validator info
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: moniker ? 52 : 36,
                      fontFamily: moniker ? 'Space Grotesk' : 'JetBrains Mono',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.87)',
                      letterSpacing: moniker ? '-0.03em' : '0',
                      lineHeight: 1.1,
                    },
                    children: displayName,
                  },
                },
                ...(moniker
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 16,
                            fontFamily: 'JetBrains Mono',
                            color: 'rgba(255,255,255,0.3)',
                          },
                          children: truncateAddress(address),
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          // Bottom: stats
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                gap: 24,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 48,
                            fontFamily: 'JetBrains Mono',
                            fontWeight: 600,
                            color: eventCount > 0 ? '#FF4545' : '#14f195',
                          },
                          children: String(eventCount),
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 20,
                            fontFamily: 'Inter',
                            color: 'rgba(255,255,255,0.5)',
                          },
                          children: eventCount === 1 ? 'incident' : 'incidents',
                        },
                      },
                    ],
                  },
                },
                ...(stakeStr
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 20,
                            fontFamily: 'Inter',
                            color: 'rgba(255,255,255,0.3)',
                          },
                          children: '\u00b7',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 20,
                            fontFamily: 'JetBrains Mono',
                            color: 'rgba(255,255,255,0.5)',
                          },
                          children: `${stakeStr} at stake`,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Space Grotesk', data: spaceGrotesk, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: jetbrainsMono, weight: 600, style: 'normal' },
        { name: 'Inter', data: inter, weight: 500, style: 'normal' },
      ],
    },
  );

  // Convert SVG to PNG
  if (!wasmInitialized) {
    const wasmBuf = await fetch(`${origin}/fonts/resvg.wasm`).then(r => r.arrayBuffer());
    await initWasm(wasmBuf);
    wasmInitialized = true;
  }
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
