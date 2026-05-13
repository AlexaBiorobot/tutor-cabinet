"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ModuleStatus = "draft" | "published" | "archived";
type ModuleBlockType =
  | "simple_text"
  | "heading"
  | "video"
  | "image"
  | "callout"
  | "summary"
  | "interactive_image"
  | "scenario"
  | "good_bad_example"
  | "common_mistake"
  | "checklist"
  | "open_answer"
  | "quiz";

export async function createModuleDraft(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const estimatedDurationMinutes = Number(formData.get("estimatedDurationMinutes") ?? 15);
  const { supabase, user } = await requireAdmin();

  if (!title) return;

  const { data: module } = await supabase
    .from("modules")
    .insert({
      title,
      summary: description,
      description,
      estimated_minutes: estimatedDurationMinutes,
      estimated_duration_minutes: estimatedDurationMinutes,
      target_audience: targetAudience || null,
      status: "draft",
      created_by: user.id
    })
    .select("id")
    .single();

  revalidatePath("/admin/modules");
  if (module?.id) redirect(`/admin/modules?moduleId=${module.id}`);
}

export async function updateModuleDetails(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const estimatedDurationMinutes = Number(formData.get("estimatedDurationMinutes") ?? 15);
  const status = normalizeModuleStatus(String(formData.get("status") ?? "draft"));
  const { supabase } = await requireAdmin();

  if (!moduleId || !title) return;

  await supabase
    .from("modules")
    .update({
      title,
      summary: description,
      description,
      estimated_minutes: estimatedDurationMinutes,
      estimated_duration_minutes: estimatedDurationMinutes,
      target_audience: targetAudience || null,
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", moduleId);

  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

export async function updateModuleStatus(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const status = normalizeModuleStatus(String(formData.get("status") ?? "draft"));
  const { supabase } = await requireAdmin();

  if (!moduleId) return;

  await supabase.from("modules").update({ status, updated_at: new Date().toISOString() }).eq("id", moduleId);

  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

export async function createModuleBlock(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const blockType = normalizeBlockType(String(formData.get("blockType") ?? "simple_text"));
  const title = String(formData.get("title") ?? "").trim();
  const isRequired = formData.get("isRequired") === "on";
  const { supabase } = await requireAdmin();

  if (!moduleId) return;

  const { data: existingBlocks } = await supabase
    .from("module_blocks")
    .select("order_index")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: false })
    .limit(1);

  await supabase.from("module_blocks").insert({
    module_id: moduleId,
    block_type: blockType,
    order_index: Number(existingBlocks?.[0]?.order_index ?? 0) + 1,
    title: title || null,
    content_json: buildBlockContent(formData, blockType),
    is_required: isRequired
  });

  await touchModule(supabase, moduleId);
  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

export async function updateModuleBlock(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const blockType = normalizeBlockType(String(formData.get("blockType") ?? "simple_text"));
  const title = String(formData.get("title") ?? "").trim();
  const isRequired = formData.get("isRequired") === "on";
  const { supabase } = await requireAdmin();

  if (!moduleId || !blockId) return;

  await supabase
    .from("module_blocks")
    .update({
      block_type: blockType,
      title: title || null,
      content_json: buildBlockContent(formData, blockType),
      is_required: isRequired,
      updated_at: new Date().toISOString()
    })
    .eq("id", blockId)
    .eq("module_id", moduleId);

  await touchModule(supabase, moduleId);
  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

export async function duplicateModuleBlock(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const { supabase } = await requireAdmin();

  if (!moduleId || !blockId) return;

  const [{ data: block }, { data: lastBlocks }] = await Promise.all([
    supabase
      .from("module_blocks")
      .select("block_type, title, content_json, is_required")
      .eq("id", blockId)
      .eq("module_id", moduleId)
      .maybeSingle(),
    supabase
      .from("module_blocks")
      .select("order_index")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: false })
      .limit(1)
  ]);

  if (!block) return;

  await supabase.from("module_blocks").insert({
    module_id: moduleId,
    block_type: block.block_type,
    order_index: Number(lastBlocks?.[0]?.order_index ?? 0) + 1,
    title: block.title ? `${block.title} copy` : null,
    content_json: block.content_json ?? {},
    is_required: block.is_required
  });

  await touchModule(supabase, moduleId);
  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

export async function deleteModuleBlock(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const { supabase } = await requireAdmin();

  if (!moduleId || !blockId) return;

  await supabase.from("module_blocks").delete().eq("id", blockId).eq("module_id", moduleId);
  await normalizeBlockOrder(supabase, moduleId);
  await touchModule(supabase, moduleId);

  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

export async function moveModuleBlock(formData: FormData) {
  const moduleId = String(formData.get("moduleId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const { supabase } = await requireAdmin();

  if (!moduleId || !blockId || (direction !== "up" && direction !== "down")) return;

  const { data: blocks } = await supabase
    .from("module_blocks")
    .select("id, order_index")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  const orderedBlocks = blocks ?? [];
  const currentIndex = orderedBlocks.findIndex((block) => block.id === blockId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedBlocks.length) return;

  const current = orderedBlocks[currentIndex];
  const target = orderedBlocks[targetIndex];
  await supabase.from("module_blocks").update({ order_index: -1 }).eq("id", current.id);
  await supabase.from("module_blocks").update({ order_index: current.order_index }).eq("id", target.id);
  await supabase.from("module_blocks").update({ order_index: target.order_index }).eq("id", current.id);
  await touchModule(supabase, moduleId);

  revalidatePath("/admin/modules");
  redirect(`/admin/modules?moduleId=${moduleId}`);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/tutor");

  return { supabase, user };
}

function normalizeModuleStatus(value: string): ModuleStatus {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

function normalizeBlockType(value: string): ModuleBlockType {
  const allowed: ModuleBlockType[] = [
    "simple_text",
    "heading",
    "video",
    "image",
    "callout",
    "summary",
    "interactive_image",
    "scenario",
    "good_bad_example",
    "common_mistake",
    "checklist",
    "open_answer",
    "quiz"
  ];

  return allowed.includes(value as ModuleBlockType) ? (value as ModuleBlockType) : "simple_text";
}

function buildBlockContent(formData: FormData, blockType: ModuleBlockType) {
  const body = String(formData.get("body") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim();
  const items = splitLines(String(formData.get("items") ?? ""));
  const questionType = String(formData.get("questionType") ?? "single_choice");
  const correctAnswers = splitLines(String(formData.get("correctAnswers") ?? ""));
  const passingScore = Number(formData.get("passingScore") ?? 80);

  if (blockType === "video") return { url, caption: body };
  if (blockType === "image" || blockType === "interactive_image") return { url, altText, instructions: body, hotspots: items };
  if (blockType === "checklist") return { items };
  if (blockType === "open_answer") return { prompt: body };
  if (blockType === "quiz") return { questionType, prompt: body, options: items, correctAnswers, passingScore };
  if (blockType === "good_bad_example") return { examples: items, explanation: body };
  if (blockType === "scenario") return { scenario: body, choices: items };

  return { text: body, items };
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function touchModule(supabase: Awaited<ReturnType<typeof createClient>>, moduleId: string) {
  await supabase.from("modules").update({ updated_at: new Date().toISOString() }).eq("id", moduleId);
}

async function normalizeBlockOrder(supabase: Awaited<ReturnType<typeof createClient>>, moduleId: string) {
  const { data: blocks } = await supabase
    .from("module_blocks")
    .select("id")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  const orderedBlocks = blocks ?? [];

  for (const [index, block] of orderedBlocks.entries()) {
    await supabase.from("module_blocks").update({ order_index: -(index + 1) }).eq("id", block.id);
  }

  for (const [index, block] of orderedBlocks.entries()) {
    await supabase.from("module_blocks").update({ order_index: index + 1 }).eq("id", block.id);
  }
}
