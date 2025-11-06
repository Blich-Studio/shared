export interface Game {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  screenshots?: string[];
  trailerUrl?: string;
  status: 'in-development' | 'released' | 'early-access';
  platforms?: string[];
  releaseDate?: string;
  links?: {
    steam?: string;
    itch?: string;
    website?: string;
    discord?: string;
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  status: 'draft' | 'published';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
