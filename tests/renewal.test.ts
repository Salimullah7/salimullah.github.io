import assert from "node:assert/strict";
import test from "node:test";
import { processCsv, type Outcome } from "../src/lib/renewal.ts";

const HEADER = "member_id,name,email,action";
const AVERY_RENEWAL = "MEM-001,Avery Morgan,avery.morgan@example.test,renew";
const JORDAN_RENEWAL = "MEM-002,Jordan Lee,jordan.lee@example.test,renew";

test("returns typed outcomes, source rows, reasons, and accurate mixed counts", () => {
  const result = processCsv(
    [
      HEADER,
      "NEW-001,Casey Chen,casey.chen@example.test,create",
      AVERY_RENEWAL,
      JORDAN_RENEWAL,
      "NEW-002,Robin Cole,robin.cole@example.test,renew",
      "NEW-003,Taylor Reed,invalid,create",
    ].join("\n"),
  );
  const createdOutcome: Outcome = {
    row: 2,
    memberId: "NEW-001",
    name: "Casey Chen",
    status: "created",
    reason: "Synthetic membership created.",
  };

  assert.deepEqual(result.counts, { created: 1, renewed: 2, rejected: 2 });
  assert.deepEqual(result.outcomes[0], createdOutcome);
  assert.deepEqual(result.outcomes.map((outcome) => outcome.row), [2, 3, 4, 5, 6]);
  assert.deepEqual(result.outcomes.map((outcome) => outcome.status), [
    "created", "renewed", "renewed", "rejected", "rejected",
  ]);
  assert.equal(result.outcomes.length, Object.values(result.counts).reduce((total, count) => total + count, 0));
  assert.ok(result.outcomes.every((outcome) => outcome.reason.length > 0));
});

test("both deterministic synthetic members already exist and cannot be created", () => {
  const result = processCsv(
    `${HEADER}\n${AVERY_RENEWAL.replace(",renew", ",create")}\n${JORDAN_RENEWAL.replace(",renew", ",create")}`,
  );

  assert.deepEqual(result.counts, { created: 0, renewed: 0, rejected: 2 });
  assert.ok(result.outcomes.every((outcome) => /already exists/.test(outcome.reason)));
});

test("renewal requires both the known name and the known email", () => {
  const result = processCsv([
    HEADER,
    "MEM-001,Someone Else,avery.morgan@example.test,renew",
    "MEM-002,Jordan Lee,someone.else@example.test,renew",
  ].join("\n"));

  assert.deepEqual(result.counts, { created: 0, renewed: 0, rejected: 2 });
  assert.ok(result.outcomes.every((outcome) => /Identity mismatch/.test(outcome.reason)));
});

test("a known identity cannot renew an unknown member ID", () => {
  const result = processCsv(`${HEADER}\nMEM-999,Avery Morgan,avery.morgan@example.test,renew`);

  assert.equal(result.outcomes[0]?.status, "rejected");
  assert.match(result.outcomes[0]?.reason ?? "", /unknown member MEM-999/);
});

test("identity matching normalizes ID and email case and name spacing", () => {
  const result = processCsv(
    `${HEADER}\n mem-001 , aVeRy   MORGAN , AVERY.MORGAN@EXAMPLE.TEST , renew `,
  );

  assert.deepEqual(result.counts, { created: 0, renewed: 1, rejected: 0 });
  assert.equal(result.outcomes[0]?.memberId, "mem-001");
  assert.equal(result.outcomes[0]?.name, "aVeRy   MORGAN");
});

test("maps reordered, quoted, and padded headers to the correct fields", () => {
  const result = processCsv(
    ' action ,"email", name ,member_id\ncreate,casey@example.test,Casey Chen,NEW-001',
  );

  assert.equal(result.outcomes[0]?.memberId, "NEW-001");
  assert.equal(result.outcomes[0]?.name, "Casey Chen");
  assert.equal(result.outcomes[0]?.status, "created");
});

test("parses BOM, CRLF, quoted commas, escaped quotes, and a final newline", () => {
  const result = processCsv(
    `\uFEFF${HEADER}\r\n"NEW,001","Morgan, ""M"" Lee",morgan@example.test,create\r\n${AVERY_RENEWAL}\r\n`,
  );

  assert.deepEqual(result.counts, { created: 1, renewed: 1, rejected: 0 });
  assert.equal(result.outcomes[0]?.memberId, "NEW,001");
  assert.equal(result.outcomes[0]?.name, 'Morgan, "M" Lee');
  assert.deepEqual(result.outcomes.map((outcome) => outcome.row), [2, 3]);
});

