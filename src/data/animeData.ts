export interface EpisodeItem {
  id: string;
  episodeNumber: number;
  title: string;
  image: string;
  duration: string;
  progress?: number; // 0 - 100
  synopsis?: string;
  videoUrl?: string;
}

export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  episodes: EpisodeItem[];
}

export interface AnimeItem {
  id: string;
  title: string;
  fontStyle?: "gothic" | "modern";
  originalTitle?: string;
  image: string;
  backdrop?: string;
  badge?: string;
  genres: string[];
  rating: string;
  starRating?: number;
  year: number;
  seasonsCountText?: string;
  episodes: number;
  duration?: string;
  audio: string[]; // e.g. ["Hindi", "Japanese"]
  synopsis: string;
  progress?: number; // 0 - 100 for continue watching
  currentEpisode?: string;
  trending?: boolean;
  recommended?: boolean;
  seasons?: SeasonInfo[];
}

export const DEMONIC_SLASH_SEASONS: SeasonInfo[] = [
  {
    seasonNumber: 1,
    name: "Season 1",
    episodes: [
      {
        id: "ds-s1-e1",
        episodeNumber: 1,
        title: "Episode 1: Demon Arrives",
        image: "/images/demonic/ep1-nezuko.png",
        duration: "24m",
        progress: 15,
        synopsis: "Tragedy strikes a peaceful mountain home as the forces of darkness emerge, changing Tanjiro and Nezuko's destinies forever.",
      },
      {
        id: "ds-s1-e2",
        episodeNumber: 2,
        title: "Episode 2: Demon Dies",
        image: "/images/demonic/ep2-sabito.png",
        duration: "23m",
        progress: 42,
        synopsis: "Guided by the mysterious masked swordsman Sabito, fierce trial combat pushes the trainees beyond mortal limits.",
      },
      {
        id: "ds-s1-e3",
        episodeNumber: 3,
        title: "Episode 3: Demon Resurrected",
        image: "/images/demonic/ep3-twins.png",
        duration: "24m",
        progress: 68,
        synopsis: "The Ubuyashiki guides welcome the initiates to Mount Fujikasane beneath the eternal blooming wisteria.",
      },
      {
        id: "ds-s1-e4",
        episodeNumber: 4,
        title: "Episode 4: Demon Dies Again",
        image: "/images/demonic/ep4-makomo.png",
        duration: "25m",
        progress: 85,
        synopsis: "Makomo watches with silent hope as hidden secrets of the Water Breathing styles unravel under the twilight moon.",
      },
      {
        id: "ds-s1-e5",
        episodeNumber: 5,
        title: "Episode 5: Demon Resurrected Again",
        image: "/images/demonic/ep5-wisteria.png",
        duration: "24m",
        progress: 10,
        synopsis: "Surviving the grueling Final Selection trials, the newly forged demon slayers step into a perilous wider world.",
      },
    ],
  },
  {
    seasonNumber: 2,
    name: "Season 2",
    episodes: [
      {
        id: "ds-s2-e1",
        episodeNumber: 1,
        title: "Episode 1: Flame Hashira",
        image: "/images/demonic/ep25-card.png",
        duration: "26m",
        progress: 0,
        synopsis: "Boarding the enigmatic Mugen Train alongside the mighty Flame Pillar Kyojuro Rengoku.",
      },
      {
        id: "ds-s2-e2",
        episodeNumber: 2,
        title: "Episode 2: Deep Sleep",
        image: "/images/demonic/kanao-train.png",
        duration: "24m",
        progress: 0,
        synopsis: "Enmu spins an intricate dream trap around the sleeping demon slayers as time ticks away.",
      },
      {
        id: "ds-s2-e3",
        episodeNumber: 3,
        title: "Episode 3: Akaza Strikes",
        image: "/images/demonic/ep1-nezuko.png",
        duration: "25m",
        progress: 0,
        synopsis: "Upper Rank Three Akaza descends with overwhelming destructive martial art force.",
      },
      {
        id: "ds-s2-e4",
        episodeNumber: 4,
        title: "Episode 4: Set Your Heart Ablaze",
        image: "/images/demonic/ep2-sabito.png",
        duration: "27m",
        progress: 0,
        synopsis: "A testament of unyielding human spirit against an immortal demonic foe.",
      },
    ],
  },
  {
    seasonNumber: 3,
    name: "Season 3",
    episodes: [
      {
        id: "ds-s3-e1",
        episodeNumber: 1,
        title: "Episode 1: Entertainment District",
        image: "/images/demonic/ep3-twins.png",
        duration: "45m",
        progress: 0,
        synopsis: "Infiltrating the glittering Yoshiwara district alongside Sound Hashira Tengen Uzui.",
      },
      {
        id: "ds-s3-e2",
        episodeNumber: 2,
        title: "Episode 2: The Sound of War",
        image: "/images/demonic/ep4-makomo.png",
        duration: "24m",
        progress: 0,
        synopsis: "Daki and Gyutaro reveal the deadly double-edged menace of Upper Rank Six.",
      },
    ],
  },
  {
    seasonNumber: 4,
    name: "Season 4",
    episodes: [
      {
        id: "ds-s4-e1",
        episodeNumber: 1,
        title: "Episode 1: Swordsmith Village",
        image: "/images/demonic/ep5-wisteria.png",
        duration: "48m",
        progress: 0,
        synopsis: "Journeying to the secluded sanctuary where the Nichirin blades are forged.",
      },
      {
        id: "ds-s4-e2",
        episodeNumber: 2,
        title: "Episode 2: The Mist and Love",
        image: "/images/demonic/kanao-hero.png",
        duration: "24m",
        progress: 0,
        synopsis: "Muichiro and Mitsuri unleash breathtaking demon slayer marks in combat.",
      },
    ],
  },
  {
    seasonNumber: 5,
    name: "Season 5",
    episodes: [
      {
        id: "ds-s5-e1",
        episodeNumber: 1,
        title: "Episode 1: Hashira Training",
        image: "/images/demonic/kanao-train.png",
        duration: "49m",
        progress: 0,
        synopsis: "The entire Demon Slayer Corps undergoes brutal Hashira training in preparation for the final war.",
      },
    ],
  },
];

