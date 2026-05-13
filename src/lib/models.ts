import mongoose, { Schema, Document } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  image: { type: String },
  googleId: { type: String, required: true, unique: true },
}, { timestamps: true });

const IncomeSchema = new Schema({
  userId: { type: String, required: true },
  sourceName: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['Monthly', 'Weekly', 'Bi-weekly', 'One-time'], default: 'Monthly' },
  date: { type: Date, default: Date.now },
  month: { type: Number }, // 0-11
  year: { type: Number },
}, { timestamps: true });

const ExpenseSchema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  bankId: { type: String },
}, { timestamps: true });

const CardSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  last6Digits: { type: String, required: true },
  totalDue: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 },
  usedLimit: { type: Number, default: 0 },
  type: { type: String, enum: ['EMI', 'Monthly'], default: 'Monthly' },
  billingDate: { type: Number, default: 1 },
  dueDate: { type: Number, default: null }, // Day of month (1-31) when bill payment is due
  lastBillingUpdate: { type: Date },
  paymentHistory: [{
    amount: Number,
    date: Date,
    bankId: String,
    notes: String
  }]
}, { timestamps: true });

const EMISchema = new Schema({
  userId: { type: String, required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: false },
  name: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  numberOfMonths: { type: Number, required: true },
  monthlyAmount: { type: Number, required: true },
  remainingMonths: { type: Number, required: true },
  paidMonths: { type: Number, default: 0 },
  currentMonth: { type: Number, default: 1 },
  paymentHistory: [{
    month: Number,
    amount: Number,
    date: Date,
    bankId: String,
    paymentSource: String,
    notes: String
  }]
}, { timestamps: true });

const BankSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  last4Digits: { type: String, required: true },
  balance: { type: Number, default: 0 },
}, { timestamps: true });

const BankTransactionSchema = new Schema({
  userId: { type: String, required: true },
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  category: { type: String, enum: ['EMI', 'card', 'expense', 'manual', 'income'], required: true },
  note: { type: String },
  date: { type: Date, default: Date.now },
  reference: { type: String },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Income = mongoose.models.Income || mongoose.model('Income', IncomeSchema);
export const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);
export const EMI = mongoose.models.EMI || mongoose.model('EMI', EMISchema);
export const Bank = mongoose.models.Bank || mongoose.model('Bank', BankSchema);
export const BankTransaction = mongoose.models.BankTransaction || mongoose.model('BankTransaction', BankTransactionSchema);

const NoteSchema = new Schema({
  userId: { type: String, required: true },
  month: { type: Number, required: true }, // 0-11
  year: { type: Number, required: true },
  content: { type: String, default: '' },
  tags: [{ type: String }],
}, { timestamps: true });

export const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);
