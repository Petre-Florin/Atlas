import { addProject, restoreProject } from "@/app/actions";
import { ProjectRow } from "./ProjectRow";
import { SubmitButton } from "./SubmitButton";

type Project = {
  id: string;
  name: string;
  status: string;
  next_action: string;
  notes: string;
  link: string;
  last_touched_at: string;
};

type ArchivedProject = {
  id: string;
  name: string;
  status: string;
  last_touched_at: string;
};

export function ProjectsCard({
  projects,
  archivedProjects = [],
}: {
  projects: Project[];
  archivedProjects?: ArchivedProject[];
}) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="mb-5 font-display text-xl text-paper">Projects</h2>

      <ul className="mb-5 space-y-4">
        {projects.length === 0 && (
          <li className="text-sm text-paper-muted">
            No projects yet — add something you&apos;re actually building right now.
          </li>
        )}
        {projects.map((project, index) => (
          <li key={project.id}>
            <ProjectRow
              project={project}
              canMoveUp={index > 0}
              canMoveDown={index < projects.length - 1}
            />
          </li>
        ))}
      </ul>

      <form action={addProject} className="mb-5 space-y-2">
        <input
          type="text"
          name="name"
          placeholder="Name (e.g. Atlas, Sidebuild, housing analytics)"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <select
          name="status"
          defaultValue="active"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="done">Done</option>
        </select>
        <input
          type="text"
          name="nextAction"
          placeholder="Next action"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <input
          type="url"
          name="link"
          placeholder="Link (repo, doc, etc. — optional)"
          className="w-full rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          rows={2}
          className="w-full resize-none rounded-md border border-hairline bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-thread"
        />
        <SubmitButton>Add</SubmitButton>
      </form>

      {archivedProjects.length > 0 && (
        <details className="group/archive">
          <summary className="cursor-pointer text-xs text-paper-faint transition-colors hover:text-paper-muted">
            Archived ({archivedProjects.length})
          </summary>
          <ul className="mt-3 space-y-2 border-t border-hairline pt-3">
            {archivedProjects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-paper-muted">{project.name}</span>
                <form action={restoreProject} className="flex-none">
                  <input type="hidden" name="id" value={project.id} />
                  <button
                    type="submit"
                    className="rounded-md px-2 py-0.5 text-xs text-thread transition-colors hover:bg-thread-soft"
                  >
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
