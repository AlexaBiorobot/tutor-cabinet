import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Copy, Eye, FilePenLine, GripVertical, Plus, Trash2, UploadCloud } from "lucide-react";
import {
  createModuleBlock,
  createModuleDraft,
  deleteModuleBlock,
  duplicateModuleBlock,
  moveModuleBlock,
  updateModuleBlock,
  updateModuleDetails,
  updateModuleStatus
} from "@/app/admin/modules/actions";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/supabase/data";
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

type ModuleBlock = {
  id: string;
  moduleId: string;
  blockType: ModuleBlockType;
  orderIndex: number;
  title?: string;
  content: Record<string, unknown>;
  isRequired: boolean;
};

type BuilderModule = {
  id: string;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  targetAudience?: string;
  status: ModuleStatus;
  blocks: ModuleBlock[];
};

const approvedModuleBlockTypes: { value: ModuleBlockType; label: string }[] = [
  { value: "simple_text", label: "Simple text" },
  { value: "heading", label: "Heading" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "callout", label: "Callout" },
  { value: "summary", label: "Summary" },
  { value: "interactive_image", label: "Interactive image" },
  { value: "scenario", label: "Scenario" },
  { value: "good_bad_example", label: "Good / bad example" },
  { value: "common_mistake", label: "Common mistake" },
  { value: "checklist", label: "Checklist" },
  { value: "open_answer", label: "Open answer" },
  { value: "quiz", label: "Quiz" }
];

