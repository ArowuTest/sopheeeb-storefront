"use client";

import { useEffect, useState } from "react";

type BulkDraftToolbarProps = {
  formId: string;
  group: string;
  draftCount: number;
  itemLabel: string;
};

export function BulkDraftToolbar({ formId, group, draftCount, itemLabel }: BulkDraftToolbarProps) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const selector = `input[data-bulk-group="${group}"]`;

  useEffect(() => {
    const boxes = () => [...document.querySelectorAll<HTMLInputElement>(selector)];
    const updateCount = () => setSelectedCount(boxes().filter((box) => box.checked).length);
    const currentBoxes = boxes();
    currentBoxes.forEach((box) => box.addEventListener("change", updateCount));
    updateCount();
    return () => currentBoxes.forEach((box) => box.removeEventListener("change", updateCount));
  }, [selector]);

  if (!draftCount) return null;

  function toggleAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>(selector).forEach((box) => {
      box.checked = checked;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  return (
    <div className="bulk-draft-toolbar" role="region" aria-label={`Bulk ${itemLabel} actions`}>
      <label className="bulk-select-all">
        <input type="checkbox" onChange={(event) => toggleAll(event.currentTarget.checked)} />
        <span>Select all visible drafts</span>
      </label>
      <span className="bulk-selected-count" aria-live="polite">
        {selectedCount ? `${selectedCount} selected` : "Select drafts to manage together"}
      </span>
      <div className="bulk-draft-actions">
        <button className="button button-dark" type="submit" name="action" value="publish" form={formId} disabled={!selectedCount || submitting} onClick={(event) => {
          if (!window.confirm(`Publish ${selectedCount} ${itemLabel}? They will become visible on the public storefront.`)) event.preventDefault();
          else setSubmitting(true);
        }}>
          {submitting ? "Saving…" : "Publish selected"}
        </button>
        <button className="button button-outline bulk-archive-button" type="submit" name="action" value="archive" form={formId} disabled={!selectedCount || submitting} onClick={(event) => {
          if (!window.confirm(`Archive ${selectedCount} ${itemLabel}? They will be removed from the public storefront.`)) event.preventDefault();
          else setSubmitting(true);
        }}>
          {submitting ? "Saving…" : "Archive selected"}
        </button>
      </div>
    </div>
  );
}
