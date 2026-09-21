"use client";

import { useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { Field, Select } from "@/components/ui";

export function EventTargetPicker({
  locations,
  floors,
  initialCategory,
  initialLocationId,
  initialFloorId,
}: {
  locations: { id: string; name: string }[];
  floors: { id: string; name: string; dungeonName: string }[];
  initialCategory?: string;
  initialLocationId?: string | null;
  initialFloorId?: string | null;
}) {
  const [category, setCategory] = useState(initialCategory || "LOCATION");

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Triggers in">
        <Select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </Select>
      </Field>
      {category === "LOCATION" && (
        <Field label="Location">
          <Select name="locationId" defaultValue={initialLocationId || ""}>
            <option value="">-- choose --</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {category === "DUNGEON_FLOOR" && (
        <Field label="Dungeon floor">
          <Select name="dungeonFloorId" defaultValue={initialFloorId || ""}>
            <option value="">-- choose --</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.dungeonName} &middot; {f.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {category === "GLOBAL" && <div />}
    </div>
  );
}
