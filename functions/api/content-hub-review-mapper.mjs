export const CONTENT_SOURCES = Object.freeze([
  { key: "astrocyte", label: "Astrocyte Cell", dataSourceId: "cc5248c8-bfaf-4699-917e-b2f1ae73bbdf" },
  { key: "leukocyte", label: "Leukocyte Cell", dataSourceId: "67929a3c-e40d-46a9-b754-ce36480d652d" },
  { key: "plasma", label: "Plasma Cell", dataSourceId: "63fa4fd2-0c8c-4868-a142-76ec4e721758" },
  { key: "heart", label: "Heart Cell", dataSourceId: "c6d40e43-f732-49c3-bb36-18230a4a88ea" },
  { key: "brain", label: "Brain Cells", dataSourceId: "1653de24-5d4c-81bf-82f2-000bfcc30b24" },
  { key: "red-blood", label: "Red Blood Cell", dataSourceId: "9ea536d7-e219-4df0-8e9f-4eb9552055dd" },
  { key: "stem", label: "Stem Cells", dataSourceId: "c7c382d1-6067-446e-8651-d89c5b4ffff4" }
]);

function readPlainText(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((item) => item?.plain_text ?? item?.text?.content ?? "").join("").trim();
  }
  return "";
}

function readProperty(properties, name) {
  const property = properties?.[name];
  if (!property) return "";
  switch (property.type) {
    case "title":
      return readPlainText(property.title);
    case "rich_text":
      return readPlainText(property.rich_text);
    case "select":
      return property.select?.name ?? "";
    case "status":
      return property.status?.name ?? "";
    case "url":
      return property.url ?? "";
    case "number":
      return property.number == null ? "" : String(property.number);
    case "checkbox":
      return property.checkbox === true ? "نعم" : "لا";
    case "date":
      return property.date?.start ?? "";
    default:
      return "";
  }
}

function readRelationIds(properties, name) {
  const relation = properties?.[name];
  return relation?.type === "relation" && Array.isArray(relation.relation)
    ? relation.relation.map((item) => item.id).filter(Boolean)
    : [];
}

function cleanTitle(value) {
  return String(value ?? "")
    .replace(/<\/?(?:p|div|span|strong|em|br)[^>]*>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyPost(postStatus) {
  const status = String(postStatus ?? "").trim();
  if (status === "تم نشره") return "archive";
  if (status === "جاهز للنشر" || status === "بالتنسيق") return "active";
  return "needs_review";
}

export function mapNotionPost(page, source) {
  const properties = page?.properties ?? {};
  const postStatus = readProperty(properties, "حالة البوست");
  const workflowStatus = readProperty(properties, "الحالة");
  const publishUrl = readProperty(properties, "رابط البوست") || readProperty(properties, "الرابط");

  return {
    source_page_id: String(page?.id ?? ""),
    source_page_url: String(page?.url ?? ""),
    source_cell: source.label,
    source_cell_key: source.key,
    title: cleanTitle(readProperty(properties, "Name")) || "منشور بلا عنوان",
    post_status: postStatus,
    workflow_status: workflowStatus,
    bucket: classifyPost(postStatus),
    written_at: readProperty(properties, "تاريخ كتابة البوست") || readProperty(properties, "Date"),
    published_at: readProperty(properties, "تاريخ نشر البوست"),
    coordinated_at: readProperty(properties, "تاريخ التنسيق"),
    designed_at: readProperty(properties, "تاريخ التصميم"),
    publication_method: readProperty(properties, "طريقة نشره"),
    design_required: readProperty(properties, "التصميم") || readProperty(properties, "تصميم"),
    publish_url: publishUrl,
    writer_relation_ids: [
      ...readRelationIds(properties, "اسم كاتب المنشور"),
      ...readRelationIds(properties, "اسم كاتب البوست")
    ],
    coordinator_relation_ids: readRelationIds(properties, "اسم المنسق"),
    designer_relation_ids: readRelationIds(properties, "اسم المصمم"),
    source_created_at: page?.created_time ?? "",
    source_updated_at: page?.last_edited_time ?? ""
  };
}
