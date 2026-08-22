import { TopBar } from "@/components/TopBar";
import { ProjectsCard } from "@/components/ProjectsCard";
import { getProjects, getArchivedProjects } from "@/lib/strands";

export default async function ProjectsPage() {
  const [projects, archivedProjects] = await Promise.all([
    getProjects(),
    getArchivedProjects(),
  ]);

  return (
    <>
      <TopBar title="Projects" />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-xl">
          <ProjectsCard projects={projects} archivedProjects={archivedProjects} />
        </div>
      </main>
    </>
  );
}
