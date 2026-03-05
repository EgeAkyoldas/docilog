/* ─── Docilog Project Context (MOCK) ─── */
/* ⚠️ LOCAL PRESET DB - NO SUPABASE CONNECTION */

/* ── Types ── */

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  theme_config: Record<string, unknown>;
  owner_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCategory {
  id: string;
  project_id: string;
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProjectWithDetails extends Project {
  categories: ProjectCategory[];
  article_count?: number;
}

/* ── MOCK DATA ── */

// In-memory array for session longevity
let MOCK_PROJECTS: ProjectWithDetails[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    slug: "music-blog",
    name: "Müzik Eğitimi Blog",
    description: "AI destekli müzik eğitimi blog platformu",
    icon: "🎵",
    theme_config: {},
    owner_id: "00000000-0000-0000-0000-000000000001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    article_count: 42,
    categories: [
      { id: "cat1", project_id: "10000000-0000-0000-0000-000000000001", slug: "theory", label: "Müzik Teorisi", sort_order: 0, is_active: true },
      { id: "cat2", project_id: "10000000-0000-0000-0000-000000000001", slug: "instrument", label: "Enstrüman", sort_order: 1, is_active: true },
      { id: "cat3", project_id: "10000000-0000-0000-0000-000000000001", slug: "exam_prep", label: "Sınav Hazırlık", sort_order: 2, is_active: true },
    ]
  },
  {
    id: "20000000-0000-0000-0000-000000000001",
    slug: "finance-blog",
    name: "Finans Blog",
    description: "Dijital piyasa stratejisi ve makroekonomik analiz",
    icon: "💰",
    theme_config: {},
    owner_id: "00000000-0000-0000-0000-000000000001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    article_count: 12,
    categories: [
      { id: "cat4", project_id: "20000000-0000-0000-0000-000000000001", slug: "technical_analysis", label: "Teknik Analiz", sort_order: 0, is_active: true },
      { id: "cat5", project_id: "20000000-0000-0000-0000-000000000001", slug: "macro_economics", label: "Makroekonomi", sort_order: 1, is_active: true },
      { id: "cat6", project_id: "20000000-0000-0000-0000-000000000001", slug: "morning_brief", label: "Güne Başlarken", sort_order: 2, is_active: true },
    ]
  },
  {
    id: "30000000-0000-0000-0000-000000000001",
    slug: "boterma-social",
    name: "Boterma Social Media",
    description: "Boterma iç mekan aydınlatma markası için sosyal medya içerik üretim platformu",
    icon: "💡",
    theme_config: {},
    owner_id: "00000000-0000-0000-0000-000000000001",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    article_count: 0,
    categories: [
      { id: "cat7", project_id: "30000000-0000-0000-0000-000000000001", slug: "instagram_post", label: "Instagram Post", sort_order: 0, is_active: true },
      { id: "cat8", project_id: "30000000-0000-0000-0000-000000000001", slug: "stories", label: "Story İçerikleri", sort_order: 1, is_active: true },
      { id: "cat9", project_id: "30000000-0000-0000-0000-000000000001", slug: "campaign", label: "Kampanya", sort_order: 2, is_active: true },
      { id: "cat10", project_id: "30000000-0000-0000-0000-000000000001", slug: "product_showcase", label: "Ürün Tanıtımı", sort_order: 3, is_active: true },
      { id: "cat11", project_id: "30000000-0000-0000-0000-000000000001", slug: "collection_lookbook", label: "Koleksiyon & Lookbook", sort_order: 4, is_active: true },
      { id: "cat12", project_id: "30000000-0000-0000-0000-000000000001", slug: "trend_inspiration", label: "Trend & İlham", sort_order: 5, is_active: true },
      { id: "cat13", project_id: "30000000-0000-0000-0000-000000000001", slug: "behind_the_scenes", label: "Sahne Arkası", sort_order: 6, is_active: true },
      { id: "cat14", project_id: "30000000-0000-0000-0000-000000000001", slug: "other", label: "Genel", sort_order: 7, is_active: true },
    ]
  }
];

const MOCK_MEMBERS = {
  // user IDs
  "admin": "00000000-0000-0000-0000-000000000001",
  "cenk": "00000000-0000-0000-0000-000000000002",
  "boterma": "00000000-0000-0000-0000-000000000003"
};

const PROJECT_MEMBERSHIPS: Record<string, string[]> = {
  // admin => [music, finance, boterma], cenk => [finance], boterma => [boterma]
  [MOCK_MEMBERS.admin]: ["10000000-0000-0000-0000-000000000001", "20000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001"],
  [MOCK_MEMBERS.cenk]: ["20000000-0000-0000-0000-000000000001"],
  [MOCK_MEMBERS.boterma]: ["30000000-0000-0000-0000-000000000001"]
};

/* ── Get project by slug ── */

export async function getProjectBySlug(
  slug: string
): Promise<Project | null> {
  return MOCK_PROJECTS.find(p => p.slug === slug && p.is_active) || null;
}

/* ── Get project with details ── */

export async function getProjectWithDetails(
  slug: string
): Promise<ProjectWithDetails | null> {
  return MOCK_PROJECTS.find(p => p.slug === slug && p.is_active) || null;
}

/* ── List all projects ── */

export async function listProjects(): Promise<ProjectWithDetails[]> {
  return MOCK_PROJECTS.filter(p => p.is_active);
}

/* ── Create project ── */

export async function createProject(data: {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  owner_id?: string;
}): Promise<Project | null> {
  const newProject: ProjectWithDetails = {
    id: `proj_${Date.now()}`,
    slug: data.slug,
    name: data.name,
    description: data.description ?? "",
    icon: data.icon ?? "📝",
    theme_config: {},
    owner_id: data.owner_id ?? null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    article_count: 0,
    categories: []
  };

  MOCK_PROJECTS.push(newProject);
  return newProject;
}

/* ── Update project ── */

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, "name" | "description" | "icon" | "theme_config" | "is_active">>
): Promise<boolean> {
  const index = MOCK_PROJECTS.findIndex(p => p.id === id);
  if (index === -1) return false;

  MOCK_PROJECTS[index] = { ...MOCK_PROJECTS[index], ...data, updated_at: new Date().toISOString() };
  return true;
}

/* ── Delete project ── */

export async function deleteProject(id: string): Promise<boolean> {
  const index = MOCK_PROJECTS.findIndex(p => p.id === id);
  if (index === -1) return false;

  MOCK_PROJECTS.splice(index, 1);
  return true;
}

/* ── Get categories for a project ── */

export async function getProjectCategories(
  projectId: string
): Promise<ProjectCategory[]> {
  const project = MOCK_PROJECTS.find(p => p.id === projectId);
  return project?.categories || [];
}

/* ── List projects for a specific user ── */

export async function listProjectsForUser(
  userId: string
): Promise<ProjectWithDetails[]> {
  const projectIds = PROJECT_MEMBERSHIPS[userId] || [];
  return MOCK_PROJECTS.filter(p => projectIds.includes(p.id) && p.is_active);
}
