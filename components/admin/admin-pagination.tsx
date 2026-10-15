import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
  label: string;
};

function pageNumbers(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const values: Array<number | "ellipsis"> = [1];
  if (page > 3) values.push("ellipsis");
  for (let value = Math.max(2, page - 1); value <= Math.min(totalPages - 1, page + 1); value += 1) values.push(value);
  if (page < totalPages - 2) values.push("ellipsis");
  values.push(totalPages);
  return values;
}

function hrefFor(basePath: string, page: number, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const search = params.toString();
  return `${basePath}${search ? `?${search}` : ""}`;
}

export function AdminPagination({ page, totalPages, basePath, query = {}, label }: AdminPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label={label}>
      {page > 1 ? <Link href={hrefFor(basePath, page - 1, query)} rel="prev"><ArrowLeft size={15} /> Previous</Link> : <span className="admin-pagination-disabled"><ArrowLeft size={15} /> Previous</span>}
      <div className="admin-pagination-pages">
        {pageNumbers(page, totalPages).map((value, index) => value === "ellipsis"
          ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
          : value === page
            ? <span key={value} aria-current="page">{value}</span>
            : <Link key={value} href={hrefFor(basePath, value, query)}>{value}</Link>)}
      </div>
      {page < totalPages ? <Link href={hrefFor(basePath, page + 1, query)} rel="next">Next <ArrowRight size={15} /></Link> : <span className="admin-pagination-disabled">Next <ArrowRight size={15} /></span>}
    </nav>
  );
}