test("preserves quoted CRLF and reports the physical start line of each record", () => {
  const result = processCsv(
    `${HEADER}\r\nNEW-001,"Casey\r\nChen",casey@example.test,create\r\n${AVERY_RENEWAL}`,
  );

  assert.equal(result.outcomes[0]?.name, "Casey\r\nChen");
  assert.deepEqual(result.outcomes.map((outcome) => outcome.row), [2, 4]);
  assert.deepEqual(result.counts, { created: 1, renewed: 1, rejected: 0 });
});

test("handles LF and bare CR inside quoted fields and as record boundaries", () => {
  for (const newline of ["\n", "\r"]) {
    const result = processCsv(
      `${HEADER}${newline}NEW-001,"Casey${newline}Chen",casey@example.test,create${newline}${AVERY_RENEWAL}`,
    );

    assert.equal(result.outcomes[0]?.name, `Casey${newline}Chen`);
    assert.deepEqual(result.outcomes.map((outcome) => outcome.row), [2, 4]);
    assert.equal(result.counts.created, 1);
    assert.equal(result.counts.renewed, 1);
  }
});

test("ignores empty physical lines while retaining source line numbers", () => {
  const result = processCsv(`\n${HEADER}\n\n${AVERY_RENEWAL}\n\n${JORDAN_RENEWAL}\n\n`);

  assert.deepEqual(result.outcomes.map((outcome) => outcome.row), [4, 6]);
  assert.deepEqual(result.counts, { created: 0, renewed: 2, rejected: 0 });
});

test("quoted delimiters in an email remain in one field and fail email validation", () => {
  const result = processCsv(`${HEADER}\nNEW-001,Casey,"casey,chen@example.test",create`);

  assert.equal(result.outcomes[0]?.status, "rejected");
  assert.match(result.outcomes[0]?.reason ?? "", /Invalid email/);
});

test("HTML payloads remain exact plain strings without execution or encoding", () => {
  const memberId = '<img src=missing onerror="throw Error(1)">';
  const name = '<script>throw Error("payload executed")</script>';
  const result = processCsv(
    `${HEADER}\n"<img src=missing onerror=""throw Error(1)"">","<script>throw Error(""payload executed"")</script>",plain@example.test,create`,
  );

  assert.equal(result.outcomes[0]?.memberId, memberId);
  assert.equal(result.outcomes[0]?.name, name);
  assert.equal(result.outcomes[0]?.status, "created");
});

test("rejects every blank required field including whitespace and quoted empties", () => {
  const invalidRows = [
    ",Casey,casey@example.test,create",
    "NEW-001,   ,casey@example.test,create",
    'NEW-001,Casey,"",create',
    "NEW-001,Casey,casey@example.test,",
    ",,,",
    '"","","",""',
  ];

  for (const invalidRow of invalidRows) {
    const result = processCsv(`${HEADER}\n${invalidRow}`);
    assert.deepEqual(result.counts, { created: 0, renewed: 0, rejected: 1 });
    assert.match(result.outcomes[0]?.reason ?? "", /Required fields cannot be blank/);
  }
});

test("accepts only the create and renew action spellings", () => {
  for (const action of ["CREATE", "Renew", "delete", "create now", "<script>"]) {
    const result = processCsv(`${HEADER}\nNEW-001,Casey,casey@example.test,${action}`);

    assert.equal(result.outcomes[0]?.status, "rejected");
    assert.match(result.outcomes[0]?.reason ?? "", /Invalid action/);
  }
});

test("rejects malformed email addresses and address lengths", () => {
  const invalidEmails = [
    "invalid",
    "@example.test",
    "casey@",
    "casey@@example.test",
    "casey@example",
    "casey chen@example.test",
    "casey@example..test",
    ".casey@example.test",
    "casey..chen@example.test",
    "casey@example.test.",
    "casey@-example.test",
    "casey@example-.test",
    "casey@exam_ple.test",
    "casey@<script>.test",
    `casey@${"domain".repeat(11)}.test`,
    `${"local".repeat(13)}@example.test`,
    `casey@${"domain".repeat(10)}.${"domain".repeat(10)}.${"domain".repeat(10)}.${"domain".repeat(10)}.example.test`,
  ];

  for (const email of invalidEmails) {
    const result = processCsv(`${HEADER}\nNEW-001,Casey,${email},create`);
    assert.equal(result.outcomes[0]?.status, "rejected", email);
    assert.match(result.outcomes[0]?.reason ?? "", /Invalid email/, email);
  }
});