export const DEMONIC_SLASH_ANIME: AnimeItem = {
  id: "demonic-slash",
  title: "Demonic Slash",
  fontStyle: "gothic",
  originalTitle: "Kimetsu no Yaiba: Tsuguko",
  image: "/images/demonic/demonic-slash-hero.png",
  backdrop: "/images/demonic/demonic-slash-hero.png",
  badge: "slothui original",
  genres: ["Cartoon", "Action", "Supernatural", "Fantasy"],
  rating: "4.8",
  starRating: 5,
  year: 2028,
  seasonsCountText: "82 Seasons",
  episodes: 82,
  duration: "24m/ep",
  audio: ["Hindi Dub", "Japanese Audio", "English Sub"],
  synopsis:
    "When a small, unsuspecting town becomes the hunting ground for a malevolent entity, a group of unlikely heroes must rise — The Demonic Slash Group.",
  seasons: DEMONIC_SLASH_SEASONS,
};

export const RISE_OF_X_SHOW: AnimeItem = {
  id: "rise-of-x",
  title: "RISE OF X",
  fontStyle: "modern",
  originalTitle: "Star Wars: The Clashing Skies",
  image: "/images/demonic/rise-of-x.jpg",
  backdrop: "/images/demonic/rise-of-x.jpg",
  badge: "slothui original",
  genres: ["TV-MA", "Sci-Fi", "Action", "Adventure"],
  rating: "4.9",
  starRating: 5,
  year: 2028,
  seasonsCountText: "82 Seasons",
  episodes: 82,
  duration: "52m/ep",
  audio: ["Hindi Dub", "English Audio"],
  synopsis:
    "#1 in TV Shows Today • Two force wielders clash across oceanic storms as the fate of an interstellar empire hangs in the balance.",
  seasons: [
    {
      seasonNumber: 1,
      name: "Season 1",
      episodes: [
        {
          id: "rx-s1-e1",
          episodeNumber: 1,
          title: "Episode 1: The Gathering Tempest",
          image: "/images/demonic/rise-of-x.jpg",
          duration: "54m",
          progress: 30,
          synopsis: "The ancient signal resonates across the outer rim galaxies.",
        },
      ],
    },
  ],
};

