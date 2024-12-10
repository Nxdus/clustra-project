import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

interface UpgradeButtonProps {
  isAnnual: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'prominent';
}

export function UpgradeButton({ 
  isAnnual, 
  children, 
  variant = 'default' 
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAnnual })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // เปิด Stripe Checkout ในหน้าต่างใหม่
      window.location.href = data.url;

    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถดำเนินการชำระเงินได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleUpgrade}
      disabled={loading}
      className={cn(
        "relative group transition-all duration-200",
        variant === 'prominent' ? [
          "w-full bg-gradient-to-r from-blue-600 to-blue-500",
          "hover:from-blue-500 hover:to-blue-400",
          "shadow-sm hover:shadow-md",
          "border-none",
          "text-white font-medium"
        ] : [
          "bg-gradient-to-r from-slate-100 to-slate-50",
          "hover:from-slate-50 hover:to-white",
          "dark:from-slate-800 dark:to-slate-900",
          "dark:hover:from-slate-700 dark:hover:to-slate-800",
          "border border-slate-200 dark:border-slate-700",
          "shadow-sm hover:shadow"
        ]
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className={cn(
              "h-4 w-4 animate-spin",
              variant === 'prominent' ? "text-white/70" : "text-blue-500"
            )} />
            <span>กำลังดำเนินการ...</span>
          </>
        ) : (
          <>
            <span>{children}</span>
            <ArrowRight className={cn(
              "w-4 h-4 transition-transform duration-200",
              "group-hover:translate-x-0.5",
              variant === 'prominent' ? "text-white/70" : "text-blue-500"
            )} />
          </>
        )}
      </div>

      {/* Decorative gradient border */}
      <div className={cn(
        "absolute inset-0 rounded-md opacity-0 group-hover:opacity-100",
        "transition-opacity duration-200 pointer-events-none",
        "-z-10 blur-sm",
        variant === 'prominent' 
          ? "bg-gradient-to-r from-blue-400 to-blue-300" 
          : "bg-gradient-to-r from-blue-200 to-blue-100"
      )} />
    </Button>
  );
} 