test("accepts ordinary email punctuation and domain subdomains", () => {
  for (const email of ["casey.chen+portfolio@example.test", "o'connor@members.example.test"]) {
    const result = processCsv(`${HEADER}\nNEW-001,Casey,${email},create`);
    assert.equal(result.outcomes[0]?.status, "created", email);
  }
});

test("rejects duplicate new and known IDs, including case and surrounding spaces", () => {
  const result = processCsv([
    HEADER,
    "NEW-001,Casey,casey@example.test,create",
    " new-001 ,Another Name,another@example.test,create",
    AVERY_RENEWAL,
    " mem-001 ,Avery Morgan,avery.morgan@example.test,renew",
  ].join("\n"));

  assert.deepEqual(result.counts, { created: 1, renewed: 1, rejected: 2 });
  assert.match(result.outcomes[1]?.reason ?? "", /Duplicate member_id/);
  assert.match(result.outcomes[3]?.reason ?? "", /Duplicate member_id/);
});

test("an invalid first appearance still reserves its ID against replay in the same batch", () => {
  const result = processCsv([
    HEADER,
    "NEW-001,Casey,invalid,create",
    "NEW-001,Casey,casey@example.test,create",
    "MEM-001,Wrong Name,avery.morgan@example.test,renew",
    AVERY_RENEWAL,
  ].join("\n"));

  assert.deepEqual(result.counts, { created: 0, renewed: 0, rejected: 4 });
  assert.match(result.outcomes[0]?.reason ?? "", /Invalid email/);
  assert.match(result.outcomes[1]?.reason ?? "", /Duplicate member_id/);
  assert.match(result.outcomes[2]?.reason ?? "", /Identity mismatch/);
  assert.match(result.outcomes[3]?.reason ?? "", /Duplicate member_id/);
});

test("replaying a batch is deterministic and does not persist created memberships", () => {
  const input = `${HEADER}\nNEW-001,Casey,casey@example.test,create\n${AVERY_RENEWAL}`;
  const firstResult = processCsv(input);

  assert.deepEqual(processCsv(input), firstResult);
  assert.deepEqual(processCsv(`${HEADER}\nNEW-001,Casey,casey@example.test,renew`).counts, {
    created: 0, renewed: 0, rejected: 1,
  });
  firstResult.outcomes[0]!.name = "Changed outside the processor";
  firstResult.counts.created = 99;
  assert.equal(processCsv(input).outcomes[0]?.name, "Casey");
  assert.equal(processCsv(input).counts.created, 1);
});

test("rejects wrong field counts without discarding subsequent valid records", () => {
  const result = processCsv([
    HEADER,
    "NEW-001,Casey,casey@example.test",
    "NEW-002,Casey,casey@example.test,create,extra",
    "NEW-003",
    '""',
    AVERY_RENEWAL,
  ].join("\n"));

  assert.deepEqual(result.counts, { created: 0, renewed: 1, rejected: 4 });
  assert.deepEqual(result.outcomes.map((outcome) => outcome.row), [2, 3, 4, 5, 6]);
  assert.match(result.outcomes[0]?.reason ?? "", /Expected 4 fields; received 3/);
  assert.match(result.outcomes[1]?.reason ?? "", /Expected 4 fields; received 5/);
  assert.match(result.outcomes[2]?.reason ?? "", /Expected 4 fields; received 1/);
  assert.match(result.outcomes[3]?.reason ?? "", /Expected 4 fields; received 1/);
});

test("header-only input returns empty outcomes and zero counts", () => {
  for (const input of [HEADER, `${HEADER}\n`, `\uFEFF${HEADER}\r\n`]) {
    assert.deepEqual(processCsv(input), {
      outcomes: [], counts: { created: 0, renewed: 0, rejected: 0 },
    });
  }
});

test("empty input and absent headers throw understandable errors", () => {
  for (const input of ["", "\uFEFF", "\r\n\n", "   ", AVERY_RENEWAL]) {
    assert.throws(() => processCsv(input), /CSV header.*member_id.*name.*email.*action/i);
  }
});

