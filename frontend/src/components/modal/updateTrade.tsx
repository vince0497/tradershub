import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { Trade } from '@/types';

interface IUpdateTradeProps {
  trade: Trade;
  onConfirm: (trade: Trade) => void | Promise<void>;
}

const UpdateTrade: React.FunctionComponent<IUpdateTradeProps> = ({ trade, onConfirm }) => {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    symbol: trade.symbol,
    side: trade.side,
    quantity: String(trade.quantity),
    price: String(trade.price),
    trader: trade.trader,
    book: trade.book,
    counterparty: trade.counterparty,
    status: trade.status,
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm({
        symbol: trade.symbol,
        side: trade.side,
        quantity: String(trade.quantity),
        price: String(trade.price),
        trader: trade.trader,
        book: trade.book,
        counterparty: trade.counterparty,
        status: trade.status,
      });
    }

    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const symbol = form.symbol.trim().toUpperCase();
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!symbol || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
      alert('Please enter a valid symbol, quantity, and price.');
      return;
    }

    setSaving(true);

    try {
      await onConfirm({
        ...trade,
        symbol,
        side: form.side,
        quantity,
        price,
        trader: form.trader.trim(),
        book: form.book.trim(),
        counterparty: form.counterparty.trim(),
        status: form.status.trim(),
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${trade.symbol} trade`} />
        }>
        <Pencil />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update trade</DialogTitle>
          <DialogDescription>Edit the trade details and save your changes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="update-trade-fields">
            <label>
              Symbol
              <input value={form.symbol} onChange={(event) => updateField('symbol', event.target.value)} />
            </label>
            <label>
              Side
              <select value={form.side} onChange={(event) => updateField('side', event.target.value)}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>
            <label>
              Quantity
              <input type="number" min="0" step="any" value={form.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
            </label>
            <label>
              Price
              <input type="number" min="0" step="any" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
            </label>
            <label>
              Trader
              <input value={form.trader} onChange={(event) => updateField('trader', event.target.value)} />
            </label>
            <label>
              Book
              <input value={form.book} onChange={(event) => updateField('book', event.target.value)} />
            </label>
            <label>
              Counterparty
              <input value={form.counterparty} onChange={(event) => updateField('counterparty', event.target.value)} />
            </label>
            <label>
              Status
              <input value={form.status} onChange={(event) => updateField('status', event.target.value)} />
            </label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTrade;
