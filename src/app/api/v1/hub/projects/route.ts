import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  listProjects,
  listProjectsForUser,
  createProject,
} from "@/lib/project-context";

/* GET — List projects */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects =
      user.role === "master_admin"
        ? await listProjects()
        : await listProjectsForUser(user.id);

    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* POST — Create project (master admin only) */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== "master_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.slug || !body.name) {
      return NextResponse.json(
        { error: "slug ve name gerekli" },
        { status: 400 }
      );
    }

    const project = await createProject({
      slug: body.slug,
      name: body.name,
      description: body.description,
      icon: body.icon,
      owner_id: user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proje oluşturulamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
