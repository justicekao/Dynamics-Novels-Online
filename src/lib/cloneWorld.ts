import "server-only";
import { prisma } from "@/lib/db";

/**
 * Deep-clones every world-building entity into a new World row, remapping
 * cross-references. Real foreign key columns are remapped as each dependent
 * entity is created (in dependency order); the many JSON "id list" / "id
 * string" fields are handled afterwards with a blind id substitution pass,
 * since cuids are long enough that accidental substring collisions are not
 * a realistic concern.
 */
export async function cloneWorld(sourceWorldId: string, ownerId: string, name: string, slug: string) {
  const src = await prisma.world.findUniqueOrThrow({
    where: { id: sourceWorldId },
    include: {
      races: true,
      classes: true,
      traits: true,
      items: { include: { effects: true } },
      effects: true,
      skills: { include: { effects: true } },
      locations: true,
      roads: true,
      npcs: true,
      companions: true,
      interactions: { include: { choices: true } },
      creatures: true,
      dungeons: { include: { floors: true } },
      events: { include: { choices: true } },
      tags: true,
    },
  });

  const idMap = new Map<string, string>();

  return prisma.$transaction(
    async (tx) => {
      const world = await tx.world.create({
        data: {
          ownerId,
          name,
          slug,
          description: src.description,
          visibility: "PRIVATE",
          allowComments: src.allowComments,
          allowRatings: src.allowRatings,
          allowDuplication: src.allowDuplication,
          terminology: src.terminology,
          forkedFromId: src.id,
        },
      });

      for (const t of src.tags) {
        await tx.worldTag.create({ data: { worldId: world.id, tagId: t.tagId } }).catch(() => {});
      }

      for (const trait of src.traits) {
        const created = await tx.trait.create({
          data: { worldId: world.id, name: trait.name, description: trait.description, statModifiers: trait.statModifiers },
        });
        idMap.set(trait.id, created.id);
      }

      for (const eff of src.effects) {
        const created = await tx.effectDefinition.create({
          data: { worldId: world.id, name: eff.name, description: eff.description, kind: eff.kind, payload: eff.payload },
        });
        idMap.set(eff.id, created.id);
      }

      for (const item of src.items) {
        const created = await tx.item.create({
          data: {
            worldId: world.id,
            name: item.name,
            description: item.description,
            type: item.type,
            element: item.element,
            statModifiers: item.statModifiers,
          },
        });
        idMap.set(item.id, created.id);
        for (const e of item.effects) {
          await tx.itemEffect.create({
            data: { itemId: created.id, effectId: idMap.get(e.effectId) ?? e.effectId },
          });
        }
      }

      for (const skill of src.skills) {
        const created = await tx.skill.create({
          data: {
            worldId: world.id,
            name: skill.name,
            description: skill.description,
            type: skill.type,
            element: skill.element,
            targetType: skill.targetType,
            basePower: skill.basePower,
            baseSuccessChance: skill.baseSuccessChance,
            grantsTraitId: skill.grantsTraitId,
            grantsTraitChance: skill.grantsTraitChance,
            requiresTraitId: skill.requiresTraitId,
            unlockConditions: skill.unlockConditions,
            neverUnlockable: skill.neverUnlockable,
          },
        });
        idMap.set(skill.id, created.id);
        for (const e of skill.effects) {
          await tx.skillEffect.create({
            data: { skillId: created.id, effectId: idMap.get(e.effectId) ?? e.effectId },
          });
        }
      }

      for (const race of src.races) {
        const created = await tx.race.create({
          data: {
            worldId: world.id,
            name: race.name,
            description: race.description,
            portraitSeed: race.portraitSeed,
            statModifiers: race.statModifiers,
            traitIds: race.traitIds,
          },
        });
        idMap.set(race.id, created.id);
      }

      for (const klass of src.classes) {
        const created = await tx.class.create({
          data: {
            worldId: world.id,
            name: klass.name,
            description: klass.description,
            statModifiers: klass.statModifiers,
            startingSkillIds: klass.startingSkillIds,
          },
        });
        idMap.set(klass.id, created.id);
      }

      for (const loc of src.locations) {
        const created = await tx.location.create({
          data: {
            worldId: world.id,
            name: loc.name,
            description: loc.description,
            imageSeed: loc.imageSeed,
            musicSeed: loc.musicSeed,
            hidden: loc.hidden,
            x: loc.x,
            y: loc.y,
            unlockConditions: loc.unlockConditions,
            npcPoolIds: loc.npcPoolIds,
          },
        });
        idMap.set(loc.id, created.id);
      }

      for (const road of src.roads) {
        const fromId = idMap.get(road.fromId);
        const toId = idMap.get(road.toId);
        if (fromId && toId) {
          await tx.locationConnection.create({ data: { worldId: world.id, fromId, toId } });
        }
      }

      for (const npc of src.npcs) {
        const created = await tx.npc.create({
          data: {
            worldId: world.id,
            name: npc.name,
            description: npc.description,
            portraitSeed: npc.portraitSeed,
            traitIds: npc.traitIds,
            skillIds: npc.skillIds,
            itemIds: npc.itemIds,
          },
        });
        idMap.set(npc.id, created.id);
      }

      for (const comp of src.companions) {
        const created = await tx.companion.create({
          data: {
            worldId: world.id,
            name: comp.name,
            description: comp.description,
            portraitSeed: comp.portraitSeed,
            allowedClassIds: comp.allowedClassIds,
            initialLevel: comp.initialLevel,
            initialSkillIds: comp.initialSkillIds,
            hiddenSkillIds: comp.hiddenSkillIds,
            hideCompanionSkillsByDefault: comp.hideCompanionSkillsByDefault,
          },
        });
        idMap.set(comp.id, created.id);
      }

      for (const inter of src.interactions) {
        const created = await tx.interaction.create({
          data: {
            worldId: world.id,
            npcId: inter.npcId ? idMap.get(inter.npcId) ?? null : null,
            companionId: inter.companionId ? idMap.get(inter.companionId) ?? null : null,
            name: inter.name,
            description: inter.description,
          },
        });
        idMap.set(inter.id, created.id);
        for (const c of inter.choices) {
          await tx.interactionChoice.create({
            data: {
              interactionId: created.id,
              text: c.text,
              resultText: c.resultText,
              outcomes: c.outcomes,
            },
          });
        }
      }

      for (const cr of src.creatures) {
        const created = await tx.creature.create({
          data: {
            worldId: world.id,
            name: cr.name,
            description: cr.description,
            portraitSeed: cr.portraitSeed,
            element: cr.element,
            stats: cr.stats,
            skillIds: cr.skillIds,
            lootItemIds: cr.lootItemIds,
            xpReward: cr.xpReward,
          },
        });
        idMap.set(cr.id, created.id);
      }

      for (const dg of src.dungeons) {
        const locationId = idMap.get(dg.locationId) ?? dg.locationId;
        const created = await tx.dungeon.create({
          data: {
            worldId: world.id,
            locationId,
            name: dg.name,
            description: dg.description,
            musicSeed: dg.musicSeed,
            unlockConditions: dg.unlockConditions,
          },
        });
        idMap.set(dg.id, created.id);
        for (const fl of dg.floors) {
          const createdFloor = await tx.dungeonFloor.create({
            data: {
              dungeonId: created.id,
              order: fl.order,
              name: fl.name,
              description: fl.description,
              backgroundSeed: fl.backgroundSeed,
              musicSeed: fl.musicSeed,
              creatureIds: fl.creatureIds,
            },
          });
          idMap.set(fl.id, createdFloor.id);
        }
      }

      for (const ev of src.events) {
        const created = await tx.event.create({
          data: {
            worldId: world.id,
            name: ev.name,
            description: ev.description,
            imageSeed: ev.imageSeed,
            musicSeed: ev.musicSeed,
            category: ev.category,
            locationId: ev.locationId ? idMap.get(ev.locationId) ?? null : null,
            dungeonFloorId: ev.dungeonFloorId ? idMap.get(ev.dungeonFloorId) ?? null : null,
            probability: ev.probability,
            prerequisiteEventIds: ev.prerequisiteEventIds,
            unlockConditions: ev.unlockConditions,
          },
        });
        idMap.set(ev.id, created.id);
        for (const c of ev.choices) {
          await tx.eventChoice.create({
            data: {
              eventId: created.id,
              text: c.text,
              resultTextSuccess: c.resultTextSuccess,
              resultTextFailure: c.resultTextFailure,
              successStats: c.successStats,
              successEffectIds: c.successEffectIds,
              failureEffectIds: c.failureEffectIds,
              nextEventId: c.nextEventId,
            },
          });
        }
      }

      // Second pass: blind id substitution across every JSON / id-string field.
      const replacements = [...idMap.entries()].filter(([oldId, newId]) => oldId !== newId);

      const substitute = (raw: string) => {
        let out = raw;
        for (const [oldId, newId] of replacements) {
          if (out.includes(oldId)) out = out.split(oldId).join(newId);
        }
        return out;
      };

      const jsonFieldsByModel: Record<string, string[]> = {
        race: ["statModifiers", "traitIds"],
        class: ["statModifiers", "startingSkillIds"],
        trait: ["statModifiers"],
        effectDefinition: ["payload"],
        skill: ["unlockConditions"],
        item: ["statModifiers"],
        location: ["unlockConditions", "npcPoolIds"],
        npc: ["traitIds", "skillIds", "itemIds"],
        companion: ["allowedClassIds", "initialSkillIds", "hiddenSkillIds"],
        creature: ["stats", "skillIds", "lootItemIds"],
        dungeon: ["unlockConditions"],
        event: ["prerequisiteEventIds", "unlockConditions"],
      };

      async function applySubstitution(
        rows: { id: string; [k: string]: unknown }[],
        fields: string[],
        updateFn: (id: string, data: Record<string, string>) => Promise<unknown>,
      ) {
        for (const row of rows) {
          const data: Record<string, string> = {};
          let changed = false;
          for (const f of fields) {
            const val = row[f];
            if (typeof val === "string") {
              const next = substitute(val);
              if (next !== val) {
                data[f] = next;
                changed = true;
              }
            }
          }
          if (changed) await updateFn(row.id, data);
        }
      }

      for (const [model, fields] of Object.entries(jsonFieldsByModel)) {
        // @ts-expect-error dynamic model access via tx client
        const rows = await tx[model].findMany({
          where: { worldId: world.id },
          select: { id: true, ...Object.fromEntries(fields.map((f) => [f, true])) },
        });
        // @ts-expect-error dynamic model access via tx client
        await applySubstitution(rows, fields, (id, data) => tx[model].update({ where: { id }, data }));
      }

      const dungeonFloorFields = ["creatureIds"];
      const floors = await tx.dungeonFloor.findMany({
        where: { dungeon: { worldId: world.id } },
        select: { id: true, creatureIds: true },
      });
      await applySubstitution(floors, dungeonFloorFields, (id, data) =>
        tx.dungeonFloor.update({ where: { id }, data }),
      );

      const eventChoiceFields = ["successStats", "successEffectIds", "failureEffectIds", "nextEventId"];
      const evChoices = await tx.eventChoice.findMany({
        where: { event: { worldId: world.id } },
        select: {
          id: true,
          successStats: true,
          successEffectIds: true,
          failureEffectIds: true,
          nextEventId: true,
        },
      });
      await applySubstitution(
        evChoices.map((c) => ({ ...c, nextEventId: c.nextEventId ?? "" })),
        eventChoiceFields,
        (id, data) => tx.eventChoice.update({ where: { id }, data }),
      );

      const interChoices = await tx.interactionChoice.findMany({
        where: { interaction: { worldId: world.id } },
        select: { id: true, outcomes: true },
      });
      await applySubstitution(interChoices, ["outcomes"], (id, data) =>
        tx.interactionChoice.update({ where: { id }, data }),
      );

      return world;
    },
    { timeout: 30000 },
  );
}
