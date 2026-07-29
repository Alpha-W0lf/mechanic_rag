/** Ask request validation — kept separate so ask.ts stays ≤400 lines. */

export type AskRequest = {
  vehicle_id: string;
  question: string;
  doc_family?: string;
  /** Optional UI/API flag to request diagram assist when MECHANIC_VLM is on. */
  diagram_assist?: boolean;
};

const MAX_QUESTION = 4000;

export function validateAskRequest(
  body: unknown,
): { ok: true; value: AskRequest } | { ok: false; error: string; status: number } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body', status: 400 };
  }
  const b = body as Record<string, unknown>;
  if ('query' in b && !('question' in b)) {
    return {
      ok: false,
      error: 'Use { vehicle_id, question } — stub { query } is retired',
      status: 400,
    };
  }
  const vehicle_id = typeof b.vehicle_id === 'string' ? b.vehicle_id.trim() : '';
  const question = typeof b.question === 'string' ? b.question.trim() : '';
  if (!vehicle_id) {
    return { ok: false, error: 'vehicle_id is required', status: 400 };
  }
  if (!question) {
    return { ok: false, error: 'question is required', status: 400 };
  }
  if (question.length > MAX_QUESTION) {
    return { ok: false, error: 'question too long', status: 400 };
  }
  const doc_family =
    typeof b.doc_family === 'string' ? b.doc_family.trim() : undefined;
  const diagram_assist = b.diagram_assist === true;
  return {
    ok: true,
    value: {
      vehicle_id,
      question,
      doc_family,
      ...(diagram_assist ? { diagram_assist: true } : {}),
    },
  };
}
