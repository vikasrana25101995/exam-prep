import AppShell from '@/components/Sidebar';
import PracticeBank from '@/modules/admin/PracticeBank';
import { BANK_PAGE_SIZE, TEMPLATES } from '@/modules/admin/constants';
import { requireAdmin } from '@/modules/auth/service';
import { bankSummary, listBank } from '@/modules/practice/service';

// /admin/practice?exam=&stage=&section=&q=&page=
export default async function Page({ searchParams }) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const filters = Object.fromEntries(['exam', 'stage', 'section', 'q'].map((k) => [k, String(sp[k] ?? '').slice(0, 200)]));
  const page = Math.max(0, Number.parseInt(sp.page, 10) || 0);
  const [{ rows, total }, summary] = await Promise.all([listBank({ ...filters, page, size: BANK_PAGE_SIZE }), bankSummary()]);
  // Filter dropdown: sections already in the bank plus every exam template's section names.
  const templateSections = Object.values(TEMPLATES).flatMap((byStage) => Object.values(byStage).flat().map((t) => t.name));
  const sections = [...new Set([...summary.map((r) => r.section), ...templateSections])].sort();
  return (
    <AppShell user={user}>
      <PracticeBank rows={rows} total={total} page={page} pageSize={BANK_PAGE_SIZE} filters={filters} sections={sections} summary={summary} />
    </AppShell>
  );
}
