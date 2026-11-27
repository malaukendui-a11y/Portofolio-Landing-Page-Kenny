/**
 * Tools & stack (v1.1, DESIGN §4.4a): the 23 tools the owner shows, in the copy deck's order (Tools &
 * tech stack, "Tampilkan = Ya"; Bootstrap and ChatGPT are left out). Names are data, the same in both
 * languages; the logo of each id is generated into content/stack-icons.ts (`pnpm stack:icons`).
 */
export type StackGroup = 'build' | 'test' | 'deploy' | 'design' | 'ai' | 'tools'

export const stackTools = [
  { id: 'html', name: 'HTML', group: 'build' },
  { id: 'css', name: 'CSS', group: 'build' },
  { id: 'javascript', name: 'JavaScript', group: 'build' },
  { id: 'typescript', name: 'TypeScript', group: 'build' },
  { id: 'react', name: 'React', group: 'build' },
  { id: 'nextjs', name: 'Next.js', group: 'build' },
  { id: 'tailwind', name: 'Tailwind CSS', group: 'build' },
  { id: 'vite', name: 'Vite', group: 'build' },
  { id: 'nodejs', name: 'Node.js', group: 'build' },
  { id: 'supabase', name: 'Supabase', group: 'build' },
  { id: 'playwright', name: 'Playwright', group: 'test' },
  { id: 'vitest', name: 'Vitest', group: 'test' },
  { id: 'jira', name: 'Jira', group: 'test' },
  { id: 'vercel', name: 'Vercel', group: 'deploy' },
  { id: 'cloudflare-pages', name: 'Cloudflare Pages', group: 'deploy' },
  { id: 'figma', name: 'Figma', group: 'design' },
  { id: 'google-stitch', name: 'Google Stitch', group: 'design' },
  { id: 'claude-code', name: 'Claude Code', group: 'ai' },
  { id: 'codex', name: 'Codex', group: 'ai' },
  { id: 'git', name: 'Git', group: 'tools' },
  { id: 'github', name: 'GitHub', group: 'tools' },
  { id: 'vscode', name: 'Visual Studio Code', group: 'tools' },
  { id: 'powershell', name: 'PowerShell', group: 'tools' },
] as const satisfies readonly { id: string; name: string; group: StackGroup }[]

export type StackTool = (typeof stackTools)[number]
export type StackToolId = StackTool['id']

/**
 * The two logo rows: build + test runs left, the rest runs the other way. The row's accessible name is
 * `t.stack.rows[index]` (content/en.ts, content/id.ts).
 */
export const stackRows = [
  { groups: ['build', 'test'], direction: 'normal' },
  { groups: ['deploy', 'design', 'ai', 'tools'], direction: 'reverse' },
] as const satisfies readonly { groups: readonly StackGroup[]; direction: 'normal' | 'reverse' }[]

export function toolsInRow(row: (typeof stackRows)[number]): StackTool[] {
  return stackTools.filter((tool) => (row.groups as readonly StackGroup[]).includes(tool.group))
}
