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
import { Trash2 } from 'lucide-react';

interface IDeleteTradeProps {
  symbol: string;
  onConfirm: () => void | Promise<void>;
}

const DeleteTrade: React.FunctionComponent<IDeleteTradeProps> = ({ symbol, onConfirm }) => {
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setDeleting(true);

    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${symbol} trade`} />
        }>
        <Trash2 />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this trade?</DialogTitle>
          <DialogDescription>
            This will cancel the {symbol} trade. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={deleting} />}>
            Cancel
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Canceling...' : 'Cancel trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTrade;
