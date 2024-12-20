"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

export function CancelSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await axios.get('/api/subscription/check');
        const data = response.data;
        setHasActiveSubscription(data.hasActiveSubscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };
    
    checkSubscription();
  }, []);

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.post('/api/subscription/cancel');

      const data = response.data;

      if (response.status !== 200) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      toast({
        description: t('subscription.cancel.success'),
      });
      
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        description: t('subscription.cancel.error'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasActiveSubscription) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive"
          className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 
                     transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {t('subscription.cancel.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gradient-to-br from-white to-slate-50 
                                   dark:from-slate-950 dark:to-slate-900 
                                   border-2 border-red-200 dark:border-red-900
                                   transition-all duration-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r 
                                     from-red-600 to-red-400 bg-clip-text text-transparent">
            {t('subscription.cancel.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
            {t('subscription.cancel.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 
                                      dark:bg-slate-800 dark:hover:bg-slate-700
                                      transition-all duration-200">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-gradient-to-r from-red-600 to-red-500 
                     hover:from-red-500 hover:to-red-400
                     text-white font-medium
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                {t('common.processing')}
              </div>
            ) : (
              t('subscription.cancel.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 