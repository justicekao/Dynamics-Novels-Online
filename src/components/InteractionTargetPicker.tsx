"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui";

export function InteractionTargetPicker({
  npcs,
  companions,
  initialKind,
  initialTargetId,
}: {
  npcs: { id: string; name: string }[];
  companions: { id: string; name: string }[];
  initialKind?: string;
  initialTargetId?: string;
}) {
  const [kind, setKind] = useState(initialKind || "npc");
  const options = kind === "npc" ? npcs : companions;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Applies to">
        <Select name="targetKind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="npc">NPC</option>
          <option value="companion">Companion</option>
        </Select>
      </Field>
      <Field label="Which one">
        <Select name="targetId" defaultValue={initialTargetId}>
          <option value="">-- choose --</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