test("missing, extra, duplicate, misspelled, and wrong-case headers throw", () => {
  const invalidHeaders = [
    "member_id,name,email",
    "member_id,name,email,action,extra",
    "member_id,name,email,email",
    "member_id,name,email,operation",
    "MEMBER_ID,name,email,action",
    "member_id,name,,action",
  ];

  for (const invalidHeader of invalidHeaders) {
    assert.throws(() => processCsv(`${invalidHeader}\n${AVERY_RENEWAL}`), /Invalid CSV header.*exactly once/);
  }
});

test("malformed quotes throw clear errors with source rows", () => {
  const malformedRecords = [
    { record: 'NEW-001,"Casey,casey@example.test,create', message: /row 2.*unterminated quoted field/ },
    { record: 'NEW-001,Cas"ey,casey@example.test,create', message: /row 2.*unexpected quote/ },
    { record: 'NEW-001,"Casey"oops,casey@example.test,create', message: /row 2.*after a closing quote/ },
    { record: 'NEW-001,"Casey" ,casey@example.test,create', message: /row 2.*after a closing quote/ },
    { record: 'NEW-001,"Casey""', message: /row 2.*unterminated quoted field/ },
  ];

  for (const { record, message } of malformedRecords) {
    assert.throws(() => processCsv(`${HEADER}\n${record}`), message);
  }
  assert.throws(() => processCsv('"member_id,name,email,action'), /row 1.*unterminated/);
});

test("parse errors after a valid record throw instead of returning partial results", () => {
  assert.throws(
    () => processCsv(`${HEADER}\n${AVERY_RENEWAL}\nNEW-001,"broken\nfield`),
    /row 3.*unterminated quoted field/,
  );
  assert.equal(processCsv(`${HEADER}\n${AVERY_RENEWAL}`).counts.renewed, 1);
});

test("accepts exactly 100000 characters and rejects one more including a BOM", () => {
  const prefix = `${HEADER}\nNEW-001,`;
  const suffix = ",casey@example.test,create";
  const exactInput = prefix + "Casey".padEnd(100_000 - prefix.length - suffix.length, "x") + suffix;
  const exactBomInput = `\uFEFF${prefix}${"x".repeat(99_999 - prefix.length - suffix.length)}${suffix}`;

  assert.equal(exactInput.length, 100_000);
  assert.equal(exactBomInput.length, 100_000);
  assert.equal(processCsv(exactInput).counts.created, 1);
  assert.equal(processCsv(exactBomInput).counts.created, 1);
  assert.throws(() => processCsv(`${exactInput}x`), /limit of 100000 characters/);
  assert.throws(() => processCsv(`\uFEFF${exactInput}`), /limit of 100000 characters/);
});

test("accepts 500 data records and throws for 501 with or without a final newline", () => {
  const records = Array.from(
    { length: 501 },
    (_unused, recordIndex) => `NEW-${recordIndex},Member ${recordIndex},member${recordIndex}@example.test,create`,
  );
  const acceptedInput = [HEADER, ...records.slice(0, 500)].join("\n");
  const rejectedInput = [HEADER, ...records].join("\n");

  assert.deepEqual(processCsv(acceptedInput).counts, { created: 500, renewed: 0, rejected: 0 });
  assert.equal(processCsv(`${acceptedInput}\n`).outcomes.length, 500);
  assert.throws(() => processCsv(rejectedInput), /limit of 500 data records/);
  assert.throws(() => processCsv(`${rejectedInput}\n`), /limit of 500 data records/);
});

test("record limits count malformed and rejected records but not blank physical lines", () => {
  const rejectedRecords = Array.from({ length: 500 }, () => ",,,");
  const input = [HEADER, ...rejectedRecords].join("\n\n");

  assert.deepEqual(processCsv(input).counts, { created: 0, renewed: 0, rejected: 500 });
  assert.throws(() => processCsv(`${input}\n,,,`), /limit of 500 data records/);
  assert.throws(() => processCsv([HEADER, ...Array.from({ length: 501 }, () => "short")].join("\n")), /limit of 500 data records/);
});

test("quoted embedded newlines do not count as additional data records", () => {
  const records = Array.from(
    { length: 500 },
    (_unused, recordIndex) => `NEW-${recordIndex},"Member\n${recordIndex}",member${recordIndex}@example.test,create`,
  );
  const result = processCsv([HEADER, ...records].join("\n"));

  assert.deepEqual(result.counts, { created: 500, renewed: 0, rejected: 0 });
  assert.equal(result.outcomes[499]?.row, 1_000);
});
