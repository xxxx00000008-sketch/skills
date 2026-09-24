#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

function args(argv) {
  const result = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    result[key] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return result;
}

function chunks(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

function choiceQuestion(skills, noneId, final = false) {
  return {
    type: "choice",
    instructions: final
      ? "Select the one Codex skill that should lead the current phase. Prefer the requested deliverable and select no_skill when no specialist skill is clearly needed."
      : "Select the one Codex skill in this group that is most relevant to leading the current phase. Select no_match when none clearly applies.",
    criteria: Object.fromEntries([
      ...skills.map((skill) => [skill.id, skill.description]),
      [noneId, final ? "No specialist skill should be loaded." : "No skill in this group clearly applies."],
    ]),
  };
}

async function callJev(apiKey, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Jev returned HTTP ${response.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function normalized(answer) {
  const winner = answer.choice ?? answer.answer ?? answer.value ?? null;
  const probabilities = answer.probabilities ?? answer.distribution ?? {};
  const ranked = Object.entries(probabilities).sort((a, b) => Number(b[1]) - Number(a[1]));
  return {
    winner,
    confidence: Number.isFinite(Number(answer.confidence)) ? Number(answer.confidence) : null,
    winnerProbability: Number(probabilities[winner] ?? ranked[0]?.[1] ?? NaN),
    runnerUpProbability: Number(ranked.find(([id]) => id !== winner)?.[1] ?? NaN),
  };
}

function emit(value, exitCode = 0) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exitCode = exitCode;
}

const options = args(process.argv);
if (!options.request || !options.catalog) {
  emit({ error: "必须提供 --request 和 --catalog。" }, 2);
} else {
  try {
    const catalog = JSON.parse(await fs.readFile(path.resolve(String(options.catalog)), "utf8"));
    const skills = (catalog.skills || []).filter(
      (skill) => skill.id && skill.description && skill.id !== "jev-skill-router",
    );
    if (!skills.length) throw new Error("技能目录为空。");

    const groupSize = Math.min(24, Math.max(8, Number(options["group-size"] || 14)));
    const groups = chunks(skills, groupSize);
    const state = { request: String(options.request), context: options.context || null };
    const questions = Object.fromEntries(
      groups.map((group, index) => [`group_${index + 1}`, choiceQuestion(group, "no_match")]),
    );
    const firstPayload = { model: options.model || "jev-latest", state, questions };

    if (options["dry-run"]) {
      emit({ mode: "dry-run", skillCount: skills.length, groupCount: groups.length, firstPayload });
    } else {
      const apiKey = process.env.TYPESAFE_API_KEY;
      if (!apiKey) throw new Error("缺少 TYPESAFE_API_KEY 环境变量。");
      const first = await callJev(apiKey, firstPayload);
      const candidates = [];
      for (let index = 0; index < groups.length; index += 1) {
        const raw = first?.answers?.[`group_${index + 1}`] || first?.choices?.[`group_${index + 1}`] || {};
        const winner = normalized(raw).winner;
        const skill = groups[index].find((item) => item.id === winner);
        if (skill && !candidates.some((item) => item.id === skill.id)) candidates.push(skill);
      }

      if (!candidates.length) {
        emit({ action: "none", reason: "第一阶段没有匹配技能。", selectedSkill: null });
      } else {
        const second = await callJev(apiKey, {
          model: options.model || "jev-latest",
          state,
          questions: { final: choiceQuestion(candidates, "no_skill", true) },
        });
        const result = normalized(second?.answers?.final || second?.choices?.final || {});
        const margin = result.winnerProbability - result.runnerUpProbability;
        const selected = candidates.find((item) => item.id === result.winner) || null;
        let action = "none";
        if (selected && result.confidence !== null && Number.isFinite(result.winnerProbability)) {
          const activate =
            result.confidence >= Number(process.env.JEV_ROUTER_ACTIVATE_CONFIDENCE || 0.8) &&
            result.winnerProbability >= Number(process.env.JEV_ROUTER_ACTIVATE_PROBABILITY || 0.7) &&
            Number.isFinite(margin) &&
            margin >= Number(process.env.JEV_ROUTER_ACTIVATE_MARGIN || 0.2);
          action = activate
            ? "activate"
            : result.confidence >= Number(process.env.JEV_ROUTER_SUGGEST_CONFIDENCE || 0.6)
              ? "suggest"
              : "none";
        } else if (selected) action = "suggest";
        emit({
          action,
          selectedSkill: selected?.id || null,
          selectedSkillPath: selected?.path || null,
          candidates: candidates.map(({ id }) => id),
          confidence: result.confidence,
          winnerProbability: Number.isFinite(result.winnerProbability) ? result.winnerProbability : null,
          margin: Number.isFinite(margin) ? margin : null,
        });
      }
    }
  } catch (error) {
    emit({ action: "none", error: error instanceof Error ? error.message : String(error) }, 1);
  }
}