export default async function ModulesPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  const [{ user, profile }, { modules }, params] = await Promise.all([
    getSessionProfile(),
    getAdminModuleBuilderData(),
    searchParams
  ]);

  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/tutor");

  const selectedModule = modules.find((module) => module.id === params.moduleId) ?? modules[0] ?? null;

  return (
    <AppShell
      title="Modules"
      eyebrow="Module builder"
      userName={profile?.full_name}
      userRole={profile?.role}
      backHref="/admin"
      backLabel="Admin overview"
    >
      <section className="grid gap-5 lg:grid-cols-[280px_1fr_360px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Library</CardTitle>
            <CardDescription>Draft, published, and archived modules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {modules.map((module) => (
              <Button
                key={module.id}
                asChild
                variant={selectedModule?.id === module.id ? "secondary" : "ghost"}
                className="h-auto justify-start px-3 py-2 text-left"
              >
                <Link href={`/admin/modules?moduleId=${module.id}`}>
                  <span className="grid gap-1">
                    <span className="font-medium">{module.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {module.blocks.length} blocks - {module.status}
                    </span>
                  </span>
                </Link>
              </Button>
            ))}
            {modules.length === 0 ? <p className="text-sm text-muted-foreground">No modules yet.</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          {selectedModule ? (
            <>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{selectedModule.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {selectedModule.description || "No description yet."}
                    </CardDescription>
                  </div>
                  <StatusPill status={selectedModule.status === "published" ? "passed" : "in_progress"} />
                </CardHeader>
                <CardContent>
                  <form action={updateModuleDetails} className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="moduleId" value={selectedModule.id} />
                    <label className="grid gap-1 text-sm font-medium">
                      Title
                      <input
                        name="title"
                        required
                        defaultValue={selectedModule.title}
                        className={inputClassName}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Status
                      <select name="status" defaultValue={selectedModule.status} className={inputClassName}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium md:col-span-2">
                      Description
                      <textarea
                        name="description"
                        defaultValue={selectedModule.description}
                        className={textareaClassName}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Target audience
                      <input
                        name="targetAudience"
                        defaultValue={selectedModule.targetAudience}
                        placeholder="New tutors, existing tutors, EN tutors..."
                        className={inputClassName}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      Estimated minutes
                      <input
                        name="estimatedDurationMinutes"
                        type="number"
                        min="1"
                        defaultValue={selectedModule.estimatedDurationMinutes}
                        className={inputClassName}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <Button type="submit">
                        <FilePenLine className="h-4 w-4" />
                        Save details
                      </Button>
                      <StatusButton moduleId={selectedModule.id} status="draft" label="Save draft" />
                      <StatusButton moduleId={selectedModule.id} status="published" label="Publish" icon="publish" />
                      <StatusButton moduleId={selectedModule.id} status="archived" label="Archive" icon="archive" />
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Quick reading preview of the current block order.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {selectedModule.blocks.map((block) => (
                    <div key={block.id} className="rounded-md border bg-background p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {block.orderIndex}. {getBlockTypeLabel(block.blockType)} {block.isRequired ? "- Required" : "- Optional"}
                      </p>
                      <h3 className="mt-1 font-semibold">{block.title || getBlockTypeLabel(block.blockType)}</h3>
                      <BlockPreview block={block} />
                    </div>
                  ))}
                  {selectedModule.blocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add the first block using the form on the right.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Block constructor</CardTitle>
                  <CardDescription>Add, edit, duplicate, delete, and reorder approved block types.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {selectedModule.blocks.map((block, index) => (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      moduleId={selectedModule.id}
                      isFirst={index === 0}
                      isLast={index === selectedModule.blocks.length - 1}
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create your first module</CardTitle>
                <CardDescription>The module builder will appear after a module exists.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="grid gap-5 content-start">
          <Card>
            <CardHeader>
              <CardTitle>New module</CardTitle>
              <CardDescription>Create a draft module before adding blocks.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createModuleDraft} className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Title
                  <input name="title" required className={inputClassName} />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Description
                  <textarea name="description" className={textareaClassName} />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Target audience
                  <input name="targetAudience" className={inputClassName} />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Estimated minutes
                  <input name="estimatedDurationMinutes" type="number" min="1" defaultValue="15" className={inputClassName} />
                </label>
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  Create draft
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedModule ? (
            <Card>
              <CardHeader>
                <CardTitle>Add block</CardTitle>
                <CardDescription>Only block types approved in the spec are available.</CardDescription>
              </CardHeader>
              <CardContent>
                <BlockForm moduleId={selectedModule.id} action={createModuleBlock} submitLabel="Add block" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function StatusButton({
  moduleId,
  status,
  label,
  icon
}: {
  moduleId: string;
  status: "draft" | "published" | "archived";
  label: string;
  icon?: "publish" | "archive";
}) {
  const Icon = icon === "publish" ? UploadCloud : icon === "archive" ? Archive : Eye;
  return (
    <form action={updateModuleStatus}>
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="outline">
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}

function BlockEditor({
  block,
  moduleId,
  isFirst,
  isLast
}: {
  block: ModuleBlock;
  moduleId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-md border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">
              {block.orderIndex}. {block.title || getBlockTypeLabel(block.blockType)}
            </p>
            <p className="text-xs text-muted-foreground">{getBlockTypeLabel(block.blockType)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <MoveButton moduleId={moduleId} blockId={block.id} direction="up" disabled={isFirst} />
          <MoveButton moduleId={moduleId} blockId={block.id} direction="down" disabled={isLast} />
          <form action={duplicateModuleBlock}>
            <input type="hidden" name="moduleId" value={moduleId} />
            <input type="hidden" name="blockId" value={block.id} />
            <Button type="submit" size="sm" variant="outline" title="Duplicate block">
              <Copy className="h-4 w-4" />
            </Button>
          </form>
          <form action={deleteModuleBlock}>
            <input type="hidden" name="moduleId" value={moduleId} />
            <input type="hidden" name="blockId" value={block.id} />
            <Button type="submit" size="sm" variant="outline" title="Delete block">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      <BlockForm moduleId={moduleId} block={block} action={updateModuleBlock} submitLabel="Save block" />
    </div>
  );
}

function MoveButton({
  moduleId,
  blockId,
  direction,
  disabled
}: {
  moduleId: string;
  blockId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveModuleBlock}>
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="blockId" value={blockId} />
      <input type="hidden" name="direction" value={direction} />
      <Button type="submit" size="sm" variant="outline" disabled={disabled}>
        {direction === "up" ? "Up" : "Down"}
      </Button>
    </form>
  );
}

function BlockForm({
  moduleId,
  block,
  action,
  submitLabel
}: {
  moduleId: string;
  block?: ModuleBlock;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const content = block?.content ?? {};
  const blockType = block?.blockType ?? "simple_text";

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="moduleId" value={moduleId} />
      {block ? <input type="hidden" name="blockId" value={block.id} /> : null}
      <label className="grid gap-1 text-sm font-medium">
        Block type
        <select name="blockType" defaultValue={blockType} className={inputClassName}>
          {approvedModuleBlockTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Title
        <input name="title" defaultValue={block?.title} className={inputClassName} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Text, prompt, caption, or instructions
        <textarea name="body" defaultValue={getBodyDefault(blockType, content)} className={textareaClassName} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Media URL
        <input name="url" type="url" defaultValue={stringValue(content.url)} className={inputClassName} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Alt text
        <input name="altText" defaultValue={stringValue(content.altText)} className={inputClassName} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Items, choices, options, examples, or hotspots
        <textarea name="items" defaultValue={arrayValue(content.items ?? content.options ?? content.choices ?? content.examples ?? content.hotspots)} className={textareaClassName} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Quiz question type
          <select name="questionType" defaultValue={stringValue(content.questionType) || "single_choice"} className={inputClassName}>
            <option value="single_choice">Single choice</option>
            <option value="multiple_choice">Multiple choice</option>
            <option value="true_false">True / false</option>
            <option value="matching">Matching</option>
            <option value="short_answer">Short answer</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Passing score
          <input name="passingScore" type="number" min="1" max="100" defaultValue={numberValue(content.passingScore) ?? 80} className={inputClassName} />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Correct answers
        <textarea name="correctAnswers" defaultValue={arrayValue(content.correctAnswers)} className={textareaClassName} />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="isRequired" type="checkbox" defaultChecked={block?.isRequired ?? true} className="h-4 w-4" />
        Required for completion
      </label>
      <Button type="submit" variant={block ? "outline" : "default"}>
        <Plus className="h-4 w-4" />
        {submitLabel}
      </Button>
    </form>
  );
}

function BlockPreview({ block }: { block: ModuleBlock }) {
  const content = block.content;
  const text = getBodyDefault(block.blockType, content);
  const items = arrayValue(content.items ?? content.options ?? content.choices ?? content.examples ?? content.hotspots);

  return (
    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
      {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
      {stringValue(content.url) ? (
        <a href={stringValue(content.url)} target="_blank" rel="noreferrer" className="font-medium text-primary">
          {stringValue(content.url)}
        </a>
      ) : null}
      {items ? <p className="whitespace-pre-wrap">{items}</p> : null}
      {block.blockType === "quiz" ? (
        <p>
          {stringValue(content.questionType) || "single_choice"} - pass at {numberValue(content.passingScore) ?? 80}%
        </p>
      ) : null}
    </div>
  );
}

function getBodyDefault(blockType: ModuleBlockType, content: Record<string, unknown>) {
  if (blockType === "video") return stringValue(content.caption);
  if (blockType === "image" || blockType === "interactive_image") return stringValue(content.instructions);
  if (blockType === "open_answer" || blockType === "quiz") return stringValue(content.prompt);
  if (blockType === "good_bad_example") return stringValue(content.explanation);
  if (blockType === "scenario") return stringValue(content.scenario);
  return stringValue(content.text);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).join("\n") : "";
}

const inputClassName = "h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const textareaClassName = "min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

async function getAdminModuleBuilderData() {
  const supabase = await createClient();
  const [{ data: moduleRows }, { data: blockRows }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, summary, description, estimated_minutes, estimated_duration_minutes, target_audience, status")
      .order("updated_at", { ascending: false }),
    supabase
      .from("module_blocks")
      .select("id, module_id, block_type, order_index, title, content_json, is_required")
      .order("order_index", { ascending: true })
  ]);

  const blocks = (blockRows ?? []).map((block) => ({
    id: block.id,
    moduleId: block.module_id,
    blockType: block.block_type as ModuleBlockType,
    orderIndex: block.order_index,
    title: block.title ?? undefined,
    content: (block.content_json ?? {}) as Record<string, unknown>,
    isRequired: block.is_required
  }));

  return {
    modules: (moduleRows ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description ?? module.summary ?? "",
      estimatedDurationMinutes: module.estimated_duration_minutes ?? module.estimated_minutes ?? 15,
      targetAudience: module.target_audience ?? undefined,
      status: (module.status ?? "draft") as ModuleStatus,
      blocks: blocks.filter((block) => block.moduleId === module.id)
    })) satisfies BuilderModule[]
  };
}

function getBlockTypeLabel(type: ModuleBlockType) {
  return approvedModuleBlockTypes.find((item) => item.value === type)?.label ?? type;
}
