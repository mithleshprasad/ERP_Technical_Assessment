const { JournalEntry, JournalEntryLine } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Double-entry bookkeeping for a completed sales order: debits Accounts
 * Receivable and credits Sales Revenue for the same amount, so
 * total debit === total credit by construction. Runs inside the caller's
 * transaction so a failure here rolls back the order and inventory
 * changes made earlier in the same transaction (see order.service.js).
 */
async function createSalesJournalEntry({ orderId, amount, transaction }) {
  if (amount <= 0) throw ApiError.badRequest('Journal entry amount must be positive');

  const entry = await JournalEntry.create(
    { referenceId: orderId, date: new Date(), description: `Sales order ${orderId}` },
    { transaction }
  );

  const lines = await JournalEntryLine.bulkCreate(
    [
      { journalEntryId: entry.id, account: 'Accounts Receivable', debit: amount, credit: 0 },
      { journalEntryId: entry.id, account: 'Sales Revenue', debit: 0, credit: amount },
    ],
    { transaction }
  );

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);
  if (totalDebit !== totalCredit) {
    // Defensive invariant check; should be unreachable given the fixed two-line shape above.
    throw ApiError.internal('Journal entry is unbalanced: total debit must equal total credit');
  }

  return entry;
}

module.exports = { createSalesJournalEntry };
