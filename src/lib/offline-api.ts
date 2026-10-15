// OFFLINE API LAYER: intercepts window.fetch("/api/*...") and serves every
// endpoint from the on-device SQLite database, replicating the Postgres API
// contracts 1:1 (same payload keys, same response shapes, same error codes).
//
// - `installOfflineBridge()` is a module-load side effect that runs ONLY in a
//   Capacitor native WebView (window exists + Capacitor.isNativePlatform()). It
//   must be in place before any page effect fires, hence the top-level call.
// - All handler SQL is string-built with an escaper (no prepared-statement
//   quirks), which is safe here because every input is the user's own device.
import {
  queryRows,
  runSql,
  insertRow,
  updateById,
  deleteById,
  getById,
  exportAll,
  restoreAll,
  resetAllData,
  getCapital,
  setCapital,
  getSummary,
  postEntry,
  type TreasurySummary,
  type BackupData,
  isNative,
  initOfflineDB,
  nowIso,
  todayIso,
  BACKUP_KEYS,
} from "@/db/local";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function fail(message: string, status = 500): Response {
  return json({ error: message }, status);
}
function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
}
const numOf = (b: Record<string, unknown>, k: string): number => parseFloat(String(b[k] ?? "0")) || 0;
const strOf = (b: Record<string, unknown>, k: string): string | null => {
  const v = b[k];
  return v === undefined || v === null || v === "" ? null : String(v);
};