export const POPULAR_SLOTHUI = [
  {
    id: "detective-pikachu",
    title: "Detective Pikachu",
    image: "/images/demonic/poster-pikachu.jpg",
    badge: "S",
    genres: ["Mystery", "Adventure"],
    rating: "4.7",
    year: 2024,
  },
  {
    id: "planet-of-apes",
    title: "Kingdom of the Planet of the Apes",
    image: "/images/demonic/poster-apes.jpg",
    badge: "S",
    genres: ["Sci-Fi", "Action"],
    rating: "4.8",
    year: 2024,
  },
  {
    id: "the-dark-knight",
    title: "The Dark Knight",
    image: "/images/demonic/poster-batman.jpg",
    badge: "S",
    genres: ["Action", "Thriller"],
    rating: "4.9",
    year: 2024,
  },
];

export const GENRES = [
  "All Genres",
  "Cartoon",
  "Action",
  "Fantasy",
  "Supernatural",
  "Adventure",
  "Romance",
  "Comedy",
  "Sci-Fi",
];

export const TRENDING_ANIME: AnimeItem[] = [
  DEMONIC_SLASH_ANIME,
  {
    id: "jujutsu-kaisen-culling-game",
    title: "Jujutsu Kaisen : Culling Game",
    image: "/images/jujutsu-kaisen.jpg",
    badge: "New Season",
    genres: ["Action", "Fantasy", "Supernatural"],
    rating: "4.9",
    year: 2025,
    episodes: 12,
    audio: ["Hindi Dub", "Japanese Audio"],
    synopsis: "Sorcerers and ancient resurrected curse users collide in Kenjaku's deadly nationwide ritual battle royale across closed barrier colonies.",
    trending: true,
  },
  {
    id: "frieren-beyond-journeys-end",
    title: "Frieren: Beyond Journey's End",
    originalTitle: "Sousou no Frieren",
    image: "/images/frieren-hero.jpg",
    backdrop: "/images/frieren-hero.jpg",
    badge: "Masterpiece",
    genres: ["Fantasy", "Adventure"],
    rating: "4.9",
    year: 2024,
    episodes: 28,
    audio: ["Hindi Dub", "Japanese Audio"],
    synopsis: "An elven mage begins a new journey after the hero's quest ends, confronting time, loss, and memories.",
  },
];

export const CONTINUE_WATCHING_ANIME: AnimeItem[] = [
  {
    id: "demonic-slash-ep1",
    title: "Demonic Slash: Ep 1",
    image: "/images/demonic/ep1-nezuko.png",
    genres: ["Action", "Supernatural"],
    rating: "4.8",
    year: 2028,
    episodes: 82,
    audio: ["Hindi Dub"],
    synopsis: "Tanjiro trains diligently while Nezuko remains asleep.",
    progress: 15,
    currentEpisode: "S1:E1 • 20m left",
  },
  {
    id: "demonic-slash-ep2",
    title: "Demonic Slash: Ep 2",
    image: "/images/demonic/ep2-sabito.png",
    genres: ["Action", "Supernatural"],
    rating: "4.8",
    year: 2028,
    episodes: 82,
    audio: ["Hindi Dub"],
    synopsis: "Sabito challenges Tanjiro with wooden swords.",
    progress: 42,
    currentEpisode: "S1:E2 • 14m left",
  },
  {
    id: "demonic-slash-ep3",
    title: "Demonic Slash: Ep 3",
    image: "/images/demonic/ep3-twins.png",
    genres: ["Action", "Supernatural"],
    rating: "4.8",
    year: 2028,
    episodes: 82,
    audio: ["Hindi Dub"],
    synopsis: "The Ubuyashiki twins address the Final Selection candidates.",
    progress: 68,
    currentEpisode: "S1:E3 • 8m left",
  },
];

export const RECOMMENDED_ANIME: AnimeItem[] = [
  DEMONIC_SLASH_ANIME,
  RISE_OF_X_SHOW,
  {
    id: "solo-leveling",
    title: "Solo Leveling: Arise",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    badge: "Hindi Dub",
    genres: ["Action", "Fantasy"],
    rating: "4.8",
    year: 2024,
    episodes: 12,
    audio: ["Hindi Dub"],
    synopsis: "Sung Jin-woo rises as the world's most formidable shadow monarch.",
  },
];
