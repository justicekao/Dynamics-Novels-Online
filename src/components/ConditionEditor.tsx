"use client";

import { useState } from "react";
import { UNLOCK_CONDITION_TYPES } from "@/lib/constants";
import { Select, TextInput } from "@/components/ui";

export type ConditionOption = { id: string; name: string };

export type Condition = { type: string; targetId?: string; value?: number };

const LABELS: Record<string, string> = {
  HAS_ITEM: "Has item",
  HAS_TRAIT: "Has trait",
  COMPLETED_EVENT: "Completed event",
  LEVEL_AT_LEAST: "Level at least",
  HAS_COMPANION: "Has companion",
};

function targetOptionsFor(
  type: string,
  opts: { items: ConditionOption[]; traits: ConditionOption[]; events: ConditionOption[]; companions: ConditionOption[] },
): ConditionOption[] {
  if (type === "HAS_ITEM") return opts.items;
  if (type === "HAS_TRAIT") return opts.traits;
  if (type === "COMPLETED_EVENT") return opts.events;
  if (type === "HAS_COMPANION") return opts.companions;
  return [];
}

/** Fixed number of condition slots to keep this a no-JS-required-for-layout, server-friendly form. */
const SLOTS = 4;

export function ConditionEditor({
  name,
  initial,
  items,
  traits,
  events,
  companions,
}: {
  name: string;
  initial: Condition[];
  items: ConditionOption[];
  traits: ConditionOption[];
  events: ConditionOption[];
  companions: ConditionOption[];
}) {
  const [rows, setRows] = useState<Condition[]>(() => {
    const padded = [...initial];
    while (padded.length < SLOTS) padded.push({ type: "" });
    return padded.slice(0, SLOTS);
  });
  const opts = { items, traits, events, companions };

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={`${name}_count`} value={SLOTS} />
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 rounded-lg border border-slate-800 p-2">
          <Select
            value={row.type}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { type: e.target.value };
              setRows(next);
            }}
            name={`${name}_${i}_type`}
          >
            <option value="">-- unused --</option>
            {UNLOCK_CONDITION_TYPES.map((t) => (
              <option key={t} value={t}>
                {LABELS[t]}
              </option>
            ))}
          </Select>
          {row.type === "LEVEL_AT_LEAST" ? (
            <TextInput
              type="number"
              name={`${name}_${i}_value`}
              defaultValue={row.value ?? 1}
              placeholder="Level"
              className="col-span-2"
            />
          ) : row.type ? (
            <Select name={`${name}_${i}_targetId`} defaultValue={row.targetId} className="col-span-2">
              <option value="">-- choose --</option>
              {targetOptionsFor(row.type, opts).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="col-span-2" />
          )}
        </div>
      ))}
    </div>
  );
}