// ---------------------------------------------------------------------------
// Code generation (mirror of /api/purchases nextCode)
// ---------------------------------------------------------------------------
const CODE_PREFIX: Record<string, string> = { cow: "COW", sheep: "SHP", goat: "GOT", chicken: "CHK", quail: "QAL" };
async function nextCode(type: string): Promise<string> {
  const prefix = CODE_PREFIX[type] || "ANM";
  const rows = await queryRows<{ tag: string | null }>(
    `SELECT tag_number AS tag FROM animals WHERE tag_number LIKE ${esc(`${prefix}-%`)}`
  );
  let max = 0;
  for (const r of rows) {
    const m = r.tag ? r.tag.match(/-(\d+)$/) : null;
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
async function getAnimals(req: Request, url: URL): Promise<Response> {
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  let sql = "SELECT * FROM animals";
  const conds: string[] = [];
  if (type) conds.push(`type = ${esc(type)}`);
  if (status) conds.push(`status = ${esc(status)}`);
  if (conds.length > 0) sql += ` WHERE ${conds.join(" AND ")}`;
  sql += " ORDER BY created_at DESC";
  return json(await queryRows(sql));
}

async function postAnimal(body: Record<string, unknown>): Promise<Response> {
  const id = await insertRow("animals", {
    name: body.name,
    type: body.type,
    breed: strOf(body, "breed"),
    birthDate: strOf(body, "birthDate"),
    gender: strOf(body, "gender"),
    weight: strOf(body, "weight"),
    purchasePrice: strOf(body, "purchasePrice"),
    purchaseDate: strOf(body, "purchaseDate"),
    status: strOf(body, "status") || "active",
    notes: strOf(body, "notes"),
    tagNumber: strOf(body, "tagNumber"),
    createdAt: nowIso(),
  });
  return json(await getById("animals", id));
}

async function getAnimal(id: number): Promise<Response> {
  const row = await getById("animals", id);
  if (!row) return fail("Not found", 404);
  return json(row);
}

async function putAnimal(id: number, body: Record<string, unknown>): Promise<Response> {
  await updateById("animals", id, {
    name: body.name,
    type: body.type,
    breed: strOf(body, "breed"),
    birthDate: strOf(body, "birthDate"),
    gender: strOf(body, "gender"),
    weight: strOf(body, "weight"),
    purchasePrice: strOf(body, "purchasePrice"),
    purchaseDate: strOf(body, "purchaseDate"),
    status: strOf(body, "status") || "active",
    teeth: strOf(body, "teeth"),
    ageText: strOf(body, "ageText"),
    lifeStage: strOf(body, "lifeStage") || "adult",
    purpose: strOf(body, "purpose"),
    notes: strOf(body, "notes"),
    tagNumber: strOf(body, "tagNumber"),
    updatedAt: nowIso(),
  });
  return json(await getById("animals", id));
}

// ---- contacts ----
async function getContacts(): Promise<Response> {
  return json(await queryRows("SELECT * FROM contacts ORDER BY name ASC"));
}
async function postContact(body: Record<string, unknown>): Promise<Response> {
  const id = await insertRow("contacts", {
    name: body.name,
    type: strOf(body, "type") || "both",
    phone: strOf(body, "phone"),
    email: strOf(body, "email"),
    address: strOf(body, "address"),
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  return json(await getById("contacts", id));
}
async function putContact(id: number, body: Record<string, unknown>): Promise<Response> {
  await updateById("contacts", id, {
    name: body.name,
    type: body.type,
    phone: strOf(body, "phone"),
    email: strOf(body, "email"),
    address: strOf(body, "address"),
    notes: strOf(body, "notes"),
  });
  return json(await getById("contacts", id));
}

// ---- purchases ----
async function getPurchases(): Promise<Response> {
  return json(await queryRows("SELECT * FROM purchases ORDER BY date DESC, created_at DESC"));
}
async function postPurchase(body: Record<string, unknown>): Promise<Response> {
  const payMode = body.paymentMethod === "debt" ? "debt" : "cash";
  const total = numOf(body, "totalAmount");

  if (payMode === "cash") {
    const s = await getSummary();
    if (s.balance < total) return fail("INSUFFICIENT_FUNDS", 400);
  }
  if (payMode === "debt") {
    const supplierId = body.supplierId ? Number(body.supplierId) : 0;
    if (!supplierId) return fail("SUPPLIER_REQUIRED", 400);
    const sup = await queryRows<{ id: number }>(`SELECT id FROM contacts WHERE id = ${esc(supplierId)} LIMIT 1`);
    if (sup.length === 0) return fail("SUPPLIER_REQUIRED", 400);
  }

  const purchaseId = await insertRow("purchases", {
    date: body.date,
    category: body.category,
    description: body.description,
    quantity: strOf(body, "quantity"),
    unit: strOf(body, "unit"),
    unitPrice: strOf(body, "unitPrice"),
    totalAmount: body.totalAmount,
    supplierId: body.supplierId ? Number(body.supplierId) : null,
    animalType: strOf(body, "animalType"),
    animalId: body.animalId ? Number(body.animalId) : null,
    paymentStatus: strOf(body, "paymentStatus") || (payMode === "debt" ? "pending" : "paid"),
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });

  const list = Array.isArray(body.animalsList) ? (body.animalsList as Record<string, unknown>[]) : [];
  const batchGroup = body.batchGroup === true && list.length > 1;
  if (body.category === "animal" && list.length > 0) {
    let firstId: number | null = null;
    const refs: Record<string, number> = {};
    for (const a of list) {
      const code = await nextCode(String(a.type || body.animalType || "cow"));
      const animalId = await insertRow("animals", {
        name: strOf(a, "name") || code,
        type: strOf(a, "type") || body.animalType || "cow",
        breed: strOf(a, "breed"),
        birthDate: strOf(a, "birthDate"),
        gender: strOf(a, "gender"),
        weight: strOf(a, "weight"),
        teeth: strOf(a, "teeth"),
        ageText: strOf(a, "ageText"),
        lifeStage: strOf(a, "lifeStage") || "adult",
        purpose: strOf(a, "purpose"),
        purchasePrice: strOf(a, "price"),
        purchaseDate: body.date,
        status: "active",
        notes: strOf(a, "notes") || strOf(body, "notes"),
        tagNumber: code,
        motherAnimalId: a.motherId ? Number(a.motherId) : a.motherRef && refs[String(a.motherRef)] ? refs[String(a.motherRef)] : null,
        batchId: batchGroup ? purchaseId : undefined,
      });
      if (a.ref) refs[String(a.ref)] = animalId;
      if (!firstId) firstId = animalId;
    }
    if (firstId) await runSql(`UPDATE purchases SET animal_id = ${esc(firstId)} WHERE id = ${esc(purchaseId)}`);
  } else if (body.category === "animal" && body.animalName) {
    const code = await nextCode(String(body.animalType || "cow"));
    const animalId = await insertRow("animals", {
      name: body.animalName,
      type: body.animalType,
      breed: strOf(body, "animalBreed"),
      gender: strOf(body, "animalGender"),
      weight: strOf(body, "quantity"),
      purchasePrice: body.totalAmount,
      purchaseDate: body.date,
      status: "active",
      notes: strOf(body, "notes"),
      tagNumber: code,
    });
    await runSql(`UPDATE purchases SET animal_id = ${esc(animalId)} WHERE id = ${esc(purchaseId)}`);
  }

  if (body.category === "feed" && body.quantity != null && body.quantity !== "") {
    const qty = numOf(body, "quantity");
    if (body.feedId) {
      const feedId = Number(body.feedId);
      await insertRow("feed_transactions", {
        date: body.date,
        feedId,
        feedName: strOf(body, "feedName") || String(body.description),
        transactionType: "in",
        quantity: qty,
        unit: strOf(body, "unit") || "kg",
        cost: body.totalAmount,
        animalType: strOf(body, "animalType"),
        notes: `شراء: ${body.description}`,
        createdAt: nowIso(),
      });
      await runSql(`UPDATE feed_stock SET quantity = quantity + ${esc(qty)}, updated_at = ${esc(nowIso())} WHERE id = ${esc(feedId)}`);
    } else if (body.feedName) {
      await insertRow("feed_stock", {
        name: body.feedName,
        type: strOf(body, "feedType") || "other",
        quantity: qty,
        unit: strOf(body, "unit") || "kg",
        unitCost: strOf(body, "unitPrice"),
        minQuantity: "0",
        animalType: strOf(body, "animalType"),
        notes: `شراء: ${body.description}`,
        updatedAt: nowIso(),
      });
    }
  }

  const desc = String(body.description);
  await insertRow("expenses", {
    date: body.date,
    category: body.category === "feed" ? "feed" : "purchase",
    description: body.category === "feed" ? `غذاء: ${desc}` : `شراء: ${desc}`,
    amount: body.totalAmount,
    animalType: strOf(body, "animalType"),
    paymentMethod: payMode,
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });

  if (payMode === "cash") {
    await postEntry({
      date: String(body.date),
      type: "expense",
      category: body.category === "feed" ? "feed" : "purchase",
      description: body.category === "feed" ? `غذاء: ${desc}` : `شراء: ${desc}`,
      amount: numOf(body, "totalAmount"),
      referenceType: "purchase",
      referenceId: purchaseId,
    });
  } else {
    const supplier = body.supplierId ? await getById("contacts", Number(body.supplierId)) : undefined;
    await insertRow("debts", {
      date: body.date,
      type: "we_owe",
      contactId: body.supplierId ? Number(body.supplierId) : null,
      contactName: supplier?.name || "مورّد",
      description: `شراء بالدين: ${desc}`,
      totalAmount: body.totalAmount,
      paidAmount: "0",
      status: "pending",
      notes: strOf(body, "notes"),
      createdAt: nowIso(),
    });
  }

  const purchase = await getById("purchases", purchaseId);
  return json(purchase);
}
async function putPurchase(id: number, body: Record<string, unknown>): Promise<Response> {
  await updateById("purchases", id, {
    date: body.date,
    category: body.category,
    description: body.description,
    quantity: strOf(body, "quantity"),
    unit: strOf(body, "unit"),
    unitPrice: strOf(body, "unitPrice"),
    totalAmount: body.totalAmount,
    supplierId: body.supplierId ? Number(body.supplierId) : null,
    animalType: strOf(body, "animalType"),
    paymentStatus: strOf(body, "paymentStatus") || "paid",
    notes: strOf(body, "notes"),
  });
  return json(await getById("purchases", id));
}

// ---- sales ----
async function getSales(): Promise<Response> {
  return json(await queryRows("SELECT * FROM sales ORDER BY date DESC, created_at DESC"));
}
async function postSale(body: Record<string, unknown>): Promise<Response> {
  const payMode = body.paymentMethod === "debt" ? "debt" : "cash";
  if (payMode === "debt" && !body.customerId) return fail("CUSTOMER_REQUIRED", 400);

  const desc = String(body.description);
  const customerId = body.customerId ? Number(body.customerId) : null;
  const date = String(body.date);
  const notes = strOf(body, "notes");
  const animalsList = Array.isArray(body.animals) ? (body.animals as Record<string, unknown>[]) : [];
  const multi = body.category === "animal" && animalsList.length > 0;
  const saleIds: number[] = [];

  if (multi) {
    for (const a of animalsList) {
      const animalId = Number(a.id);
      if (!animalId) continue;
      const animal = await getById("animals", animalId);
      const price = numOf(a, "price");
      const saleId = await insertRow("sales", {
        date,
        category: "animal",
        description: `بيع ${animal?.name ? String(animal.name) : `#${animalId}`}`,
        quantity: "1",
        unit: "رأس",
        unitPrice: price ? String(price) : null,
        totalAmount: String(price),
        customerId,
        animalType: strOf(animal ?? {}, "type") || strOf(body, "animalType") || "cow",
        animalId,
        productType: null,
        paymentStatus: payMode === "debt" ? "pending" : "paid",
        notes,
        createdAt: nowIso(),
      });
      saleIds.push(saleId);
      await runSql(`UPDATE animals SET status = 'sold', updated_at = ${esc(nowIso())} WHERE id = ${esc(animalId)}`);
    }
  } else {
    const saleId = await insertRow("sales", {
      date,
      category: body.category,
      description: desc,
      quantity: strOf(body, "quantity"),
      unit: strOf(body, "unit"),
      unitPrice: strOf(body, "unitPrice"),
      totalAmount: body.totalAmount,
      customerId,
      animalType: strOf(body, "animalType"),
      animalId: body.animalId ? Number(body.animalId) : null,
      productType: strOf(body, "productType"),
      paymentStatus: strOf(body, "paymentStatus") || (payMode === "debt" ? "pending" : "paid"),
      notes,
      createdAt: nowIso(),
    });
    saleIds.push(saleId);
    if (body.category === "animal" && body.animalId) {
      await runSql(`UPDATE animals SET status = 'sold', updated_at = ${esc(nowIso())} WHERE id = ${esc(Number(body.animalId))}`);
    }
  }

  const totalAmount = multi
    ? animalsList.reduce((s, a) => s + numOf(a, "price"), 0)
    : numOf(body, "totalAmount");

  if (payMode === "cash") {
    await postEntry({
      date,
      type: "income",
      category: body.category === "animal" ? "animal_sale" : "production_sale",
      description: `بيع: ${desc}`,
      amount: totalAmount,
      referenceType: "sale",
      referenceId: saleIds[0] ?? null,
    });
  } else {
    const customer = customerId ? await getById("contacts", customerId) : undefined;
    await insertRow("debts", {
      date,
      type: "owed_to_us",
      contactId: customerId,
      contactName: customer?.name || "عميل",
      description: `بيع بالدين: ${desc}`,
      totalAmount: String(totalAmount),
      paidAmount: "0",
      status: "pending",
      notes,
      createdAt: nowIso(),
    });
  }
  return json(await getById("sales", saleIds[saleIds.length - 1]));
}
async function putSale(id: number, body: Record<string, unknown>): Promise<Response> {
  await updateById("sales", id, {
    date: body.date,
    category: body.category,
    description: body.description,
    quantity: strOf(body, "quantity"),
    unit: strOf(body, "unit"),
    unitPrice: strOf(body, "unitPrice"),
    totalAmount: body.totalAmount,
    customerId: body.customerId ? Number(body.customerId) : null,
    animalType: strOf(body, "animalType"),
    paymentStatus: strOf(body, "paymentStatus") || "paid",
    notes: strOf(body, "notes"),
  });
  return json(await getById("sales", id));
}

// ---- expenses ----
async function getExpenses(): Promise<Response> {
  return json(await queryRows("SELECT * FROM expenses ORDER BY date DESC, created_at DESC"));
}
async function postExpense(body: Record<string, unknown>): Promise<Response> {
  const amount = numOf(body, "amount");
  const s = await getSummary();
  if (s.balance < amount) return fail("INSUFFICIENT_FUNDS", 400);
  const id = await insertRow("expenses", {
    date: body.date,
    category: body.category,
    description: body.description,
    amount: body.amount,
    animalType: strOf(body, "animalType"),
    paymentMethod: strOf(body, "paymentMethod") || "cash",
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  await postEntry({
    date: String(body.date),
    type: "expense",
    category: String(body.category),
    description: String(body.description),
    amount: numOf(body, "amount"),
    referenceType: "expense",
    referenceId: id,
  });
  return json(await getById("expenses", id));
}

// ---- incomes ----
async function getIncomes(): Promise<Response> {
  return json(await queryRows("SELECT * FROM incomes ORDER BY date DESC, created_at DESC"));
}
async function postIncome(body: Record<string, unknown>): Promise<Response> {
  const id = await insertRow("incomes", {
    date: body.date,
    category: body.category,
    description: body.description,
    amount: body.amount,
    animalType: strOf(body, "animalType"),
    customerId: body.customerId ? Number(body.customerId) : null,
    paymentMethod: strOf(body, "paymentMethod") || "cash",
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  await postEntry({
    date: String(body.date),
    type: "income",
    category: String(body.category),
    description: String(body.description),
    amount: numOf(body, "amount"),
    referenceType: "income",
    referenceId: id,
  });
  return json(await getById("incomes", id));
}

// ---- feed ----
async function getFeed(): Promise<Response> {
  const stock = await queryRows("SELECT * FROM feed_stock ORDER BY updated_at DESC");
  const transactions = await queryRows("SELECT * FROM feed_transactions ORDER BY date DESC, created_at DESC LIMIT 50");
  const allocations = await queryRows("SELECT * FROM feed_allocations ORDER BY date DESC LIMIT 500");
  return json({ stock, transactions, allocations });
}
async function postFeed(body: Record<string, unknown>): Promise<Response> {
  const action = body.action;
  if (action === "add_stock") {
    const id = await insertRow("feed_stock", {
      name: body.name,
      type: body.type,
      quantity: strOf(body, "quantity") || "0",
      unit: strOf(body, "unit") || "kg",
      unitCost: strOf(body, "unitCost"),
      minQuantity: strOf(body, "minQuantity") || "0",
      maxQuantity: BodyMax(body) ,
      animalType: strOf(body, "animalType"),
      notes: strOf(body, "notes"),
      updatedAt: nowIso(),
    });
    return json(await getById("feed_stock", id));
  }
  if (action === "update_stock") {
    const feedId = Number(body.feedId);
    const sets: string[] = [];
    if (strOf(body, "name")) sets.push(`name = ${esc(body.name)}`);
    sets.push(`max_quantity = ${esc(body.maxQuantity || null)}`);
    if (body.minQuantity !== undefined && body.minQuantity !== null) sets.push(`min_quantity = ${esc(body.minQuantity)}`);
    sets.push(`updated_at = ${esc(nowIso())}`);
    await runSql(`UPDATE feed_stock SET ${sets.join(", ")} WHERE id = ${esc(feedId)}`);
    return json(await getById("feed_stock", feedId));
  }
  if (action === "transaction") {
    let unitCost: string | null = strOf(body, "cost");
    if (body.transactionType === "out" && body.feedId && !unitCost) {
      const item = await getById("feed_stock", Number(body.feedId));
      if (item?.unitCost) unitCost = String(numOf(body, "quantity") * numOf(item, "unitCost"));
    }
    const txId = await insertRow("feed_transactions", {
      date: body.date,
      feedId: body.feedId ? Number(body.feedId) : null,
      feedName: body.feedName,
      transactionType: body.transactionType,
      quantity: body.quantity,
      unit: body.unit,
      cost: unitCost,
      animalType: strOf(body, "animalType"),
      headcount: null,
      perHeadQty: null,
      notes: strOf(body, "notes"),
      createdAt: nowIso(),
    });

    let tx = await getById("feed_transactions", txId);
    if (body.transactionType === "out") {
      const eligible = await eligibleAnimalsArray(body.animalType ? String(body.animalType) : null, String(body.date));
      if (eligible.length > 0) {
        const perHead = numOf(body, "quantity") / eligible.length;
        await runSql(`UPDATE feed_transactions SET headcount = ${esc(eligible.length)}, per_head_qty = ${esc(perHead)} WHERE id = ${esc(txId)}`);
        tx = await getById("feed_transactions", txId);
        for (const a of eligible) {
          await insertRow("feed_allocations", {
            transactionId: txId,
            animalId: a.id,
            date: body.date,
            quantity: perHead,
            unit: body.unit,
            createdAt: nowIso(),
          });
        }
      }
    }

    if (body.feedId) {
      const feedId = Number(body.feedId);
      const qty = numOf(body, "quantity");
      if (body.transactionType === "in") {
        await runSql(`UPDATE feed_stock SET quantity = quantity + ${esc(qty)}, updated_at = ${esc(nowIso())} WHERE id = ${esc(feedId)}`);
      } else {
        await runSql(`UPDATE feed_stock SET quantity = MAX(0.0, quantity - ${esc(qty)}), updated_at = ${esc(nowIso())} WHERE id = ${esc(feedId)}`);
      }
    }
    return json(tx);
  }
  return fail("Invalid action", 400);
}
// feed add_stock maxQuantity: body.maxQuantity || body.quantity || null (mirror of the server route)
function BodyMax(body: Record<string, unknown>): unknown {
  return body.maxQuantity || body.quantity || null;
}
async function eligibleAnimalsArray(animalType: string | null, date: string): Promise<Record<string, unknown>[]> {
  let sql = `SELECT * FROM animals WHERE status = 'active' AND (purchase_date IS NULL OR purchase_date <= ${esc(date)}) AND (birth_date IS NULL OR birth_date <= ${esc(date)})`;
  if (animalType) sql += ` AND type = ${esc(animalType)}`;
  return queryRows(sql);
}

// ---- health ----
async function getHealthRecords(): Promise<Response> {
  return json(await queryRows("SELECT * FROM health_records ORDER BY date DESC, created_at DESC"));
}
async function postHealthRecord(body: Record<string, unknown>): Promise<Response> {
  const totalCost = body.totalCost != null && body.totalCost !== ""
    ? String(body.totalCost)
    : String(numOf(body, "medicineCost") + numOf(body, "vetCost"));
  const id = await insertRow("health_records", {
    date: body.date,
    animalId: body.animalId ? Number(body.animalId) : null,
    animalType: strOf(body, "animalType"),
    recordType: body.recordType,
    description: body.description,
    diagnosis: strOf(body, "diagnosis"),
    treatment: strOf(body, "treatment"),
    medicine: strOf(body, "medicine"),
    medicineCost: strOf(body, "medicineCost"),
    vetName: strOf(body, "vetName"),
    vetCost: strOf(body, "vetCost"),
    totalCost: parseFloat(totalCost) > 0 ? totalCost : null,
    nextVisitDate: strOf(body, "nextVisitDate"),
    status: strOf(body, "status") || "healthy",
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });

  const cost = parseFloat(totalCost);
  if (cost > 0) {
    const desc = String(body.description);
    await insertRow("expenses", {
      date: body.date,
      category: "health",
      description: `بيطرة: ${desc}`,
      amount: totalCost,
      animalType: strOf(body, "animalType"),
      paymentMethod: "cash",
      notes: strOf(body, "notes"),
      createdAt: nowIso(),
    });
    await postEntry({
      date: String(body.date),
      type: "expense",
      category: "health",
      description: `بيطرة: ${desc}`,
      amount: totalCost,
      referenceType: "health",
      referenceId: id,
    });
  }
  return json(await getById("health_records", id));
}

// ---- births ----
async function getBirths(): Promise<Response> {
  return json(await queryRows("SELECT * FROM births ORDER BY date DESC, created_at DESC"));
}
async function postBirth(body: Record<string, unknown>): Promise<Response> {
  if (body.mode === "batch") {
    const count = Math.max(1, parseInt(String(body.chickCount || "1"), 10) || 1);
    const batchName = strOf(body, "batchName") || "دفعة";
    const birthId = await insertRow("births", {
      date: body.date,
      motherId: body.motherId ? Number(body.motherId) : null,
      fatherId: null,
      motherName: strOf(body, "motherName"),
      fatherName: null,
      childName: batchName,
      childType: body.childType,
      childGender: null,
      childBreed: strOf(body, "childBreed"),
      birthWeight: null,
      childAnimalId: null,
      batchName,
      quantity: String(count),
      status: "alive",
      notes: strOf(body, "notes"),
      createdAt: nowIso(),
    });
    for (let i = 0; i < count; i++) {
      await insertRow("animals", {
        name: `${batchName} ${i + 1}`,
        type: body.childType,
        breed: strOf(body, "childBreed"),
        birthDate: body.date,
        gender: null,
        status: "active",
        lifeStage: "chick",
        batchId: birthId,
        notes: `فرخ من دفعة ${batchName}`,
        motherAnimalId: body.motherId ? Number(body.motherId) : null,
      });
    }
    return json(await getById("births", birthId));
  }

  let childAnimalId: number | null = null;
  if (body.status !== "dead") {
    childAnimalId = await insertRow("animals", {
      name: body.childName,
      type: body.childType,
      breed: strOf(body, "childBreed"),
      birthDate: body.date,
      gender: strOf(body, "childGender"),
      weight: strOf(body, "birthWeight"),
      status: "active",
      lifeStage: "adult",
      notes: body.notes ? `مولود: ${body.notes}` : "مولود جديد",
      motherAnimalId: body.motherId ? Number(body.motherId) : null,
    });
  }
  const birthId = await insertRow("births", {
    date: body.date,
    motherId: body.motherId ? Number(body.motherId) : null,
    fatherId: body.fatherId ? Number(body.fatherId) : null,
    motherName: strOf(body, "motherName"),
    fatherName: strOf(body, "fatherName") || strOf(body, "fatherExternal"),
    childName: body.childName,
    childType: body.childType,
    childGender: strOf(body, "childGender"),
    childBreed: strOf(body, "childBreed"),
    birthWeight: strOf(body, "birthWeight"),
    childAnimalId,
    quantity: "1",
    status: strOf(body, "status") || "alive",
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  return json(await getById("births", birthId));
}

// ---- debts ----
function debtStatus(total: number, paid: number): string {
  if (paid >= total) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}
async function getDebts(): Promise<Response> {
  return json(await queryRows("SELECT * FROM debts ORDER BY date DESC, created_at DESC"));
}
async function postDebt(body: Record<string, unknown>): Promise<Response> {
  const id = await insertRow("debts", {
    date: body.date,
    type: body.type,
    contactId: body.contactId ? Number(body.contactId) : null,
    contactName: body.contactName,
    description: body.description,
    totalAmount: body.totalAmount,
    paidAmount: strOf(body, "paidAmount") || "0",
    dueDate: strOf(body, "dueDate"),
    status: strOf(body, "status") || "pending",
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  return json(await getById("debts", id));
}
async function putDebt(id: number, body: Record<string, unknown>): Promise<Response> {
  const totalAmount = numOf(body, "totalAmount");
  const paidAmount = numOf(body, "paidAmount");
  await updateById("debts", id, {
    date: body.date,
    type: body.type,
    contactId: body.contactId ? Number(body.contactId) : null,
    contactName: body.contactName,
    description: body.description,
    totalAmount: body.totalAmount,
    paidAmount: body.paidAmount || "0",
    dueDate: strOf(body, "dueDate"),
    status: debtStatus(totalAmount, paidAmount),
    notes: strOf(body, "notes"),
    updatedAt: nowIso(),
  });
  return json(await getById("debts", id));
}

// ---- treasury ----
async function getTreasury(): Promise<Response> {
  const summary = await getSummary();
  const ledger = await queryRows("SELECT * FROM treasury ORDER BY date DESC, created_at DESC LIMIT 100");
  const allDebts = await queryRows<{ type: string; status: string; totalAmount: unknown; paidAmount: unknown; [k: string]: unknown }>(
    "SELECT * FROM debts ORDER BY date DESC, created_at DESC"
  );
  const weOwe = allDebts.filter((d) => d.type === "we_owe" && d.status !== "paid");
  const owedToUs = allDebts.filter((d) => d.type === "owed_to_us" && d.status !== "paid");
  const sumRemain = (arr: typeof allDebts) =>
    arr.reduce((s, d) => s + (numOf(d, "totalAmount") - numOf(d, "paidAmount")), 0);
  return json({
    ...summary,
    ledger,
    debts: allDebts,
    weOweTotal: sumRemain(weOwe),
    owedToUsTotal: sumRemain(owedToUs),
  });
}
async function postTreasury(body: Record<string, unknown>): Promise<Response> {
  const action = body.action;
  if (action === "set_capital") {
    await setCapital(String(body.amount || "0"));
    return json(await getSummary());
  }
  if (action === "adjust") {
    if (!body.amount || !body.date) return fail("Missing fields", 400);
    if (body.type === "expense") {
      const s = await getSummary();
      if (s.balance < parseFloat(String(body.amount))) return fail("INSUFFICIENT_FUNDS", 400);
    }
    const row = await postEntry({
      date: String(body.date),
      type: String(body.type) === "expense" ? "expense" : "income",
      category: strOf(body, "category") || "adjust",
      description: strOf(body, "description") || "تسوية يدوية",
      amount: String(body.amount),
      notes: strOf(body, "notes"),
    });
    return json(row);
  }
  if (action === "pay_debt") {
    const debt = await getById("debts", Number(body.debtId));
    if (!debt) return fail("Debt not found", 404);
    const amount = parseFloat(String(body.amount || "0"));
    if (!amount || amount <= 0) return fail("Invalid amount", 400);
    const s = await getSummary();
    if (s.balance < amount) return fail("INSUFFICIENT_FUNDS", 400);
    const paid = numOf(debt, "paidAmount") + amount;
    const total = numOf(debt, "totalAmount");
    await updateById("debts", Number(debt.id), {
      paidAmount: String(Math.min(paid, total)),
      status: debtStatus(total, paid),
      updatedAt: nowIso(),
    });
    await postEntry({
      date: strOf(body, "date") || todayIso(),
      type: "expense",
      category: "debt",
      description: `تسديد دين: ${debt.description}`,
      amount: String(amount),
      referenceType: "debt",
      referenceId: Number(debt.id),
    });
    return json({ success: true });
  }
  if (action === "collect_debt") {
    const debt = await getById("debts", Number(body.debtId));
    if (!debt) return fail("Debt not found", 404);
    const amount = parseFloat(String(body.amount || "0"));
    if (!amount || amount <= 0) return fail("Invalid amount", 400);
    const paid = numOf(debt, "paidAmount") + amount;
    const total = numOf(debt, "totalAmount");
    await updateById("debts", Number(debt.id), {
      paidAmount: String(Math.min(paid, total)),
      status: debtStatus(total, paid),
      updatedAt: nowIso(),
    });
    await postEntry({
      date: strOf(body, "date") || todayIso(),
      type: "income",
      category: "debt",
      description: `تحصيل دين: ${debt.description}`,
      amount: String(amount),
      referenceType: "debt",
      referenceId: Number(debt.id),
    });
    return json({ success: true });
  }
  return fail("Invalid action", 400);
}

// ---- settings ----
async function getSettings(): Promise<Response> {
  const rows = await queryRows<{ key: string | null; value: string | null }>("SELECT * FROM settings");
  const map: Record<string, string> = {};
  for (const s of rows) {
    if (s.key && s.value) map[s.key] = s.value;
  }
  return json(map);
}
async function postSettings(body: Record<string, unknown>): Promise<Response> {
  for (const [key, value] of Object.entries(body)) {
    const exists = await queryRows<{ id: number }>(`SELECT id FROM settings WHERE key = ${esc(key)} LIMIT 1`);
    if (exists.length > 0) {
      await runSql(`UPDATE settings SET value = ${esc(value)}, updated_at = ${esc(nowIso())} WHERE key = ${esc(key)}`);
    } else {
      await insertRow("settings", { key, value: String(value), updatedAt: nowIso() });
    }
  }
  return json({ success: true });
}

// ---- dashboard ----
async function getDashboard(): Promise<Response> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

  const animalCounts = await queryRows<{ type: string; count: number }>(
    `SELECT type, COUNT(*) AS count FROM animals WHERE status = 'active' GROUP BY type`
  );
  const totalAnimals = animalCounts.reduce((sum, a) => sum + a.count, 0);

  const monthlyPurchases = await queryRows<{ total: number }>(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchases WHERE date >= ${esc(startOfMonth)}`);
  const monthlySales = await queryRows<{ total: number }>(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales WHERE date >= ${esc(startOfMonth)}`);
  const monthlyExpenses = await queryRows<{ total: number }>(`SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE date >= ${esc(startOfMonth)}`);
  const monthlyIncomes = await queryRows<{ total: number }>(`SELECT COALESCE(SUM(amount), 0) AS total FROM incomes WHERE date >= ${esc(startOfMonth)}`);

  const yearlyIncome = await queryRows<{ total: number }>(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales WHERE date >= ${esc(startOfYear)}`);
  const yearlyExpenseAll = await queryRows<{ total: number }>(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchases WHERE date >= ${esc(startOfYear)}`);

  const pendingDebts = await queryRows<{ type: string; total: number }>(
    `SELECT type, COALESCE(SUM(total_amount - paid_amount), 0) AS total FROM debts WHERE status != 'paid' GROUP BY type`
  );

  const recentHealth = await queryRows("SELECT * FROM health_records ORDER BY created_at DESC LIMIT 3");
  const lowFeed = await queryRows("SELECT * FROM feed_stock WHERE quantity <= min_quantity LIMIT 5");

  const monthlyTreasury = await queryRows<{ type: string; total: number }>(
    `SELECT type, COALESCE(SUM(amount), 0) AS total FROM treasury WHERE date >= ${esc(startOfMonth)} GROUP BY type`
  );
  const treasurySummary = await getSummary();
  const treasuryMonthIn = monthlyTreasury.find((r) => r.type === "income")?.total ?? 0;
  const treasuryMonthOut = monthlyTreasury.find((r) => r.type === "expense")?.total ?? 0;

  return json({
    animals: { total: totalAnimals, byType: animalCounts },
    treasury: {
      capital: treasurySummary.capital,
      balance: treasurySummary.balance,
      monthIn: treasuryMonthIn,
      monthOut: treasuryMonthOut,
    },
    monthly: {
      income: (monthlySales[0]?.total ?? 0) + (monthlyIncomes[0]?.total ?? 0),
      expense: monthlyExpenses[0]?.total ?? 0,
      profit: ((monthlySales[0]?.total ?? 0) + (monthlyIncomes[0]?.total ?? 0)) - (monthlyExpenses[0]?.total ?? 0),
      purchases: monthlyPurchases[0]?.total ?? 0,
      sales: monthlySales[0]?.total ?? 0,
      expenses: monthlyExpenses[0]?.total ?? 0,
      incomes: monthlyIncomes[0]?.total ?? 0,
    },
    yearly: {
      income: yearlyIncome[0]?.total ?? 0,
      expense: yearlyExpenseAll[0]?.total ?? 0,
    },
    debts: {
      owedToUs: pendingDebts.find((d) => d.type === "owed_to_us")?.total ?? 0,
      weOwe: pendingDebts.find((d) => d.type === "we_owe")?.total ?? 0,
    },
    alerts: {
      health: recentHealth.length,
      lowFeed: lowFeed.length,
      lowFeedItems: lowFeed,
    },
  });
}

// ---- production ----
async function getProduction(): Promise<Response> {
  return json(await queryRows("SELECT * FROM productions ORDER BY date DESC, created_at DESC"));
}
async function postProduction(body: Record<string, unknown>): Promise<Response> {
  const qty = numOf(body, "quantity");
  const price = numOf(body, "unitPrice");
  const totalValue = qty && price ? qty * price : null;
  const id = await insertRow("productions", {
    date: body.date,
    animalId: body.animalId ? Number(body.animalId) : null,
    animalName: strOf(body, "animalName"),
    animalType: strOf(body, "animalType"),
    productType: body.productType,
    quantity: body.quantity,
    unit: strOf(body, "unit") || "kg",
    unitPrice: strOf(body, "unitPrice"),
    totalValue,
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  return json(await getById("productions", id));
}

// ---- consumptions ----
async function getConsumptions(): Promise<Response> {
  return json(await queryRows("SELECT * FROM consumptions ORDER BY date DESC, created_at DESC"));
}
async function postConsumption(body: Record<string, unknown>): Promise<Response> {
  const id = await insertRow("consumptions", {
    date: body.date,
    productType: body.productType,
    quantity: body.quantity,
    unit: strOf(body, "unit") || "kg",
    reason: body.reason,
    notes: strOf(body, "notes"),
    createdAt: nowIso(),
  });
  return json(await getById("consumptions", id));
}

// ---- backup ----
async function getBackupJson(): Promise<Response> {
  const data = await exportAll();
  return json({ app: "farm-management", version: 1, exportedAt: new Date().toISOString(), data });
}
async function postBackupJson(body: Record<string, unknown>): Promise<Response> {
  // Accept both the app's own export (wrapped: {app, version, data}) and a
  // plain backup payload (data keys at the top level).
  const target: BackupData =
    body.data && typeof body.data === "object" && body.data !== null
      ? (body.data as BackupData)
      : (body as BackupData);
  const hasAny = BACKUP_KEYS.some((k) => Array.isArray(target[k]));
  if (!hasAny) return fail("Invalid backup file", 400);
  await restoreAll(target);
  return json({ success: true, counts: countMap(target) });
}

function countMap(data: BackupData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of BACKUP_KEYS) {
    const arr = data[k];
    if (Array.isArray(arr) && arr.length > 0) out[k] = arr.length;
  }
  return out;
}

// ---- Excel backup (port of /api/backup/excel) ----
const sheets: Record<string, string> = {
  animals: "🐄 الحيوانات",
  contacts: "👥 العملاء والموردون",
  purchases: "🛒 المشتريات",
  sales: "💵 المبيعات",
  expenses: "💸 المصاريف",
  incomes: "📈 المداخيل",
  feedStock: "🌾 مخزون الغذاء",
  feedTransactions: "🌾 حركات الغذاء",
  feedAllocations: "🍽️ توزيع الإطعام",
  healthRecords: "🏥 السجلات الصحية",
  debts: "📋 الديون",
  treasury: "🏦 الخزينة",
  settings: "⚙️ الإعدادات",
  births: "🍼 المواليد",
  productions: "🥛 الإنتاج",
  consumptions: "🍽️ الاستهلاك",
};

const headers: Record<string, Record<string, string>> = {
  animals: { id: "المعرف", name: "الاسم", type: "النوع", breed: "السلالة", gender: "الجنس", birthDate: "تاريخ الميلاد", weight: "الوزن", purchasePrice: "سعر الشراء", purchaseDate: "تاريخ الشراء", status: "الحالة", teeth: "الأسنان", ageText: "العمر", lifeStage: "المرحلة", batchId: "الدفعة", purpose: "الغرض", notes: "ملاحظات", tagNumber: "الرقم", motherAnimalId: "الأم", createdAt: "أُنشئ", updatedAt: "حُدّث" },
  contacts: { id: "المعرف", name: "الاسم", type: "النوع", phone: "الهاتف", email: "البريد", address: "العنوان", notes: "ملاحظات", createdAt: "أُنشئ" },
  purchases: { id: "المعرف", date: "التاريخ", category: "الصنف", description: "الوصف", quantity: "الكمية", unit: "الوحدة", unitPrice: "سعر الوحدة", totalAmount: "المبلغ الإجمالي", supplierId: "المورّد", animalType: "نوع الحيوان", animalId: "الحيوان", paymentStatus: "حالة الدفع", notes: "ملاحظات", createdAt: "أُنشئ" },
  sales: { id: "المعرف", date: "التاريخ", category: "الصنف", description: "الوصف", quantity: "الكمية", unit: "الوحدة", unitPrice: "سعر الوحدة", totalAmount: "المبلغ الإجمالي", customerId: "العميل", animalType: "نوع الحيوان", animalId: "الحيوان", productType: "المنتج", paymentStatus: "حالة الدفع", notes: "ملاحظات", createdAt: "أُنشئ" },
  expenses: { id: "المعرف", date: "التاريخ", category: "الصنف", description: "الوصف", amount: "المبلغ", animalType: "نوع الحيوان", paymentMethod: "طريقة الدفع", notes: "ملاحظات", createdAt: "أُنشئ" },
  incomes: { id: "المعرف", date: "التاريخ", category: "الصنف", description: "الوصف", amount: "المبلغ", animalType: "نوع الحيوان", customerId: "العميل", paymentMethod: "طريقة الدفع", notes: "ملاحظات", createdAt: "أُنشئ" },
  feedStock: { id: "المعرف", name: "الغذاء", type: "النوع", quantity: "الكمية", unit: "الوحدة", unitCost: "سعر التكلفة", minQuantity: "الحد الأدنى", maxQuantity: "السعة القصوى", animalType: "نوع الحيوان", notes: "ملاحظات", updatedAt: "حُدّث" },
  feedTransactions: { id: "المعرف", date: "التاريخ", feedId: "الغذاء", feedName: "اسم الغذاء", transactionType: "النوع", quantity: "الكمية", unit: "الوحدة", cost: "التكلفة", animalType: "الحيوان", headcount: "عدد الرؤوس", perHeadQty: "نصيب الرأس", notes: "ملاحظات", createdAt: "أُنشئ" },
  feedAllocations: { id: "المعرف", transactionId: "الحركة", animalId: "الحيوان", date: "التاريخ", quantity: "الكمية", unit: "الوحدة", createdAt: "أُنشئ" },
  healthRecords: { id: "المعرف", date: "التاريخ", animalId: "الحيوان", animalType: "النوع", recordType: "نوع السجل", description: "الوصف", diagnosis: "التشخيص", treatment: "العلاج", medicine: "الدواء", medicineCost: "تكلفة الدواء", vetName: "البيطري", vetCost: "أتعاب البيطري", totalCost: "التكلفة الإجمالية", nextVisitDate: "الزيارة القادمة", status: "الحالة", notes: "ملاحظات", createdAt: "أُنشئ" },
  debts: { id: "المعرف", date: "التاريخ", type: "النوع", contactId: "الشخص", contactName: "الاسم", description: "الوصف", totalAmount: "الإجمالي", paidAmount: "المدفوع", dueDate: "الاستحقاق", status: "الحالة", notes: "ملاحظات", createdAt: "أُنشئ", updatedAt: "حُدّث" },
  treasury: { id: "المعرف", date: "التاريخ", type: "النوع", category: "الصنف", description: "الوصف", amount: "المبلغ", balance: "الرصيد بعد الحركة", referenceType: "المرجع", referenceId: "معرف المرجع", notes: "ملاحظات", createdAt: "أُنشئ" },
  settings: { id: "المعرف", key: "المفتاح", value: "القيمة", updatedAt: "حُدّث" },
  births: { id: "المعرف", date: "التاريخ", motherId: "الأم", fatherId: "الأب", motherName: "اسم الأم", fatherName: "اسم الأب", childName: "اسم المولود", childType: "نوع المولود", childGender: "جنس المولود", childBreed: "سلالة المولود", birthWeight: "وزن الولادة", childAnimalId: "الحيوان المولود", batchName: "الدفعة", quantity: "العدد", status: "الحالة", notes: "ملاحظات", createdAt: "أُنشئ" },
  productions: { id: "المعرف", date: "التاريخ", animalId: "الحيوان", animalName: "اسم الحيوان", animalType: "النوع", productType: "المنتج", quantity: "الكمية", unit: "الوحدة", unitPrice: "سعر الوحدة", totalValue: "القيمة الإجمالية", notes: "ملاحظات", createdAt: "أُنشئ" },
  consumptions: { id: "المعرف", date: "التاريخ", productType: "المنتج", quantity: "الكمية", unit: "الوحدة", reason: "السبب", notes: "ملاحظات", createdAt: "أُنشئ" },
};

type ExcelJSNS = { default?: unknown } & { Workbook: new () => any };

async function loadExcelJS(): Promise<ExcelJSNS> {
  const mod = (await import("exceljs")) as unknown;
  return (mod as { default: ExcelJSNS }).default ?? (mod as ExcelJSNS);
}

function styleTableSheet(ws: any, title: string, keys: string[], labelOf: (k: string) => string, rows: Record<string, unknown>[]) {
  ws.views = [{ rightToLeft: true }];
  const ncols = Math.max(keys.length, 1);
  ws.mergeCells(1, 1, 1, ncols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 28;
  const hr = ws.getRow(2);
  keys.forEach((k, i) => {
    const c = hr.getCell(i + 1);
    c.value = labelOf(k);
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  hr.height = 22;
  rows.forEach((r) => {
    const row = ws.addRow(keys.map((k) => normExport(r[k])));
    row.eachCell((c: any) => {
      c.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
    });
  });
  keys.forEach((k, i) => {
    let w = Math.max(labelOf(k).length + 4, 12);
    for (const r of rows.slice(0, 50)) {
      const v = r[k];
      if (v !== null && v !== undefined) w = Math.max(w, Math.min(String(v).length + 2, 40));
    }
    ws.getColumn(i + 1).width = w;
  });
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: ncols } };
  ws.views = [{ rightToLeft: true, state: "frozen", ySplit: 2 }];
}

function normExport(v: unknown): string | number | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return v as string | number;
}

async function getBackupExcel(): Promise<Response> {
  const data = await exportAll();
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "مزرعتي";
  wb.created = new Date();

  const s = await getSummary();
  const sum = wb.addWorksheet("📊 الملخص");
  sum.views = [{ rightToLeft: true }];
  sum.mergeCells("A1:B1");
  const t = sum.getCell("A1");
  t.value = "🐄 مزرعتي — نسخة احتياطية";
  t.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
  t.alignment = { horizontal: "center", vertical: "middle" };
  sum.getRow(1).height = 32;
  const info: [string, string | number][] = [
    ["تاريخ التصدير", new Date().toISOString().slice(0, 19).replace("T", " ")],
    ["رأس المال", s.capital],
    ["رصيد الخزينة", s.balance],
    ["إجمالي الداخل", s.totalIn],
    ["إجمالي الخارج", s.totalOut],
  ];
  let r = 3;
  for (const [label, val] of info) {
    sum.getCell(`A${r}`).value = label;
    sum.getCell(`A${r}`).font = { bold: true };
    sum.getCell(`B${r}`).value = val;
    r++;
  }
  r++;
  sum.getCell(`A${r}`).value = "عدد السجلات في كل جدول";
  sum.getCell(`A${r}`).font = { bold: true, size: 13 };
  r++;
  for (const [key, label] of Object.entries(sheets)) {
    sum.getCell(`A${r}`).value = label;
    sum.getCell(`B${r}`).value = (data[key] || []).length;
    r++;
  }
  sum.getColumn(1).width = 28;
  sum.getColumn(2).width = 22;

  for (const [key, sheetName] of Object.entries(sheets)) {
    const rows = (data[key] || []) as Record<string, unknown>[];
    const map = headers[key] || {};
    const keySet: string[] = [];
    for (const row of rows) for (const k of Object.keys(row)) if (!keySet.includes(k)) keySet.push(k);
    if (keySet.length === 0) keySet.push(...Object.keys(map));
    const ws = wb.addWorksheet(sheetName);
    styleTableSheet(ws, `${sheetName} (${rows.length})`, keySet, (k2) => map[k2] || k2, rows);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="farm-backup-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}

async function postBackupExcel(req: Request): Promise<Response> {
  const form = await req.formData();
  const file = form.get("file") as Blob | null;
  if (!file) return fail("No file", 400);
  const buf = await file.arrayBuffer();
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const nameToKey: Record<string, string> = Object.fromEntries(Object.entries(sheets).map(([k, v]) => [v, k]));
  const data: BackupData = {};
  for (const ws of wb.worksheets) {
    const key = nameToKey[(ws as { name: string }).name];
    if (!key) continue;
    const map = headers[key] || {};
    const rev: Record<string, string> = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
    const colKeys: (string | null)[] = [];
    ((ws as any).getRow(2)).eachCell({ includeEmpty: true }, (c: any, n: number) => {
      const h = String(c.value || "").trim();
      colKeys[n - 1] = rev[h] || (h && !Object.values(map).includes(h) ? h : null);
    });
    const rows: Record<string, unknown>[] = [];
    for (let i = 3; i <= (ws as any).rowCount; i++) {
      const row = (ws as any).getRow(i);
      const obj: Record<string, unknown> = {};
      let empty = true;
      row.eachCell({ includeEmpty: true }, (c: any, n: number) => {
        const k = colKeys[n - 1];
        if (!k) return;
        let v: unknown = c.value;
        if (v === null || v === undefined || v === "") return;
        if (typeof v === "object") {
          if (v instanceof Date) v = isNaN(v.getTime()) ? null : v.toISOString();
          else if ("text" in (v as object)) v = String((v as { text: unknown }).text);
          else v = null;
        }
        if (v === null || v === "") return;
        empty = false;
        obj[k] = v;
      });
      if (!empty) rows.push(obj);
    }
    data[key] = rows;
  }

  if (Object.keys(data).length === 0) return fail("No recognized sheets in file", 400);
  const counts = countMap(data);
  await restoreAll(data);
  return json({ success: true, counts });
}

// ---- reports (kept for completeness; not called by any page) ----
async function getReports(url: URL): Promise<Response> {
  const from = url.searchParams.get("from") || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
  const to = url.searchParams.get("to") || new Date().toISOString().split("T")[0];

  const salesByCategory = await queryRows<{ category: string; total: number; count: number }>(
    `SELECT category, COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count FROM sales WHERE date >= ${esc(from)} AND date <= ${esc(to)} GROUP BY category`
  );
  const purchasesByCategory = await queryRows<{ category: string; total: number; count: number }>(
    `SELECT category, COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count FROM purchases WHERE date >= ${esc(from)} AND date <= ${esc(to)} GROUP BY category`
  );
  const expensesByCategory = await queryRows<{ category: string; total: number; count: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE date >= ${esc(from)} AND date <= ${esc(to)} GROUP BY category`
  );
  const incomesByCategory = await queryRows<{ category: string; total: number; count: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM incomes WHERE date >= ${esc(from)} AND date <= ${esc(to)} GROUP BY category`
  );

  const totalSales = salesByCategory.reduce((s, c) => s + c.total, 0);
  const totalPurchases = purchasesByCategory.reduce((s, c) => s + c.total, 0);
  const totalExpenses = expensesByCategory.reduce((s, c) => s + c.total, 0);
  const totalIncomes = incomesByCategory.reduce((s, c) => s + c.total, 0);

  const animalCounts = await queryRows<{ type: string; status: string; count: number }>(
    `SELECT type, status, COUNT(*) AS count FROM animals GROUP BY type, status`
  );
  const monthlyData = await queryRows<{ month: string; totalSales: number }>(
    `SELECT substr(date, 1, 7) AS month, COALESCE(SUM(total_amount), 0) AS totalSales FROM sales WHERE date >= ${esc(from)} AND date <= ${esc(to)} GROUP BY substr(date, 1, 7) ORDER BY substr(date, 1, 7)`
  );
  const monthlyExpensesData = await queryRows<{ month: string; totalExpenses: number }>(
    `SELECT substr(date, 1, 7) AS month, COALESCE(SUM(total_amount), 0) AS totalExpenses FROM purchases WHERE date >= ${esc(from)} AND date <= ${esc(to)} GROUP BY substr(date, 1, 7) ORDER BY substr(date, 1, 7)`
  );
  const healthCosts = await queryRows<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total_cost), 0) AS total, COUNT(*) AS count FROM health_records WHERE date >= ${esc(from)} AND date <= ${esc(to)}`
  );

  const grossIncome = totalSales + totalIncomes;
  const grossExpense = totalExpenses;
  const netProfit = grossIncome - grossExpense;

  return json({
    period: { from, to },
    financials: {
      grossIncome,
      grossExpense,
      netProfit,
      profitMargin: grossIncome > 0 ? ((netProfit / grossIncome) * 100).toFixed(1) : "0",
      totalSales,
      totalPurchases,
      totalExpenses,
      totalIncomes,
    },
    salesByCategory,
    purchasesByCategory,
    expensesByCategory,
    incomesByCategory,
    animalCounts,
    monthlyData,
    monthlyExpensesData,
    health: { totalCost: healthCosts[0]?.total ?? 0, count: healthCosts[0]?.count ?? 0 },
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
async function handleApi(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;
  const method = req.method;

  // backup excel must be matched before backup generic
  if (path === "/api/backup/excel") {
    if (method === "GET") return getBackupExcel();
    if (method === "POST") return postBackupExcel(req);
    return fail("Method not allowed", 405);
  }
  if (path === "/api/backup") {
    if (method === "GET") return getBackupJson();
    if (method === "POST") return postBackupJson(await req.json());
    return fail("Method not allowed", 405);
  }

  const animalsId = path.match(/^\/api\/animals\/(\d+)$/);
  if (animalsId) {
    const id = parseInt(animalsId[1], 10);
    if (method === "GET") return getAnimal(id);
    if (method === "PUT") return putAnimal(id, await req.json());
    if (method === "DELETE") { await deleteById("animals", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/animals") {
    if (method === "GET") return getAnimals(req, url);
    if (method === "POST") return postAnimal(await req.json());
    return fail("Method not allowed", 405);
  }

  const contactsId = path.match(/^\/api\/contacts\/(\d+)$/);
  if (contactsId) {
    const id = parseInt(contactsId[1], 10);
    if (method === "PUT") return putContact(id, await req.json());
    if (method === "DELETE") { await deleteById("contacts", id); return json({ success: true }); }
    if (method === "GET") { const row = await getById("contacts", id); return row ? json(row) : fail("Not found", 404); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/contacts") {
    if (method === "GET") return getContacts();
    if (method === "POST") return postContact(await req.json());
    return fail("Method not allowed", 405);
  }

  const purchasesId = path.match(/^\/api\/purchases\/(\d+)$/);
  if (purchasesId) {
    const id = parseInt(purchasesId[1], 10);
    if (method === "PUT") return putPurchase(id, await req.json());
    if (method === "DELETE") { await deleteById("purchases", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/purchases") {
    if (method === "GET") return getPurchases();
    if (method === "POST") return postPurchase(await req.json());
    return fail("Method not allowed", 405);
  }

  const salesId = path.match(/^\/api\/sales\/(\d+)$/);
  if (salesId) {
    const id = parseInt(salesId[1], 10);
    if (method === "PUT") return putSale(id, await req.json());
    if (method === "DELETE") { await deleteById("sales", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/sales") {
    if (method === "GET") return getSales();
    if (method === "POST") return postSale(await req.json());
    return fail("Method not allowed", 405);
  }

  const expensesId = path.match(/^\/api\/expenses\/(\d+)$/);
  if (expensesId) {
    const id = parseInt(expensesId[1], 10);
    if (method === "DELETE") { await deleteById("expenses", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/expenses") {
    if (method === "GET") return getExpenses();
    if (method === "POST") return postExpense(await req.json());
    return fail("Method not allowed", 405);
  }

  const incomesId = path.match(/^\/api\/incomes\/(\d+)$/);
  if (incomesId) {
    const id = parseInt(incomesId[1], 10);
    if (method === "DELETE") { await deleteById("incomes", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/incomes") {
    if (method === "GET") return getIncomes();
    if (method === "POST") return postIncome(await req.json());
    return fail("Method not allowed", 405);
  }

  const healthRecordId = path.match(/^\/api\/health\/records\/(\d+)$/);
  if (healthRecordId) {
    const id = parseInt(healthRecordId[1], 10);
    if (method === "DELETE") { await deleteById("health_records", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/health/records") {
    if (method === "GET") return getHealthRecords();
    if (method === "POST") return postHealthRecord(await req.json());
    return fail("Method not allowed", 405);
  }
  if (path === "/api/health") {
    if (method === "GET") return json({ ok: true });
    return fail("Method not allowed", 405);
  }

  const feedId = path.match(/^\/api\/feed\/(\d+)$/);
  if (feedId) {
    const id = parseInt(feedId[1], 10);
    if (method === "DELETE") { await deleteById("feed_stock", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/feed") {
    if (method === "GET") return getFeed();
    if (method === "POST") return postFeed(await req.json());
    return fail("Method not allowed", 405);
  }

  if (path === "/api/births") {
    if (method === "GET") return getBirths();
    if (method === "POST") return postBirth(await req.json());
    if (method === "DELETE") {
      const animalId = url.searchParams.get("animalId");
      if (!animalId) return fail("animalId required", 400);
      await deleteById("animals", parseInt(animalId, 10));
      return json({ success: true });
    }
    return fail("Method not allowed", 405);
  }

  const debtsId = path.match(/^\/api\/debts\/(\d+)$/);
  if (debtsId) {
    const id = parseInt(debtsId[1], 10);
    if (method === "PUT") return putDebt(id, await req.json());
    if (method === "DELETE") { await deleteById("debts", id); return json({ success: true }); }
    return fail("Method not allowed", 405);
  }
  if (path === "/api/debts") {
    if (method === "GET") return getDebts();
    if (method === "POST") return postDebt(await req.json());
    return fail("Method not allowed", 405);
  }

  if (path === "/api/treasury") {
    if (method === "GET") return getTreasury();
    if (method === "POST") return postTreasury(await req.json());
    return fail("Method not allowed", 405);
  }

  if (path === "/api/settings") {
    if (method === "GET") return getSettings();
    if (method === "POST") return postSettings(await req.json());
    return fail("Method not allowed", 405);
  }

  if (path === "/api/dashboard") {
    if (method === "GET") return getDashboard();
    return fail("Method not allowed", 405);
  }

  if (path === "/api/production") {
    if (method === "GET") return getProduction();
    if (method === "POST") return postProduction(await req.json());
    return fail("Method not allowed", 405);
  }

  if (path === "/api/consumptions") {
    if (method === "GET") return getConsumptions();
    if (method === "POST") return postConsumption(await req.json());
    return fail("Method not allowed", 405);
  }

  if (path === "/api/reports") {
    if (method === "GET") return getReports(url);
    return fail("Method not allowed", 405);
  }

  return fail(`Not found: ${path}`, 404);
}

// ---------------------------------------------------------------------------
// Fetch bridge
// ---------------------------------------------------------------------------
type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let installed = false;

export function installOfflineBridge(): void {
  if (installed || typeof window === "undefined") return;
  const anyWindow = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (typeof anyWindow.Capacitor?.isNativePlatform !== "function" || !anyWindow.Capacitor.isNativePlatform()) {
    return; // not a native Capacitor WebView — keep normal network fetches (dev/browser)
  }
  const originalFetch: Fetch = window.fetch.bind(window);
  const intercepted: Fetch = (input, init) => {
    let req: Request;
    try {
      req = new Request(input, init);
    } catch {
      return originalFetch(input, init);
    }
    let url: URL;
    try {
      url = new URL(req.url);
    } catch {
      return originalFetch(input, init);
    }
    if (url.origin === window.location.origin && url.pathname.startsWith("/api/")) {
      return (async () => {
        try {
          await initOfflineDB();
          return await handleApi(req, url);
        } catch (err) {
          console.error("[offline] API error:", err);
          return fail("Offline storage unavailable", 500);
        }
      })();
    }
    return originalFetch(input, init);
  };
  window.fetch = intercepted as typeof fetch;
  installed = true;
}

// installed as a module-load side effect so it is armed BEFORE any page effect
if (typeof window !== "undefined") {
  installOfflineBridge();
}

// Re-export a few things the pages use directly.
export { isNative };
export { getSummary };
export { exportAll };
export { resetAllData };
export type { TreasurySummary };