"use client";

import { useState } from "react";
import { ALL_STATS, ELEMENTS, STATUS_EFFECTS } from "@/lib/constants";
import { Button, Field, Select, TextArea, TextInput } from "@/components/ui";

type Payload = {
  stat?: string;
  amount?: number;
  duration?: number;
  status?: string;
  chance?: number;
  element?: string;
  traitId?: string;
};

export function EffectForm({
  action,
  slug,
  id,
  name,
  description,
  kind,
  payload,
  traits,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  slug: string;
  id?: string;
  name?: string;
  description?: string;
  kind?: string;
  payload: Payload;
  traits: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [selectedKind, setSelectedKind] = useState(kind || "STAT_MODIFIER");

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      {id && <input type="hidden" name="id" value={id} />}
      <Field label="Name">
        <TextInput name="name" defaultValue={name} required />
      </Field>
      <Field label="Description">
        <TextArea name="description" defaultValue={description} />
      </Field>
      <Field label="Kind">
        <Select name="kind" value={selectedKind} onChange={(e) => setSelectedKind(e.target.value)}>
          <option value="STAT_MODIFIER">Stat modifier</option>
          <option value="STATUS">Status effect</option>
          <option value="DAMAGE">Elemental damage</option>
          <option value="HEAL">Heal</option>
          <option value="GRANT_TRAIT">Grant trait</option>
        </Select>
      </Field>

      {selectedKind === "STAT_MODIFIER" && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Field label="Stat">
            <Select name="p_stat" defaultValue={payload.stat}>
              {ALL_STATS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <TextInput type="number" name="p_amount" defaultValue={payload.amount ?? 0} />
          </Field>
          <Field label="Duration (turns, 0=until removed)">
            <TextInput type="number" name="p_duration" defaultValue={payload.duration ?? 0} />
          </Field>
        </div>
      )}

      {selectedKind === "STATUS" && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Field label="Status">
            <Select name="p_status" defaultValue={payload.status}>
              {STATUS_EFFECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chance to apply (%)">
            <TextInput type="number" name="p_chance" defaultValue={payload.chance ?? 100} />
          </Field>
          <Field label="Duration (turns)">
            <TextInput type="number" name="p_duration" defaultValue={payload.duration ?? 2} />
          </Field>
        </div>
      )}

      {selectedKind === "DAMAGE" && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Element">
            <Select name="p_element" defaultValue={payload.element}>
              {ELEMENTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <TextInput type="number" name="p_amount" defaultValue={payload.amount ?? 0} />
          </Field>
        </div>
      )}

      {selectedKind === "HEAL" && (
        <div className="mb-4">
          <Field label="Amount">
            <TextInput type="number" name="p_amount" defaultValue={payload.amount ?? 0} />
          </Field>
        </div>
      )}

      {selectedKind === "GRANT_TRAIT" && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Trait">
            <Select name="p_traitId" defaultValue={payload.traitId}>
              <option value="">-- none --</option>
              {traits.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chance to apply (%)">
            <TextInput type="number" name="p_chance" defaultValue={payload.chance ?? 100} />
          </Field>
        </div>
      )}

      <Button type="submit" variant={id ? "secondary" : "primary"}>
        {submitLabel}
      </Button>
    </form>
  );
}
