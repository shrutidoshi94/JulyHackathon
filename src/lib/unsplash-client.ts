const FALLBACK_IMAGES: Record<string, string> = {
  Austin:
    'https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1600&q=80',
  Asheville:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
  'Mexico City':
    'https://images.unsplash.com/photo-1518659526054-0331677c4167?auto=format&fit=crop&w=1600&q=80',
  Miami:
    'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&w=1600&q=80',
  'San Diego':
    'https://images.unsplash.com/photo-1534190239940-9ba8944ea503?auto=format&fit=crop&w=1600&q=80',
  'New Orleans':
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
  Sedona:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
  Portland:
    'https://images.unsplash.com/photo-1555400082-8c5cd7198048?auto=format&fit=crop&w=1600&q=80',
  Cancún:
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=80',
  default:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80',
};

export async function fetchDestinationImage(
  destination: string,
): Promise<{ url: string; credit?: string }> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return {
      url: FALLBACK_IMAGES[destination] || FALLBACK_IMAGES.default,
      credit: 'Unsplash',
    };
  }

  try {
    const query = encodeURIComponent(`${destination} travel landmark`);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) {
      return {
        url: FALLBACK_IMAGES[destination] || FALLBACK_IMAGES.default,
      };
    }

    const data = (await res.json()) as {
      results?: Array<{
        urls?: { regular?: string; full?: string };
        user?: { name?: string };
      }>;
    };

    const photo = data.results?.[0];
    if (!photo?.urls?.regular) {
      return {
        url: FALLBACK_IMAGES[destination] || FALLBACK_IMAGES.default,
      };
    }

    return {
      url: photo.urls.regular,
      credit: photo.user?.name,
    };
  } catch {
    return {
      url: FALLBACK_IMAGES[destination] || FALLBACK_IMAGES.default,
    };
  }
}

export async function enrichOptionsWithImages<
  T extends { destination: string; imageUrl: string; imageCredit?: string },
>(options: T[]): Promise<T[]> {
  return Promise.all(
    options.map(async (opt) => {
      const image = await fetchDestinationImage(opt.destination);
      return { ...opt, imageUrl: image.url, imageCredit: image.credit };
    }),
  );
}
