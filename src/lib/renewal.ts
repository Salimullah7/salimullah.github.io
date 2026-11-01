export type Outcome = {
  row: number;
  memberId: string;
  name: string;
  status: "created" | "renewed" | "rejected";
  reason: string;
};

type CsvRecord = {
  row: number;
  fields: string[];
};

type CsvState = "start" | "unquoted" | "quoted" | "closed";

const MAX_INPUT_LENGTH = 100_000;
const MAX_RECORDS = 500;
const REQUIRED_HEADERS = ["member_id", "name", "email", "action"] as const;
const SYNTHETIC_MEMBERS: ReadonlyMap<string, { name: string; email: string }> =
  new Map([
    ["MEM-001", { name: "Avery Morgan", email: "avery.morgan@example.test" }],
    ["MEM-002", { name: "Jordan Lee", email: "jordan.lee@example.test" }],
  ]);
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

function parseCsv(input: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let state: CsvState = "start";
  let line = 1;
  let recordStartLine = 1;
  let recordHasContent = false;

  function finishRecord(): void {
    fields.push(field);
    if (recordHasContent) {
      records.push({ row: recordStartLine, fields });
      if (records.length > MAX_RECORDS + 1) {
        throw new Error(`CSV input exceeds the limit of ${MAX_RECORDS} data records.`);
      }
    }
    fields = [];
    field = "";
    state = "start";
    recordHasContent = false;
  }

  for (let position = 0; position < input.length; position += 1) {
    const character = input.charAt(position);
    const nextCharacter = input.charAt(position + 1);

    if (character === "\r" || character === "\n") {
      if (state === "quoted") {
        field += character;
        if (character === "\r" && nextCharacter === "\n") {
          field += "\n";
        }
      } else {
        finishRecord();
      }
      if (character === "\r" && nextCharacter === "\n") {
        position += 1;
      }
      line += 1;
      if (state !== "quoted") {
        recordStartLine = line;
      }
      continue;
    }

    recordHasContent = true;

    if (state === "quoted") {
      if (character === '"') {
        if (nextCharacter === '"') {
          field += '"';
          position += 1;
        } else {
          state = "closed";
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === ",") {
      fields.push(field);
      field = "";
      state = "start";
    } else if (character === '"' && state === "start") {
      state = "quoted";
    } else if (character === '"') {
      throw new Error(
        `Malformed CSV at row ${recordStartLine}, line ${line}: unexpected quote in an unquoted field.`,
      );
    } else if (state === "closed") {
      throw new Error(
        `Malformed CSV at row ${recordStartLine}, line ${line}: expected a comma or line ending after a closing quote.`,
      );
    } else {
      field += character;
      state = "unquoted";
    }
  }

  if (state === "quoted") {
    throw new Error(`Malformed CSV at row ${recordStartLine}: unterminated quoted field.`);
  }
  finishRecord();
  return records;
}

function isValidEmail(email: string): boolean {
  const separatorPosition = email.indexOf("@");
  return (
    email.length <= 254 &&
    separatorPosition > 0 &&
    separatorPosition <= 64 &&
    EMAIL_PATTERN.test(email)
  );
}

function normalizeName(name: string): string {
  return name.normalize("NFC").replace(/\s+/gu, " ").trim().toLowerCase();
}

export function processCsv(input: string): {
  outcomes: Outcome[];
  counts: { created: number; renewed: number; rejected: number };
} {
  if (typeof input !== "string") {
    throw new Error("CSV input must be a string.");
  }
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`CSV input exceeds the limit of ${MAX_INPUT_LENGTH} characters.`);
  }

  const records = parseCsv(input.startsWith("\uFEFF") ? input.slice(1) : input);
  const header = records.shift();
  if (!header) {
    throw new Error(`CSV header is required: ${REQUIRED_HEADERS.join(",")}.`);
  }

  const headers = header.fields.map((headerName) => headerName.trim());
  if (
    headers.length !== REQUIRED_HEADERS.length ||
    !REQUIRED_HEADERS.every((headerName) => headers.includes(headerName))
  ) {
    throw new Error(
      `Invalid CSV header at row ${header.row}: expected member_id, name, email, action exactly once each.`,
    );
  }

  const columnPositions = {
    memberId: headers.indexOf("member_id"),
    name: headers.indexOf("name"),
    email: headers.indexOf("email"),
    action: headers.indexOf("action"),
  };
  const outcomes: Outcome[] = [];
  const counts = { created: 0, renewed: 0, rejected: 0 };
  const seenMemberIds = new Set<string>();

  for (const record of records) {
    const memberId = (record.fields[columnPositions.memberId] ?? "").trim();
    const name = (record.fields[columnPositions.name] ?? "").trim();
    const email = (record.fields[columnPositions.email] ?? "").trim();
    const action = (record.fields[columnPositions.action] ?? "").trim();
    const normalizedMemberId = memberId.toUpperCase();
    const duplicate = memberId !== "" && seenMemberIds.has(normalizedMemberId);
    if (memberId !== "") {
      seenMemberIds.add(normalizedMemberId);
    }

    const existingMember = SYNTHETIC_MEMBERS.get(normalizedMemberId);
    let status: Outcome["status"] = "rejected";
    let reason: string;

    if (record.fields.length !== headers.length) {
      reason = `Expected ${headers.length} fields; received ${record.fields.length}.`;
    } else if (!memberId || !name || !email || !action) {
      const missingFields = REQUIRED_HEADERS.filter(
        (headerName) => !(record.fields[headers.indexOf(headerName)] ?? "").trim(),
      );
      reason = `Required fields cannot be blank: ${missingFields.join(", ")}.`;
    } else if (duplicate) {
      reason = `Duplicate member_id: ${memberId}; only the first occurrence is processed.`;
    } else if (action !== "create" && action !== "renew") {
      reason = 'Invalid action: expected "create" or "renew".';
    } else if (!isValidEmail(email)) {
      reason = "Invalid email address.";
    } else if (action === "create" && existingMember) {
      reason = `Member ${normalizedMemberId} already exists; use renew.`;
    } else if (action === "renew" && !existingMember) {
      reason = `Cannot renew unknown member ${memberId}.`;
    } else if (
      action === "renew" &&
      existingMember &&
      (normalizeName(name) !== normalizeName(existingMember.name) ||
        email.toLowerCase() !== existingMember.email.toLowerCase())
    ) {
      reason = "Identity mismatch: name and email must match the synthetic member record.";
    } else {
      status = action === "create" ? "created" : "renewed";
      reason = action === "create" ? "Synthetic membership created." : "Synthetic membership renewed.";
    }

    outcomes.push({ row: record.row, memberId, name, status, reason });
    counts[status] += 1;
  }

  return { outcomes, counts };
}
